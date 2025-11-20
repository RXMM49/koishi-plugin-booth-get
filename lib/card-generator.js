const import_koishi = require("koishi");

class CardGenerator {
  constructor() {
    this.ctx = null;
    this.config = null;
  }

  init(ctx, config) {
    this.ctx = ctx;
    this.config = config;
  }

  generateCardHTML(item, relatedItems = []) {
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

  generateDiscountCardHTML(item) {
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
            background: linear-gradient(135deg, #ff6b6b 0%, #ffa502 100%);
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
          .discount-badge {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 10px 15px;
            border-radius: 30px;
            font-weight: 700;
            font-size: 18px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
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
          .price-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #fff9f9;
            border-radius: 12px;
            border: 2px dashed #e74c3c;
          }
          .original-price {
            font-size: 24px;
            color: #7f8c8d;
            text-decoration: line-through;
          }
          .current-price {
            font-size: 32px;
            font-weight: 700;
            color: #e74c3c;
          }
          .discount-info {
            text-align: center;
            font-size: 18px;
            color: #e74c3c;
            font-weight: 600;
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="discount-badge">-${item.discount_rate}% OFF</div>
            <div class="label">DISCOUNT ITEM</div>
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

            <div class="price-section">
              <div class="original-price">¥${item.original_price.toLocaleString()}</div>
              <div class="current-price">¥${item.price.toLocaleString()}</div>
            </div>
            
            <div class="discount-info">
              节省 ¥${(item.original_price - item.price).toLocaleString()} (${item.discount_rate}% 折扣)
            </div>
            
            <div class="tags">
              ${(item.tags || []).slice(0, 5).map(tag => `<div class="tag">${tag.name}</div>`).join('')}
            </div>
          </div>

          <div class="footer">
            由VRCBBS提供 | 商品链接: 
            <a href="${item.url}" class="link">${item.url}</a>
          </div>
        </div>
      </body>
    </html>`;
  }

  async captureCardHTML(html, config) {
    const page = await this.ctx.puppeteer.page();
    try {
      await page.setRequestInterception(true);
      page.on('request', (request) => request.continue());

      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: config.loadTimeout
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
      this.ctx.logger("booth-get").error('生成卡片失败:', error);
      return null;
    } finally {
      await page.close();
    }
  }
}

module.exports = new CardGenerator();