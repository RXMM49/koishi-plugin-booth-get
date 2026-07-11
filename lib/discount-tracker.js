const fs = require('fs').promises;
const path = require('path');
const import_koishi = require("koishi");

class DiscountTracker {
  constructor() {
    this.ctx = null;
    this.config = null;
    this.DISCOUNT_ITEMS_FILE = path.join(__dirname, "discount_items.json");
    this.DISCOUNT_GROUPS_FILE = path.join(__dirname, "discount_groups.json");
    this.discountCache = new Map();
    this.CACHE_DURATION = 24 * 60 * 60 * 1000;
  }

  init(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    
    if (config.enableDiscountTracking) {
      this.startDiscountTracking();
    }
  }

  cleanupExpiredCache() {
    const now = Date.now();
    for (const [id, timestamp] of this.discountCache.entries()) {
      if (now - timestamp > this.CACHE_DURATION) {
        this.discountCache.delete(id);
      }
    }
  }

  isCached(itemId) {
    const timestamp = this.discountCache.get(itemId);
    if (!timestamp) return false;
    
    if (Date.now() - timestamp > this.CACHE_DURATION) {
      this.discountCache.delete(itemId);
      return false;
    }
    return true;
  }

  addToCache(itemId) {
    this.discountCache.set(itemId, Date.now());
  }

  async loadJSON(file, def = {}) {
    try {
      const raw = await fs.readFile(file, "utf8");
      return JSON.parse(raw);
    } catch (e) {
      return def;
    }
  }

  async saveJSON(file, data) {
    await fs.mkdir(path.dirname(file), { recursive: true }).catch(() => {});
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
  }

  async searchDiscountItems() {
    const logger = this.ctx.logger("booth-discount");
    const page = await this.ctx.puppeteer.page();
    
    try {
      const tagsParam = this.config.targetTags.map(tag => `tags[]=${encodeURIComponent(tag)}`).join('&');
      const searchUrl = `https://booth.pm/zh-cn/search?sort=new&in_stock=true&${tagsParam}`;
      
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.goto(searchUrl, { 
        waitUntil: 'networkidle0', 
        timeout: this.config.loadTimeout 
      });

      await page.waitForSelector('.item-list', { timeout: 10000 }).catch(() => {});

      const items = await page.evaluate(() => {
        const itemElements = Array.from(document.querySelectorAll('.js-mount-point-shop-item-card'));
        return itemElements.map(el => {
          try {
            const dataItem = JSON.parse(el.getAttribute('data-item'));
            
            const priceEl = el.querySelector('.price');
            const originalPriceEl = el.querySelector('.original-price');
            
            let originalPrice = dataItem.price;
            let discountPrice = dataItem.price;
            let discountRate = 0;
            
            if (originalPriceEl) {
              const originalText = originalPriceEl.textContent.trim();
              const originalMatch = originalText.match(/[\d,]+/);
              if (originalMatch) {
                originalPrice = parseInt(originalMatch[0].replace(/,/g, '')) || dataItem.price;
              }
            }
            
            if (priceEl && originalPriceEl) {
              const priceText = priceEl.textContent.trim();
              const priceMatch = priceText.match(/[\d,]+/);
              if (priceMatch) {
                discountPrice = parseInt(priceMatch[0].replace(/,/g, '')) || dataItem.price;
              }
            }
            
            if (originalPrice > discountPrice) {
              discountRate = Math.round((1 - discountPrice / originalPrice) * 100);
            }
            
            const imageUrl = dataItem.thumbnail_image_urls?.[0] || 
                            dataItem.images?.[0]?.original || 
                            el.querySelector('.swap-image img')?.src || 
                            'https://s2.booth.pm/static-images/item/empty-preview.png';

            return {
              id: dataItem.id,
              title: dataItem.name,
              price: discountPrice,
              original_price: originalPrice,
              discount_rate: discountRate,
              image_url: imageUrl,
              author: dataItem.shop?.name,
              author_thumbnail_url: dataItem.shop?.thumbnail_url,
              url: `https://booth.pm/zh-cn/items/${dataItem.id}`,
              tags: dataItem.tags || []
            };
          } catch (e) {
            return null;
          }
        }).filter(item => item !== null && item.discount_rate > 0);
      });

      await page.close();
      return items;
    } catch (error) {
      logger.error('搜索折扣商品失败:', error);
      await page.close();
      return [];
    }
  }

