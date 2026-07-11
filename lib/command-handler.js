const import_koishi = require("koishi");

class CommandHandler {
  constructor() {
    this.ctx = null;
    this.config = null;
    this.modules = null;
  }

  init(ctx, config, modules) {
    this.ctx = ctx;
    this.config = config;
    this.modules = modules;
    
    this.registerCommands();
    this.registerMiddleware();
    this.startSubscriptionChecker();
  }

  registerCommands() {
    const logger = this.ctx.logger("booth-get");

    this.ctx.command("摊位 <id>")
      .action(async ({ session }, id) => {
        if (!id) return "请输入商品ID";
        try {
          const item = await this.getBoothItem(id);
          if (!item) return "商品获取失败";
          
          if (this.checkR18(item)) {
            return "该商品可能包含R18内容，已跳过";
          }
          
          const relatedItems = await this.fetchRelatedItems(item);
          const html = this.modules.cardGenerator.generateCardHTML(item, relatedItems, this.config);
          const buffer = await this.modules.cardGenerator.captureCardHTML(html, this.config);
          
          return buffer ? import_koishi.h.image(buffer, "image/png") : "卡片生成失败";
        } catch (error) {
          logger.warn(error);
          return "卡片生成失败";
        }
      });

    this.ctx.command("摊位名称 <query:text>")
      .option('author', '-a <author> 指定作者名称')
      .action(async ({ session, options }, query) => {
        if (!query) return "请输入搜索关键词";
        return await this.handleSearchCommand(session, query, options.author);
      });

    this.ctx.command("摊位作者 <authorName:text>")
      .action(async ({ session }, authorName) => {
        if (!authorName) return "请输入作者名称";
        return await this.handleAuthorCommand(session, authorName);
      });

    this.ctx.command("摊位订阅 <target>")
      .action(async ({ session }, target) => {
        if (!target) return "请输入作者名或 Booth 链接";
        const success = await this.modules.subscriptionManager.addUserSubscription(
          session.platform, session.userId, target
        );
        return success ? `✅ 已订阅：${target}` : `⚠️ 你已经订阅过 ${target} 了`;
      });

    this.ctx.command("摊位退订 <target>")
      .action(async ({ session }, target) => {
        if (!target) return "请输入作者名或 Booth 链接";
        const success = await this.modules.subscriptionManager.removeUserSubscription(
          session.platform, session.userId, target
        );
        return success ? `❌ 已取消订阅：${target}` : "⚠️ 你还没有订阅此作者";
      });

    this.ctx.command("摊位订阅列表")
      .action(async ({ session }) => {
        const subs = await this.modules.subscriptionManager.getUserSubscriptions(
          session.platform, session.userId
        );
        return subs.length > 0 ? `📌 你订阅的作者有：\n${subs.join("\n")}` : "📭 你还没有订阅任何作者";
      });

    this.ctx.command("摊位群组订阅 <target>")
      .channelFields(['id'])
      .action(async ({ session }, target) => {
        if (!target) return "请输入作者名或 Booth 链接";
        if (!session.channelId) return "此命令只能在群组内使用";
        
        const success = await this.modules.subscriptionManager.addGroupSubscription(
          session.platform, session.channelId, target
        );
        return success ? `✅ 群组已订阅：${target}` : `⚠️ 群组已经订阅过 ${target} 了`;
      });

    this.ctx.command("摊位群组退订 <target>")
      .channelFields(['id'])
      .action(async ({ session }, target) => {
        if (!target) return "请输入作者名或 Booth 链接";
        if (!session.channelId) return "此命令只能在群组内使用";
        
        const success = await this.modules.subscriptionManager.removeGroupSubscription(
          session.platform, session.channelId, target
        );
        return success ? `❌ 群组已取消订阅：${target}` : "⚠️ 群组还没有订阅此作者";
      });

    this.ctx.command("摊位群组订阅列表")
      .channelFields(['id'])
      .action(async ({ session }) => {
        if (!session.channelId) return "此命令只能在群组内使用";
        
        const subs = await this.modules.subscriptionManager.getGroupSubscriptions(
          session.platform, session.channelId
        );
        return subs.length > 0 ? `📌 群组订阅的作者有：\n${subs.join("\n")}` : "📭 群组还没有订阅任何作者";
      });

    // 移除了"折扣群组订阅"和"折扣群组退订"两个命令
  }

