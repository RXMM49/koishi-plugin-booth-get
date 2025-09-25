var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(src_exports);
var import_koishi = require("koishi");
var fs = require("fs").promises;
var path = require("path");

var name = "booth-get";
var inject = ["puppeteer"];
var Config = import_koishi.Schema.object({
  loadTimeout: import_koishi.Schema.natural().role("ms").description("加载页面的最长时间").default(import_koishi.Time.second * 10),
  idleTimeout: import_koishi.Schema.natural().role("ms").description("等待页面空闲的最长时间").default(import_koishi.Time.second * 30),
  proxyServer: import_koishi.Schema.string().description("代理服务器地址").default("61.216.156.222:60808"),
  enableR18Check: import_koishi.Schema.boolean().description("启用R18内容检测").default(true),
  r18Tags: import_koishi.Schema.array(import_koishi.Schema.string()).description("R18标签").default(["r18", "18禁", "R-18", "R18+", "R-18+", "R18G", "R-18G", "R18G+", "R-18G+", "R18G++", "R-18G++", "R18G+++", "R-18G+++", "R18G++++", "R-18G++++",]),
  updateInterval: import_koishi.Schema.natural().description("检测订阅更新间隔（分钟）").default(30)
}).description("booth-get");

const SUBS_FILE = path.join(__dirname, "subscriptions.json");
const AUTHOR_ITEMS_FILE = path.join(__dirname, "author_items.json");

async function loadJSON(file, def = {}) {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return def;
  }
}

async function saveJSON(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true }).catch(() => {});
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