  async notifyDiscountGroups(discountItems) {
    const logger = this.ctx.logger("booth-discount");
    const cardGenerator = require('./card-generator');
    
    const itemsToPush = discountItems.slice(0, this.config.maxDiscountPushCount || 5);
    
    for (const groupKey of this.config.targetGroups || []) {
      const parts = groupKey.split(':');
      if (parts.length < 3) continue;
      const platform = parts[1];
      const channelId = parts.slice(2).join(':');
      
      for (const item of itemsToPush) {
        try {
          const html = cardGenerator.generateDiscountCardHTML(item);
          const buffer = await cardGenerator.captureCardHTML(html, this.config);
          if (!buffer) continue;
          
          const message = `🎉 发现折扣商品！\n` +
                        `商品链接：${item.url}\n` +
                        `原价：¥${item.original_price.toLocaleString()}\n` +
                        `现价：¥${item.price.toLocaleString()}\n` +
                        `折扣：${item.discount_rate}% OFF\n` +
                        `节省：¥${(item.original_price - item.price).toLocaleString()}`;
          
          await this.ctx.bots[0].sendMessage(channelId, [message, import_koishi.h.image(buffer, "image/png")]);
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          logger.warn(`向群组 ${channelId} 推送折扣信息失败:`, e);
        }
      }
    }
  }

  startDiscountTracking() {
    const logger = this.ctx.logger("booth-discount");
    logger.info('启动折扣商品追踪器');

    this.ctx.setInterval(async () => {
      try {
        this.cleanupExpiredCache();
        
        logger.info('开始检查折扣商品...');
        const discountItems = await this.searchDiscountItems();
        const knownItems = await this.loadJSON(this.DISCOUNT_ITEMS_FILE);
        const newDiscountItems = [];
        
        for (const item of discountItems) {
          if (!this.isCached(item.id)) {
            if (!knownItems[item.id] || knownItems[item.id].discount_rate !== item.discount_rate) {
              newDiscountItems.push(item);
              this.addToCache(item.id);
              knownItems[item.id] = {
                ...item,
                first_seen: knownItems[item.id]?.first_seen || Date.now(),
                last_updated: Date.now()
              };
            }
          }
        }
        
        if (newDiscountItems.length > 0) {
          logger.info(`发现 ${newDiscountItems.length} 个新的折扣商品`);
          await this.saveJSON(this.DISCOUNT_ITEMS_FILE, knownItems);
          await this.notifyDiscountGroups(newDiscountItems);
        } else {
          logger.info('未发现新的折扣商品');
        }
      } catch (error) {
        logger.error('折扣商品检查失败:', error);
      }
    }, (this.config.discountCheckInterval || 60) * 60 * 1000);
  }

  async addDiscountGroupSubscription(platform, channelId) {
    const groupKey = `group:${platform}:${channelId}`;
    const discountGroups = await this.loadJSON(this.DISCOUNT_GROUPS_FILE);
    
    if (!discountGroups[groupKey]) {
      discountGroups[groupKey] = true;
      await this.saveJSON(this.DISCOUNT_GROUPS_FILE, discountGroups);
      return true;
    }
    return false;
  }

  async removeDiscountGroupSubscription(platform, channelId) {
    const groupKey = `group:${platform}:${channelId}`;
    const discountGroups = await this.loadJSON(this.DISCOUNT_GROUPS_FILE);
    
    if (discountGroups[groupKey]) {
      delete discountGroups[groupKey];
      await this.saveJSON(this.DISCOUNT_GROUPS_FILE, discountGroups);
      return true;
    }
    return false;
  }
}

module.exports = new DiscountTracker();