  registerMiddleware() {
    this.ctx.middleware(async (session, next) => {
      const boothUrlRegex = /https:\/\/booth.pm\/[\w-]+\/items\/(\d+)/;
      const boothAuthorUrlRegex = /https:\/\/([\w-]+)\.booth\.pm(?:\/items(?:\/\d+)?)?/;
      const match = session.content.match(boothUrlRegex);
      const authorMatch = session.content.match(boothAuthorUrlRegex);

      if (match) {
        const itemId = match[1];
        try {
          const item = await this.getBoothItem(itemId);
          if (!item) return next();
          
          if (this.checkR18(item)) {
            await session.send("该商品可能包含R18内容，已跳过");
            return "";
          }
          
          const relatedItems = await this.fetchRelatedItems(item);
          const html = this.modules.cardGenerator.generateCardHTML(item, relatedItems, this.config);
          const buffer = await this.modules.cardGenerator.captureCardHTML(html, this.config);
          
          if (buffer) {
            await session.send(import_koishi.h.image(buffer, "image/png"));
            return "";
          }
        } catch (error) {
          this.ctx.logger("booth-get").warn("链接解析失败:", error);
        }
      } else if (authorMatch) {
        const authorName = authorMatch[1];
        const itemId = (authorMatch[0].match(/\/items\/(\d+)/) || [])[1];
        try {
          if (itemId) {
            const item = await this.getBoothItem(itemId);
            if (!item) return next();
            
            if (this.checkR18(item)) {
              await session.send("该商品可能包含R18内容，已跳过");
              return "";
            }
            
            const relatedItems = await this.fetchRelatedItems(item);
            const html = this.modules.cardGenerator.generateCardHTML(item, relatedItems, this.config);
            const buffer = await this.modules.cardGenerator.captureCardHTML(html, this.config);
            
            if (buffer) {
              await session.send(import_koishi.h.image(buffer, "image/png"));
              return "";
            }
          } else {
            const items = await this.fetchAuthorItems(authorName, 6);
            const html = this.generateAuthorShopCardHTML(authorName, items);
            const buffer = await this.modules.cardGenerator.captureCardHTML(html, this.config);
            
            if (buffer) {
              await session.send(import_koishi.h.image(buffer, "image/png"));
              return "";
            }
          }
        } catch (error) {
          this.ctx.logger("booth-get").warn("作者链接解析失败:", error);
        }
      }
      return next();
    });
  }

  startSubscriptionChecker() {
    this.ctx.setInterval(async () => {
      const logger = this.ctx.logger("booth-get");
      const subs = await this.modules.subscriptionManager.loadJSON(this.modules.subscriptionManager.SUBS_FILE);
      const authorItems = await this.modules.subscriptionManager.loadJSON(this.modules.subscriptionManager.AUTHOR_ITEMS_FILE);
      const checkedAuthors = new Set();
      
      for (const userKey in subs) {
        for (const authorUrl of subs[userKey]) {
          if (!authorUrl) continue;
          if (checkedAuthors.has(authorUrl)) continue;
          checkedAuthors.add(authorUrl);
          
          try {
            const m = authorUrl.match(/https?:\/\/([^./]+)\.booth\.pm/i);
            if (!m) continue;
            const authorName = m[1];
            const items = await this.fetchAuthorItems(authorName, 6);
            const latestIds = items.map(i => i.id).filter(Boolean);
            const oldIds = authorItems[authorUrl] || [];
            const newIds = latestIds.filter(id => !oldIds.includes(id));
            
            if (newIds.length > 0) {
              const newItems = items.filter(i => newIds.includes(i.id));
              await this.modules.subscriptionManager.updateAuthorItems(authorUrl, latestIds);
              await this.notifySubscribers(authorUrl, newItems);
            }
          } catch (e) {
            logger.warn("检测作者新作失败:", e);
          }
        }
      }
    }, (this.config.updateInterval || 30) * 60 * 1000);
  }