function normalizeBoothUrl(target) {
  let url = target.trim();
  if (!/^https?:\/\//i.test(url)) {
    if (!url.includes(".booth.pm")) {
      url = `https://${url}.booth.pm`;
    } else {
      url = `https://${url}`.replace(/^https?:\/\//i, "");
    }
  }
  return url.replace(/\/+$/,'');
}

function checkR18(item, config) {
  if (!config.enableR18Check) return false;
  
  if (item.tags && Array.isArray(item.tags)) {
    const hasR18Tag = item.tags.some(tag => 
      config.r18Tags.some(r18Tag => 
        tag.name && tag.name.toLowerCase().includes(r18Tag.toLowerCase())
      )
    );
    if (hasR18Tag) return true;
  }
  
  if (item.title) {
    const hasR18InTitle = config.r18Tags.some(r18Tag => 
      item.title.toLowerCase().includes(r18Tag.toLowerCase())
    );
    if (hasR18InTitle) return true;
  }

  if (item.description) {
    const hasR18InDesc = config.r18Tags.some(r18Tag => 
      item.description.toLowerCase().includes(r18Tag.toLowerCase())
    );
    if (hasR18InDesc) return true;
  }
  
  return false;
}

function generateCardHTML(item, relatedItems = []) {
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
          background: linear-gradient(90deg, #ff6b6b, #ffa502);
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
          background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="0,0 100,100 0,100" fill="rgba(255,255,255,0.1)"/></svg>');
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
        .content {
          padding: 30px;
        }
        .main-image {
          width: 100%;
          height: 320px;
          background: #f0f0f0 url('${item.image_url}') center/cover;
          border-radius: 15px;
          margin-bottom: 25px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.05);
        }
        .product-title {
          font-size: 26px;
          margin: 0 0 20px 0;
          color: #2c3e50;
          font-weight: 700;
          line-height: 1.4;
        }
        .author-section {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 25px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 12px;
          border-left: 4px solid #3498db;
        }
        .author-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 3px solid #fff;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          object-fit: cover;
        }
        .author-info {
          flex: 1;
        }
        .author-name {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 4px;
        }
        .author-label {
          font-size: 14px;
          color: #7f8c8d;
        }
        .price-section {
          font-size: 32px;
          font-weight: 700;
          color: #e74c3c;
          margin-bottom: 30px;
          text-align: center;
          background: #fff9f9;
          padding: 15px;
          border-radius: 12px;
          border: 2px dashed #e74c3c;
        }
        .description {
          color: #34495e;
          line-height: 1.7;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          margin-bottom: 30px;
          font-size: 15px;
        }
        .stats {
          display: flex;
          justify-content: space-around;
          margin-bottom: 30px;
          text-align: center;
        }
        .stat-item {
          padding: 15px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #3498db;
        }
        .stat-label {
          font-size: 14px;
          color: #7f8c8d;
          margin-top: 5px;
        }
        .related-works {
          margin-top: 30px;
          border-top: 1px solid #eee;
          padding-top: 25px;
        }
        .related-title {
          font-size: 20px;
          color: #2c3e50;
          margin-bottom: 20px;
          text-align: center;
          font-weight: 600;
        }
        .works-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        .work-item {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
        }
        .work-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        }
        .work-image {
          height: 100px;
          background-size: cover;
          background-position: center;
        }
        .work-info {
          padding: 12px;
        }
        .work-title {
          font-size: 13px;
          margin-bottom: 8px;
          color: #2c3e50;
          height: 36px;
          overflow: hidden;
        }
        .work-price {
          font-size: 15px;
          font-weight: 600;
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
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 25px;
        }
        .tag {
          background: #e1f0fa;
          color: #3498db;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="label">NEW ARRIVAL</div>
          <div class="booth-logo">BOOTH</div>
        </div>
        
        <div class="content">
          <div class="main-image"></div>
          <h1 class="product-title">${item.title}</h1>
          
          <div class="author-section">
            <img src="${item.author_thumbnail_url || 'https://s2.booth.pm/static-images/user/guest-32.png'}" 
                 class="author-avatar" 
                 alt="作者头像" onerror="this.src='https://s2.booth.pm/static-images/user/guest-32.png'">
            <div class="author-info">
              <div class="author-name">${item.author}</div>
              <div class="author-label">BOOTHクリエイター</div>
            </div>
          </div>

          <div class="price-section">¥${item.price.toLocaleString()}</div>
          
          <div class="stats">
            <div class="stat-item">
              <div class="stat-value">${item.likes || 0}</div>
              <div class="stat-label">收藏数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${item.category || '未分类'}</div>
              <div class="stat-label">分类</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">#${item.id}</div>
              <div class="stat-label">商品ID</div>
            </div>
          </div>
          
          <div class="tags">
            ${(item.tags || []).slice(0, 5).map(tag => `<div class="tag">${tag.name}</div>`).join('')}
          </div>
          
          <div class="description">
            <p>${(item.description || "").slice(0, 300)}${(item.description||"").length > 300 ? '...' : ''}</p>
          </div>

          ${relatedItems && relatedItems.length > 0 ? `
          <div class="related-works">
            <h3 class="related-title">同じ作者の作品</h3>
            <div class="works-grid">
              ${relatedItems.map(work => `
                <div class="work-item">
                  <div class="work-image" style="background-image:url('${work.image_url}')"></div>
                  <div class="work-info">
                    <div class="work-title">${work.title.slice(0, 20)}${work.title.length > 20 ? '...' : ''}</div>
                    <div class="work-price">¥${work.price?.toLocaleString?.() ?? work.price}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          由VRCBBS提供 | BOOTH链接: 
          <a href="https://booth.pm/zh-cn/items/${item.id}" 
             class="link">
            https://booth.pm/zh-cn/items/${item.id}
          </a>
        </div>
      </div>
    </body>
  </html>`;
}

async function getBoothItem(id) {
  try {
    const [itemRes, wishRes] = await Promise.all([
      fetch(`https://booth.pm/zh-cn/items/${id}.json`),
      fetch(`https://accounts.booth.pm/wish_lists.json?item_ids%5B%5D=${id}`)
    ]);

    const itemData = await itemRes.json();
    const wishData = await wishRes.json();

    return {
      id,
      title: itemData.name,
      price: itemData.price,
      image_url: itemData.images?.[0]?.original || null,
      description: itemData.description || "",
      category: itemData.category?.name || "",
      parent_category: itemData.category?.parent?.name || "",
      author: itemData.shop?.name || "",
      author_thumbnail_url: itemData.shop?.thumbnail_url || "",
      likes: (wishData && wishData.wishlists_counts && wishData.wishlists_counts[id]) || 0,
      tags: itemData.tags || []
    };
  } catch (error) {
    return null;
  }
}