  async getBoothItem(id) {
    try {
      const page = await this.ctx.puppeteer.page();
      
      try {
        await page.setRequestInterception(true);
        page.on('request', (request) => {
          const resourceType = request.resourceType();
          if (['stylesheet', 'font'].includes(resourceType)) {
            request.abort();
          } else {
            request.continue();
          }
        });

        const itemUrl = `https://booth.pm/zh-cn/items/${id}`;
        this.ctx.logger("booth-get").info(`访问商品页: ${itemUrl}`);
        
        await page.goto(itemUrl, { 
          waitUntil: 'domcontentloaded', 
          timeout: this.config.loadTimeout 
        }).catch(() => {});

        // 等待页面加载
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 从HTML中提取商品信息
        const itemData = await page.evaluate(() => {
          // 尝试从data属性或meta标签获取JSON数据
          let data = {};
          
          // 方法1: 查找包含商品数据的script标签
          const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
          for (const script of scripts) {
            try {
              const json = JSON.parse(script.textContent);
              if (json.name || json.productID) {
                data = json;
                break;
              }
            } catch (e) {}
          }
          
          // 方法2: 从页面元素提取
          const title = data.name || 
                       document.querySelector('h1')?.textContent?.trim() ||
                       document.querySelector('.item-title')?.textContent?.trim() || '';
          
          const priceText = data.offers?.price ||
                           document.querySelector('.price')?.textContent?.trim() ||
                           document.querySelector('[data-price]')?.getAttribute('data-price') || '0';
          const price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;
          
          // 调试：输出页面中所有img标签的src
          const allImages = Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            class: img.className,
            alt: img.alt?.substring(0, 50)
          }));
          console.log(`页面中所有图片:`, JSON.stringify(allImages.filter(i => i.src && !i.src.includes('placeholder'))));
          
          // 主商品图片 - 从HTML中提取，需要匹配当前商品ID
          let imageUrl = '';
          const currentItemId = String(window.location.pathname.split('/').pop());  // 从URL获取当前商品ID
          console.log(`当前商品ID:`, currentItemId);
          
          // 方法1: 查找包含当前商品ID的booth.pximg.net图片，并过滤掉小尺寸缩略图
          const allMatchingImages = Array.from(document.querySelectorAll(`img[src*="/i/${currentItemId}/"]`));
          console.log(`方法1原始匹配到 ${allMatchingImages.length} 张图片`);
          
          const matchingImages = allMatchingImages
            .filter(img => {
              // 排除头像和图标
              if (img.src.includes('/users/') || img.src.includes('/icon_image/')) return false;
              
              // 提取图片尺寸
              const sizeMatch = img.src.match(/\/(\d+)x\d+_/);
              const size = sizeMatch ? parseInt(sizeMatch[1]) : 0;
              
              // 尺寸为0表示是完整尺寸大图，保留
              // 尺寸>=150的中等图片也保留
              // 只过滤掉<150的小缩略图
              if (size > 0 && size < 150) {
                console.log(`  过滤掉小缩略图 (${size}x${size}): ${img.src.substring(0, 100)}...`);
                return false;
              }
              
              console.log(`  保留图片 (${size === 0 ? '完整尺寸' : size + 'x' + size}): ${img.src.substring(0, 100)}...`);
              return true;
            });
          
          if (matchingImages.length > 0) {
            // 按尺寸排序，取最大的（尺寸为0表示完整尺寸，优先级最高）
            matchingImages.sort((a, b) => {
              const aSizeMatch = a.src.match(/\/(\d+)x\d+_/);
              const bSizeMatch = b.src.match(/\/(\d+)x\d+_/);
              const aSize = aSizeMatch ? parseInt(aSizeMatch[1]) : 9999;  // 0尺寸视为最大
              const bSize = bSizeMatch ? parseInt(bSizeMatch[1]) : 9999;
              return bSize - aSize;
            });
            
            imageUrl = matchingImages[0].src;
            const finalSizeMatch = imageUrl.match(/\/(\d+)x\d+_/);
            const finalSize = finalSizeMatch ? parseInt(finalSizeMatch[1]) : 0;
            console.log(`通过方法1提取主图（共${matchingImages.length}张，取第1张）:`, imageUrl);
            console.log(`最终主图尺寸: ${finalSize === 0 ? '完整尺寸（大图）' : finalSize + 'x' + finalSize}`);
          }
          
          // 方法2: 从og:image meta标签获取
          if (!imageUrl) {
            imageUrl = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
            if (imageUrl) console.log(`通过方法2提取主图:`, imageUrl);
          }
          
          // 方法3: 使用通用选择器
          if (!imageUrl) {
            imageUrl = document.querySelector('.market-item-detail-item-image')?.src ||
                      document.querySelector('#item_image img')?.src ||
                      document.querySelector('.item-main-image img')?.src ||
                      document.querySelector('[class*="main"] img')?.src || '';
            if (imageUrl) console.log(`通过方法3提取主图:`, imageUrl);
          }
          
          console.log(`最终主图URL:`, imageUrl);
          
          // 作者/店铺信息 - 从HTML文本提取
          const authorName = document.querySelector('.shop-name')?.textContent?.trim() ||
                            document.querySelector('.author-name')?.textContent?.trim() ||
                            document.querySelector('[class*="shop"] [class*="name"]')?.textContent?.trim() ||
                            document.querySelector('a[href*=".booth.pm"] span')?.textContent?.trim() || '';
          
          // 作者头像 - 从HTML中提取
          let authorThumbnail = '';
          
          // 方法1: 查找users目录下的头像图片
          const userImages = Array.from(document.querySelectorAll('img[src*="/users/"][src*="/icon_image/"]'));
          if (userImages.length > 0) {
            authorThumbnail = userImages[0].src;
            console.log(`通过方法1提取头像:`, authorThumbnail);
          }
          
          // 方法2: 从booth.pm链接中的img获取
          if (!authorThumbnail) {
            authorThumbnail = document.querySelector('a[href*=".booth.pm"] img')?.src || '';
            if (authorThumbnail) console.log(`通过方法2提取头像:`, authorThumbnail);
          }
          
          // 方法3: 其他可能的选择器
          if (!authorThumbnail) {
            authorThumbnail = document.querySelector('.shop-icon img')?.src ||
                             document.querySelector('.author-avatar img')?.src ||
                             document.querySelector('[class*="avatar"] img')?.src ||
                             document.querySelector('[class*="icon"] img')?.src || '';
            if (authorThumbnail) console.log(`通过方法3提取头像:`, authorThumbnail);
          }
          
          console.log(`最终作者头像URL:`, authorThumbnail);
          
          // 店铺URL - 从链接中提取子域名
          let shopSubdomain = '';
          const shopLink = document.querySelector('a[href*=".booth.pm"]') ||
                          document.querySelector('.shop-link');
          if (shopLink) {
            const href = shopLink.href;
            const match = href.match(/https?:\/\/([^.]+)\.booth\.pm/);
            if (match) {
              shopSubdomain = match[1];
            }
          }
          
          // 描述
          const description = data.description ||
                             document.querySelector('.description')?.textContent?.trim() ||
                             document.querySelector('.item-description')?.textContent?.trim() || '';
          
          // 分类
          const category = document.querySelector('.category')?.textContent?.trim() || '';
          
          // 收藏数 - 尝试多种选择器
          let likesText = document.querySelector('.likes-count')?.textContent?.trim() ||
                         document.querySelector('[data-likes]')?.getAttribute('data-likes') ||
                         document.querySelector('.item-likes')?.textContent?.trim() ||
                         document.querySelector('.favorite-count')?.textContent?.trim() ||
                         document.querySelector('.typography-14')?.textContent?.trim() ||
                         document.querySelector('[class*="like"]')?.textContent?.trim() || '0';
          
          console.log(`收藏数原始文本:`, likesText);
          
          // 从文本中提取数字（例如 "♥ 1234" → "1234"）
          const likesMatch = likesText.match(/\d+/);
          const likes = likesMatch ? parseInt(likesMatch[0]) : 0;
          console.log(`提取的收藏数:`, likes);
          
          return {
            title,
            price,
            image_url: imageUrl,
            description,
            category,
            author: authorName,
            author_thumbnail_url: authorThumbnail,
            shop_subdomain: shopSubdomain,
            likes
          };
        });

        this.ctx.logger("booth-get").info(`提取到子域名: ${itemData.shop_subdomain}`);
        this.ctx.logger("booth-get").info(`作者: ${itemData.author}`);

        await page.close();
        
        return {
          id,
          ...itemData,
          tags: []
        };
      } catch (error) {
        await page.close();
        throw error;
      }
    } catch (error) {
      this.ctx.logger("booth-get").error(`获取商品 ${id} 失败:`, error);
      return null;
    }
  }

  async fetchRelatedItems(item) {
    try {
      const page = await this.ctx.puppeteer.page();
      
      try {
        await page.setRequestInterception(true);
        page.on('request', (request) => {
          const resourceType = request.resourceType();
          if (['stylesheet', 'font'].includes(resourceType)) {
            request.abort();
          } else {
            request.continue();
          }
        });

        // 使用商品的shop_subdomain构建店铺URL
        const shopSubdomain = item.shop_subdomain;
        
        if (!shopSubdomain) {
          this.ctx.logger("booth-get").warn(`商品 ${item.id} 没有店铺子域名`);
          await page.close();
          return [];
        }
        
        const itemsPageUrl = `https://${shopSubdomain}.booth.pm/items`;
        
        this.ctx.logger("booth-get").info(`访问店铺: https://${shopSubdomain}.booth.pm/`);
        this.ctx.logger("booth-get").info(`商品页: ${itemsPageUrl}`);
        
        await page.goto(itemsPageUrl, { 
          waitUntil: 'domcontentloaded', 
          timeout: this.config.loadTimeout 
        }).catch(() => {});

        // 等待商品列表加载 - 增加等待时间并使用更智能的等待策略
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 尝试等待商品容器出现
        try {
          await page.waitForSelector('.js-mount-point-shop-item-card, [data-item], .item-card, .product-card', { timeout: 5000 });
        } catch (e) {
          this.ctx.logger("booth-get").warn('等待商品容器超时，继续尝试解析');
        }

        const items = await page.evaluate((limit, currentItemId) => {
          console.log(`开始解析商品列表，当前商品ID: ${currentItemId}`);
          
          // 输出页面中所有可能的商品相关元素
          const allCards = Array.from(document.querySelectorAll('[class*="card"], [class*="item"], [data-item]'));
          console.log(`找到 ${allCards.length} 个可能包含商品的元素`);
          
          if (allCards.length > 0) {
            console.log(`前3个元素的className:`, allCards.slice(0, 3).map(el => el.className.substring(0, 100)));
          }
          
          // 尝试多种选择器查找商品
          let itemElements = Array.from(document.querySelectorAll('.js-mount-point-shop-item-card'));
          console.log(`选择器1 (.js-mount-point-shop-item-card): ${itemElements.length} 个元素`);
          
          if (itemElements.length === 0) {
            itemElements = Array.from(document.querySelectorAll('[data-item]'));
            console.log(`选择器2 ([data-item]): ${itemElements.length} 个元素`);
          }
          
          if (itemElements.length === 0) {
            itemElements = Array.from(document.querySelectorAll('.item-card'));
            console.log(`选择器3 (.item-card): ${itemElements.length} 个元素`);
          }
          
          if (itemElements.length === 0) {
            itemElements = Array.from(document.querySelectorAll('.product-card'));
            console.log(`选择器4 (.product-card): ${itemElements.length} 个元素`);
          }
          
          // 如果还是没找到，尝试更通用的选择器
          if (itemElements.length === 0) {
            // 查找包含商品链接的元素
            itemElements = Array.from(document.querySelectorAll('a[href*="/items/"]'));
            console.log(`选择器5 (a[href*="/items/"]): ${itemElements.length} 个元素`);
            
            // 去重：只保留最外层的卡片容器
            const uniqueElements = [];
            const seen = new Set();
            for (const el of itemElements) {
              // 向上查找最近的卡片容器
              let parent = el.closest('.js-mount-point-shop-item-card, [data-item], .item-card, .product-card, [class*="card"]');
              if (!parent) {
                parent = el.parentElement;
              }
              if (parent && !seen.has(parent)) {
                seen.add(parent);
                uniqueElements.push(parent);
              }
            }
            itemElements = uniqueElements;
            console.log(`去重后: ${itemElements.length} 个唯一商品卡片`);
          }
          
          console.log(`最终找到 ${itemElements.length} 个商品元素`);
          
          // 如果找到了元素，输出第一个元素的HTML结构用于调试
          if (itemElements.length > 0) {
            const firstEl = itemElements[0];
            console.log(`第一个商品元素HTML片段:`, firstEl.outerHTML.substring(0, 500));
            console.log(`第一个商品元素的data属性:`, {
              'data-item': firstEl.getAttribute('data-item'),
              'data-item-id': firstEl.getAttribute('data-item-id')
            });
          }
          
          const allItems = itemElements.map((el, index) => {
            // 尝试从data属性或HTML中解析商品信息
            let dataItem = {};
            try {
              const dataAttr = el.getAttribute('data-item');
              if (dataAttr) {
                dataItem = JSON.parse(dataAttr);
              }
            } catch (e) {}

            const title = dataItem.name || 
                         el.querySelector('.item-title')?.textContent?.trim() || 
                         el.querySelector('.title')?.textContent?.trim() ||
                         el.querySelector('[class*="title"]')?.textContent?.trim() ||
                         el.textContent?.substring(0, 100)?.trim() || '';
            
            const price = dataItem.price || 
                         parseInt(el.querySelector('.price')?.textContent?.replace(/[^\d]/g, '')) ||
                         parseInt(el.querySelector('[class*="price"]')?.textContent?.replace(/[^\d]/g, '')) || 0;
            
            // 图片URL - 优先使用data中的图片
            let imageUrl = dataItem.thumbnail_image_urls?.[0] || 
                          dataItem.images?.[0]?.original ||
                          el.querySelector('img')?.src ||
                          el.querySelector('.swap-image img')?.src ||
                          el.querySelector('[class*="image"] img')?.src || '';
            
            // 提取商品ID
            const itemId = String(dataItem.id || 
                          el.getAttribute('data-item-id') ||
                          el.querySelector('a')?.href?.match(/\/items\/(\d+)/)?.[1] || '');
            
            console.log(`商品${index + 1}: ID=${itemId}, 标题=${title.substring(0, 30)}, 价格=${price}, 图片=${imageUrl ? '有' : '无'}`);
            
            return {
              id: itemId,
              title: title,
              price: price,
              image_url: imageUrl
            };
          });
          
          console.log(`所有商品IDs:`, allItems.map(i => i.id));
          
          // 过滤掉当前商品和空ID的商品
          const filtered = allItems.filter(work => {
            if (!work.id) {
              console.log(`过滤掉空ID商品:`, work.title);
              return false;
            }
            if (work.id === String(currentItemId)) {
              console.log(`过滤掉当前商品 ID=${work.id}:`, work.title);
              return false;
            }
            return true;
          });
          
          console.log(`过滤后剩余 ${filtered.length} 个商品`);
          return filtered.slice(0, limit);
        }, 6, item.id);

        this.ctx.logger("booth-get").info(`解析到 ${items.length} 个商品（排除当前商品后）`);
        if (items.length > 0) {
          this.ctx.logger("booth-get").info(`第一个商品:`, items[0]);
        }

        await page.close();
        return items.slice(0, 3);
      } catch (error) {
        await page.close();
        this.ctx.logger("booth-get").warn('获取关联作品失败:', error);
        return [];
      }
    } catch (error) {
      this.ctx.logger("booth-get").warn('获取关联作品失败:', error);
      return [];
    }
  }

  async fetchAuthorItems(authorName, limit = 6) {
    try {
      const page = await this.ctx.puppeteer.page();
      
      try {
        await page.setRequestInterception(true);
        page.on('request', (request) => {
          const resourceType = request.resourceType();
          if (['stylesheet', 'font'].includes(resourceType)) {
            request.abort();
          } else {
            request.continue();
          }
        });

        await page.goto(`https://${authorName}.booth.pm/items`, { 
          waitUntil: 'domcontentloaded', 
          timeout: this.config.loadTimeout
        }).catch(()=>{});
        await page.waitForSelector('.item-list', { timeout: 5000 }).catch(() => {});

        const items = await page.evaluate((limit) => {
          const itemElements = Array.from(document.querySelectorAll('.js-mount-point-shop-item-card'));
          return itemElements.slice(0, limit).map(el => {
            try {
              const dataItem = JSON.parse(el.getAttribute('data-item'));
              const imageUrl = dataItem.thumbnail_image_urls?.[0] || dataItem.images?.[0]?.original || el.querySelector('.swap-image img')?.src || 'https://s2.booth.pm/static-images/item/empty-preview.png';
              let price = dataItem.price;
              if (typeof price === 'string') {
                const priceMatch = price.match(/[\d,]+/);
                if (priceMatch) {
                  price = parseInt(priceMatch[0].replace(/,/g, '')) || 0;
                } else {
                  price = 0;
                }
              }
              return {
                id: dataItem.id,
                title: dataItem.name,
                price: price,
                image_url: imageUrl,
                author: dataItem.shop?.name,
                author_thumbnail_url: dataItem.shop?.thumbnail_url
              };
            } catch (e) {
              try {
                const titleEl = el.querySelector('.item-name a');
                const priceEl = el.querySelector('.price');
                const imgEl = el.querySelector('.swap-image img');
                let price = 0;
                if (priceEl) {
                  const priceText = priceEl.textContent.trim();
                  const priceMatch = priceText.match(/[\d,]+/);
                  if (priceMatch) {
                    price = parseInt(priceMatch[0].replace(/,/g, '')) || 0;
                  }
                }
                return {
                  id: null,
                  title: titleEl ? titleEl.textContent.trim() : '未知商品',
                  price: price,
                  image_url: imgEl ? imgEl.src : 'https://s2.booth.pm/static-images/item/empty-preview.png',
                  author: null,
                  author_thumbnail_url: null
                };
              } catch (e2) {
                return null;
              }
            }
          }).filter(item => item !== null && item.image_url);
        }, limit);

        await page.close();
        return items;
      } catch (error) {
        await page.close();
        throw error;
      }
    } catch (error) {
      return [];
    }
  }

  checkR18(item) {
    if (!this.config.enableR18Check) return false;
    
    if (item.tags && Array.isArray(item.tags)) {
      const hasR18Tag = item.tags.some(tag => 
        this.config.r18Tags.some(r18Tag => 
          tag.name && tag.name.toLowerCase().includes(r18Tag.toLowerCase())
        )
      );
      if (hasR18Tag) return true;
    }
    
    if (item.title) {
      const hasR18InTitle = this.config.r18Tags.some(r18Tag => 
        item.title.toLowerCase().includes(r18Tag.toLowerCase())
      );
      if (hasR18InTitle) return true;
    }

    if (item.description) {
      const hasR18InDesc = this.config.r18Tags.some(r18Tag => 
        item.description.toLowerCase().includes(r18Tag.toLowerCase())
      );
      if (hasR18InDesc) return true;
    }
    
    return false;
  }

  generateAuthorShopCardHTML(authorName, items = []) {
    return `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Montserrat:wght@600;700;800&display=swap');
          body {
            margin: 0;
            padding: 0;
            font-family: 'Noto Sans SC', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .container {
            width: 640px;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            position: relative;
          }
          .header {
            background: linear-gradient(90deg, #9b59b6, #3498db);
            padding: 25px;
            text-align: center;
            position: relative;
            color: white;
          }
          .header::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><circle cx="20" cy="20" r="10" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="50" r="15" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="8" fill="rgba(255,255,255,0.1)"/></svg>');
            background-size: 100px 100px;
          }
          .label {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            padding: 8px 20px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 15px;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }
          .booth-logo {
            font-family: 'Montserrat', sans-serif;
            font-weight: 800;
            font-size: 36px;
            letter-spacing: 2px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
          }
          .author-name-card {
            font-size: 24px;
            font-weight: 600;
            margin-top: 10px;
          }
          .content {
            padding: 30px;
          }
          .shop-info {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
          }
          .shop-title {
            font-size: 24px;
            color: #2c3e50;
            margin-bottom: 10px;
            font-weight: 700;
          }
          .shop-description {
            color: #7f8c8d;
            font-size: 16px;
          }
          .items-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 20px;
          }
          .item-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
          }
          .item-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.15);
          }
          .item-image {
            height: 150px;
            background-size: cover;
            background-position: center;
          }
          .item-info {
            padding: 15px;
          }
          .item-title {
            font-size: 14px;
            margin-bottom: 10px;
            color: #2c3e50;
            height: 40px;
            overflow: hidden;
          }
          .item-price {
            font-size: 18px;
            font-weight: 700;
            color: #e74c3c;
          }
          .footer {
            background: #2c3e50;
            padding: 20px;
            text-align: center;
            color: #ecf0f1;
            font-size: 14px;
          }
          .link {
            color: #3498db;
            text-decoration: none;
            font-weight: 500;
          }
          .link:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="label">AUTHOR'S SHOP</div>
            <div class="booth-logo">${authorName}.booth.pm</div>
          </div>
          
          <div class="content">
            <div class="shop-info">
              <div class="shop-title">${authorName} 的店铺</div>
              <div class="shop-description">以下是该作者的部分商品</div>
            </div>

            ${items.length > 0 ? `
            <div class="items-grid">
              ${items.map(item => `
                <div class="item-card">
                  <div class="item-image" style="background-image:url('${item.image_url}')"></div>
                  <div class="item-info">
                    <div class="item-title">${item.title.slice(0, 25)}${item.title.length > 25 ? '...' : ''}</div>
                    <div class="item-price">¥${item.price?.toLocaleString?.() ?? item.price}</div>
                  </div>
                </div>
              `).join('')}
            </div>
            ` : `
            <div style="text-align: center; padding: 40px; color: #7f8c8d;">
              <h3>暂无商品信息</h3>
              <p>该作者店铺暂无商品或获取商品信息失败</p>
            </div>
            `}
          </div>

          <div class="footer">
            由VRCBBS提供 | BOOTH链接: 
            <a href="https://${authorName}.booth.pm/items/" 
               class="link">
              https://${authorName}.booth.pm/items/
            </a>
          </div>
        </div>
      </body>
    </html>`;
  }

  async handleSearchCommand(session, query, authorFilter) {
    let searchQuery = query;
    let actualAuthorFilter = authorFilter;
    
    if (!actualAuthorFilter && query.includes(' ')) {
      const parts = query.split(' ');
      if (parts.length >= 2) {
        actualAuthorFilter = parts.pop();
        searchQuery = parts.join(' ');
      }
    }

    let searchUrl = `https://booth.pm/zh-cn/search/${encodeURIComponent(searchQuery)}?in_stock=true`;
    
    const tags = ['3Dモデル', 'Vrchat'];
    const tagsParams = tags.map(tag => `tags[]=${encodeURIComponent(tag)}`).join('&');
    searchUrl += `&${tagsParams}&min_price=4500`;

    const page = await this.ctx.puppeteer.page();
    
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    try {
      let retries = 3;
      while (retries > 0) {
        try {
          await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: this.config.loadTimeout });
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      const content = await page.content();
      
      const itemRegex = /item-card__wrap"[\s\S]*?id="item_(\d+)"[\s\S]*?<h2[^>]*class="[^"]*item-card__title[^"]*"[^>]*>([^<]+)<\/h2>/g;
      let matches = [];
      let match;
      
      while ((match = itemRegex.exec(content)) !== null) {
        matches.push({
          id: match[1],
          title: match[2].trim()
        });
      }
      
      if (matches.length === 0) {
        const simpleRegex = /item-card__wrap"[\s\S]*?id="item_(\d+)"/g;
        let simpleMatch;
        while ((simpleMatch = simpleRegex.exec(content)) !== null) {
          matches.push({
            id: simpleMatch[1],
            title: '未知商品'
          });
        }
      }

      if (matches.length === 0) {
        if (content.includes('検索結果はありません') || 
            content.includes('没有找到') || 
            content.includes('検索条件に合致する作品は見つかりませんでした') ||
            content.includes('該当する作品はありません')) {
          await page.close();
          return "没有找到相关商品";
        }
        await page.close();
        return "没有找到相关商品";
      }

      let selectedItemId;
      if (actualAuthorFilter) {
        for (const item of matches) {
          try {
            const itemDetail = await this.getBoothItem(item.id);
            if (itemDetail && itemDetail.author && 
                itemDetail.author.toLowerCase().includes(actualAuthorFilter.toLowerCase())) {
              selectedItemId = item.id;
              break;
            }
          } catch (err) {
            continue;
          }
        }
        
        if (!selectedItemId) {
          await page.close();
          return `找不到作者"${actualAuthorFilter}"的相关商品`;
        }
      } else {
        selectedItemId = matches[0].id;
      }

      try {
        const item = await this.getBoothItem(selectedItemId);
        if (!item) {
          await page.close();
          return "商品获取失败";
        }
        
        if (this.checkR18(item)) {
          await page.close();
          return "搜索到的商品可能包含R18内容，已跳过";
        }
        
        const relatedItems = await this.fetchRelatedItems(item);
        const html = this.modules.cardGenerator.generateCardHTML(item, relatedItems, this.config);
        const buffer = await this.modules.cardGenerator.captureCardHTML(html, this.config);
        
        if (!buffer) {
          await page.close();
          return "卡片生成失败";
        }
        await page.close();
        return import_koishi.h.image(buffer, "image/png");
      } catch (error) {
        this.ctx.logger("booth-get").error('卡片生成失败:', error);
        await page.close();
        return "卡片生成失败";
      }
    } catch (error) {
      this.ctx.logger("booth-get").error('搜索失败:', error);
      await page.close();
      if (error.message && (error.message.includes('ERR_EMPTY_RESPONSE') || error.message.includes('net::ERR_CONNECTION_TIMED_OUT'))) {
        return "搜索失败，连接BOOTH网站超时，请稍后再试";
      }
      return "搜索失败";
    }
  }

  async handleAuthorCommand(session, authorName) {
    try {
      const searchUrl = `https://booth.pm/zh-cn/search/${encodeURIComponent(authorName)}?in_stock=true`;
      const page = await this.ctx.puppeteer.page();
      
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: this.config.loadTimeout });
        
        const content = await page.content();
        
        const brandRegex = /data-product-brand="([^"]+)"/g;
        const brands = new Set();
        let brandMatch;
        
        while ((brandMatch = brandRegex.exec(content)) !== null) {
          brands.add(brandMatch[1]);
        }
        
        const brandArray = Array.from(brands);
        
        await page.close();

        if (brandArray.length > 0) {
          const matchedAuthor = brandArray[0];
          const items = await this.fetchAuthorItems(matchedAuthor, 6);
          const html = this.generateAuthorShopCardHTML(matchedAuthor, items);
          const buffer = await this.modules.cardGenerator.captureCardHTML(html, this.config);
          if (buffer) {
            return import_koishi.h.image(buffer, "image/png");
          } else {
            return "作者店铺卡片生成失败";
          }
        } else {
          return `未找到作者 "${authorName}" 的店铺`;
        }
      } catch (error) {
        await page.close();
        this.ctx.logger("booth-get").error('搜索作者失败:', error);
        return "搜索作者失败";
      }
    } catch (error) {
      this.ctx.logger("booth-get").error('处理作者搜索失败:', error);
      return "处理作者搜索失败";
    }
  }

  async notifySubscribers(authorUrl, newItems) {
    const { userKeys, groupKeys } = await this.modules.subscriptionManager.getSubscribersForAuthor(authorUrl);
    
    for (const userKey of userKeys) {
      const parts = userKey.split(':');
      if (parts.length < 3) continue;
      const platform = parts[1];
      const userId = parts.slice(2).join(':');
      
      for (const it of newItems) {
        try {
          const item = await this.getBoothItem(it.id);
          if (!item || this.checkR18(item)) continue;
          
          const relatedItems = await this.fetchRelatedItems(item);
          const html = this.modules.cardGenerator.generateCardHTML(item, relatedItems, this.config);
          const buffer = await this.modules.cardGenerator.captureCardHTML(html, this.config);
          if (!buffer) continue;
          
          const text = `🆕 作者 ${authorUrl} 发布了新商品：${it.title}\n商品链接：https://booth.pm/zh-cn/items/${it.id}`;
          
          const bot = this.ctx.bots[0];
          if (typeof bot.sendPrivateMessage === 'function') {
            await bot.sendPrivateMessage(userId, [text, import_koishi.h.image(buffer, "image/png")]);
            break;
          }
          if (typeof bot.sendMessage === 'function') {
            await bot.sendMessage(userId, [text, import_koishi.h.image(buffer, "image/png")]);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    for (const groupKey of groupKeys) {
      const parts = groupKey.split(':');
      if (parts.length < 3) continue;
      const platform = parts[1];
      const channelId = parts.slice(2).join(':');
      
      for (const it of newItems) {
        try {
          const item = await this.getBoothItem(it.id);
          if (!item || this.checkR18(item)) continue;
          
          const relatedItems = await this.fetchRelatedItems(item);
          const html = this.modules.cardGenerator.generateCardHTML(item, relatedItems, this.config);
          const buffer = await this.modules.cardGenerator.captureCardHTML(html, this.config);
          if (!buffer) continue;
          
          const text = `🆕 作者 ${authorUrl} 发布了新商品：${it.title}\n商品链接：https://booth.pm/zh-cn/items/${it.id}`;
          
          await this.ctx.bots[0].sendMessage(channelId, [text, import_koishi.h.image(buffer, "image/png")]);
          break;
        } catch (e) {
          this.ctx.logger("booth-get").warn(`向群组 ${channelId} 推送消息失败:`, e);
        }
      }
    }
  }
}

module.exports = new CommandHandler();