async function fetchRelatedItems(author) {
  try {
    const res = await fetch(`https://booth.pm/zh-cn/search.json?q=${encodeURIComponent(author)}&in_stock=true`);
    const data = await res.json();
    return (data.items || [])
      .filter(i => i.shop?.name === author)
      .slice(0, 3)
      .map(item => ({
        id: item.id,
        title: item.name,
        price: item.price,
        image_url: item.images?.[0]?.original
      }));
  } catch (error) {
    return [];
  }
}

async function captureCard(ctx, id, config) {
  const logger = ctx.logger("booth-get");
  const item = await getBoothItem(id);
  if (!item) return null;

  if (checkR18(item, config)) {
    logger.warn(`检测到R18内容，已跳过商品: ${id}`);
    return "R18_CONTENT";
  }

  const relatedItems = await fetchRelatedItems(item.author);

  const html = generateCardHTML(item, relatedItems);

  const page = await ctx.puppeteer.page();
  try {
    await page.setRequestInterception(true);
    page.on('request', (request) => request.continue());

    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: config.loadTimeout || import_koishi.Time.second * 10
    });

    await new Promise(resolve => setTimeout(resolve, 1200));

    await page.setViewport({ width: 640, height: 1200 });
    const container = await page.$('.container') || await page.$('body');
    return await container.screenshot({
      type: 'png',
      encoding: 'binary',
      captureBeyondViewport: false
    });
  } catch (error) {
    logger.error('生成失败:', error);
    return null;
  } finally {
    await page.close();
  }
}

async function fetchAuthorItems(ctx, authorName, limit = 6, configParam) {
  try {
    const page = await ctx.puppeteer.page();
    
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
        waitUntil: 'networkidle0', 
        timeout: (configParam?.loadTimeout || import_koishi.Time.second * 10) 
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
    console.error('获取作者商品失败:', error);
    return [];
  }
}

function generateAuthorShopCardHTML(authorName, items = []) {
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

async function captureAuthorShopCard(ctx, authorName, config) {
  const logger = ctx.logger("booth-get");
  const items = await fetchAuthorItems(ctx, authorName, 6, config);

  const html = generateAuthorShopCardHTML(authorName, items);

  const page = await ctx.puppeteer.page();
  try {
    await page.setRequestInterception(true);
    page.on('request', (request) => request.continue());

    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: config.loadTimeout || import_koishi.Time.second * 10
    });

    await new Promise(resolve => setTimeout(resolve, 1200));

    await page.setViewport({ width: 640, height: 1200 });
    const container = await page.$('.container') || await page.$('body');
    return await container.screenshot({
      type: 'png',
      encoding: 'binary',
      captureBeyondViewport: false
    });
  } catch (error) {
    logger.error('生成失败:', error);
    return null;
  } finally {
    await page.close();
  }
}

function getSimilarity(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigramsA = new Set();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.substring(i, i + 2));
  let matches = 0;
  for (let i = 0; i < b.length - 1; i++) if (bigramsA.has(b.substring(i, i + 2))) matches++;
  return (2 * matches) / (a.length + b.length - 2);
}

function apply(ctx, config) {
  const logger = ctx.logger("booth-get");

  ctx.command("摊位 <id>")
    .action(async ({ session }, id) => {
      if (!id) return "请输入商品ID";
      try {
        const buffer = await captureCard(ctx, id, config);
        if (buffer === "R18_CONTENT") return "该商品可能包含R18内容，已跳过";
        return buffer ? import_koishi.h.image(buffer, "image/png") : "商品获取失败";
      } catch (error) {
        logger.warn(error);
        return "卡片生成失败";
      }
    });

  ctx.command("摊位名称 <query:text>")
    .option('author', '-a <author> 指定作者名称')
    .action(async ({ session, options }, query) => {
      if (!query) return "请输入搜索关键词";

      let searchQuery = query;
      let authorFilter = options.author;
      
      if (!authorFilter && query.includes(' ')) {
        const parts = query.split(' ');
        if (parts.length >= 2) {
          authorFilter = parts.pop();
          searchQuery = parts.join(' ');
        }
      }

      let searchUrl = `https://booth.pm/zh-cn/search/${encodeURIComponent(searchQuery)}?in_stock=true`;
      
      const tags = ['3Dモデル', 'Vrchat'];
      const tagsParams = tags.map(tag => `tags[]=${encodeURIComponent(tag)}`).join('&');
      searchUrl += `&${tagsParams}&min_price=4500`;

      const page = await ctx.puppeteer.page();
      
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
            await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: config.loadTimeout || import_koishi.Time.second * 10 });
            break;
          } catch (error) {
            retries--;
            if (retries === 0) throw error;
            logger.warn(`页面加载失败，重试中... (剩余重试次数: ${retries})`);
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
        if (authorFilter) {
          for (const item of matches) {
            try {
              const itemDetail = await getBoothItem(item.id);
              if (itemDetail && itemDetail.author && 
                  itemDetail.author.toLowerCase().includes(authorFilter.toLowerCase())) {
                selectedItemId = item.id;
                break;
              }
            } catch (err) {
              continue;
            }
          }
          
          if (!selectedItemId) {
            await page.close();
            return `找不到作者"${authorFilter}"的相关商品`;
          }
        } else {
          selectedItemId = matches[0].id;
        }

        try {
          const buffer = await captureCard(ctx, selectedItemId, config);
          if (buffer === "R18_CONTENT") {
            await page.close();
            return "搜索到的商品可能包含R18内容，已跳过";
          }
          if (!buffer) {
            await page.close();
            return "卡片生成失败";
          }
          await page.close();
          return import_koishi.h.image(buffer, "image/png");
        } catch (error) {
          logger.error('卡片生成失败:', error);
          await page.close();
          return "卡片生成失败";
        }
      } catch (error) {
        logger.error('搜索失败:', error);
        await page.close();
        if (error.message && (error.message.includes('ERR_EMPTY_RESPONSE') || error.message.includes('net::ERR_CONNECTION_TIMED_OUT'))) {
          return "搜索失败，连接BOOTH网站超时，请稍后再试";
        }
        return "搜索失败";
      }
    });

  ctx.command("摊位作者 <authorName:text>")
    .action(async ({ session }, authorName) => {
      if (!authorName) return "请输入作者名称";
      
      try {
        const searchUrl = `https://booth.pm/zh-cn/search/${encodeURIComponent(authorName)}?in_stock=true`;
        const page = await ctx.puppeteer.page();
        
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
          await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: config.loadTimeout || import_koishi.Time.second * 10 });
          
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
            const buffer = await captureAuthorShopCard(ctx, matchedAuthor, config);
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
          logger.error('搜索作者失败:', error);
          return "搜索作者失败";
        }
      } catch (error) {
        logger.error('处理作者搜索失败:', error);
        return "处理作者搜索失败";
      }
    });

  ctx.middleware(async (session, next) => {
    const boothUrlRegex = /https:\/\/booth.pm\/[\w-]+\/items\/(\d+)/;
    const boothAuthorUrlRegex = /https:\/\/([\w-]+)\.booth\.pm(?:\/items(?:\/\d+)?)?/;
    const match = session.content.match(boothUrlRegex);
    const authorMatch = session.content.match(boothAuthorUrlRegex);

    if (match) {
      const itemId = match[1];
      try {
        const buffer = await captureCard(ctx, itemId, config);
        if (buffer === "R18_CONTENT") {
          await session.send("该商品可能包含R18内容，已跳过");
          return ""; 
        }
        if (buffer) {
          await session.send(import_koishi.h.image(buffer, "image/png"));
          return ""; 
        } else {
          return "商品解析失败";
        }
      } catch (error) {
        logger.warn("链接解析失败:", error);
        return "商品解析失败";
      }
    } else if (authorMatch) {
      const authorName = authorMatch[1];
      const itemId = (authorMatch[0].match(/\/items\/(\d+)/) || [])[1];
      try {
        if (itemId) {
          const buffer = await captureCard(ctx, itemId, config);
          if (buffer === "R18_CONTENT") {
            await session.send("该商品可能包含R18内容，已跳过");
            return "";
          }
          if (buffer) {
            await session.send(import_koishi.h.image(buffer, "image/png"));
            return "";
          } else {
            return "商品解析失败";
          }
        } else {
          const buffer = await captureAuthorShopCard(ctx, authorName, config);
          if (buffer) {
            await session.send(import_koishi.h.image(buffer, "image/png"));
            return "";
          } else {
            return "作者店铺卡片生成失败";
          }
        }
      } catch (error) {
        logger.warn("作者链接解析失败:", error);
        return "作者链接解析失败";
      }
    }
    return next();
  });

  ctx.command("摊位订阅 <target>")
    .action(async ({ session }, target) => {
      if (!target) return "请输入作者名或 Booth 链接";
      const url = normalizeBoothUrl(target);
      const userKey = `user:${session.platform}:${session.userId}`;
      const subs = await loadJSON(SUBS_FILE);
      subs[userKey] = subs[userKey] || [];
      if (!subs[userKey].includes(url)) {
        subs[userKey].push(url);
        await saveJSON(SUBS_FILE, subs);
        return `✅ 已订阅：${url}`;
      } else {
        return `⚠️ 你已经订阅过 ${url} 了`;
      }
    });

  ctx.command("摊位退订 <target>")
    .action(async ({ session }, target) => {
      if (!target) return "请输入作者名或 Booth 链接";
      const url = normalizeBoothUrl(target);
      const userKey = `user:${session.platform}:${session.userId}`;
      const subs = await loadJSON(SUBS_FILE);
      if (!subs[userKey] || subs[userKey].length === 0) return "⚠️ 你还没有订阅任何作者";
      subs[userKey] = subs[userKey].filter(u => u !== url);
      await saveJSON(SUBS_FILE, subs);
      return `❌ 已取消订阅：${url}`;
    });

  ctx.command("摊位订阅列表")
    .action(async ({ session }) => {
      const userKey = `user:${session.platform}:${session.userId}`;
      const subs = await loadJSON(SUBS_FILE);
      if (!subs[userKey] || subs[userKey].length === 0) return "📭 你还没有订阅任何作者";
      return `📌 你订阅的作者有：\n${subs[userKey].join("\n")}`;
    });

  async function notifySubscribers(authorUrl, newItems) {
    const subs = await loadJSON(SUBS_FILE);
    const userKeys = Object.keys(subs).filter(k => (subs[k] || []).includes(authorUrl));
    if (userKeys.length === 0) return;
    for (const userKey of userKeys) {
      const parts = userKey.split(':');
      if (parts.length < 3) continue;
      const platform = parts[1];
      const userId = parts.slice(2).join(':');
      const bots = Object.values(ctx.bots || {});
      for (const bot of bots) {
        try {
          for (const it of newItems) {
            try {
              const buffer = await captureCard(ctx, it.id, config);
              if (buffer === "R18_CONTENT") continue;
              const text = `🆕 作者 ${authorUrl} 发布了新商品：${it.title}\n商品链接：https://booth.pm/zh-cn/items/${it.id}`;
              if (typeof bot.sendPrivateMessage === 'function') {
                await bot.sendPrivateMessage(userId, [text, import_koishi.h.image(buffer, "image/png")]);
                break;
              }
              if (typeof bot.sendMessage === 'function') {
                await bot.sendMessage(userId, [text, import_koishi.h.image(buffer, "image/png")]);
                break;
              }
              if (typeof bot.send === 'function') {
                await bot.send(userId, [text, import_koishi.h.image(buffer, "image/png")]);
                break;
              }
            } catch (e) {
              // try next bot/fallback
            }
          }
        } catch (e) {
          logger.warn("推送订阅消息失败:", e);
        }
      }
    }
  }

  ctx.setInterval(async () => {
    const subs = await loadJSON(SUBS_FILE);
    const authorItems = await loadJSON(AUTHOR_ITEMS_FILE);
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
          const items = await fetchAuthorItems(ctx, authorName, 6, config);
          const latestIds = items.map(i => i.id).filter(Boolean);
          const oldIds = authorItems[authorUrl] || [];
          const newIds = latestIds.filter(id => !oldIds.includes(id));
          if (newIds.length > 0) {
            const newItems = items.filter(i => newIds.includes(i.id));
            authorItems[authorUrl] = latestIds;
            await saveJSON(AUTHOR_ITEMS_FILE, authorItems);
            await notifySubscribers(authorUrl, newItems);
          }
        } catch (e) {
          logger.warn("检测作者新作失败:", e);
        }
      }
    }
  }, (config.updateInterval || 30) * 60 * 1000);
}

__name(apply, "apply");
