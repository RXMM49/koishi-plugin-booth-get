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

  generateCardHTML(item, relatedItems = [], customConfig = {}) {
    const cardWidth = customConfig.cardWidth || 900;
    const leftColumnWidth = customConfig.leftColumnWidth || 280;
    const topGradientColor1 = customConfig.topGradientColor1 || '#e8bdf6';
    const topGradientColor2 = customConfig.topGradientColor2 || '#fceabb';
    const footerGradientColor1 = customConfig.footerGradientColor1 || '#fceabb';
    const footerGradientColor2 = customConfig.footerGradientColor2 || '#e8bdf6';
    const priceTagBgColor = customConfig.priceTagBgColor || '#ff66b2';
    const infoBubbleBgColor = customConfig.infoBubbleBgColor || '#aafcf5';
    const textColor = customConfig.textColor || '#d63384';
    const shopBannerBgColor = customConfig.shopBannerBgColor || '#fcfcd0';

    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BOOTH Card Replica</title>
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #f0f0f0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                padding: 20px;
            }

            .card-container {
                width: ${cardWidth}px;
                max-width: 100%;
                background-color: #fff;
                border-radius: 30px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                position: relative;
            }

            .top-gradient-bg {
                height: 60px;
                background: linear-gradient(to right, ${topGradientColor1}, ${topGradientColor2});
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                z-index: 0;
            }

            .header-logo-area {
                position: absolute;
                top: 20px;
                right: 30px;
                z-index: 10;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .booth-text {
                font-weight: bold;
                font-size: 18px;
                color: #333;
            }

            .booth-icon {
                width: 30px;
                height: 30px;
                background-color: #ff4d4d;
                border-radius: 4px;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-size: 12px;
            }

            .content-wrapper {
                display: flex;
                padding: 20px 30px 40px 30px;
                position: relative;
                z-index: 5;
                margin-top: 40px;
            }

            .left-column {
                width: ${leftColumnWidth}px;
                flex-shrink: 0;
                margin-right: 30px;
            }

            .main-image {
                width: 100%;
                aspect-ratio: 1/1;
                background-color: #ddd;
                border-radius: 8px;
                object-fit: cover;
                margin-bottom: 10px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }

            .price-row {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }

            .price-tag {
                background-color: ${priceTagBgColor};
                color: white;
                font-weight: bold;
                font-size: 20px;
                padding: 5px 10px;
                border-radius: 4px;
                margin-right: 15px;
            }

            .like-count {
                display: flex;
                align-items: center;
                color: #666;
                font-weight: bold;
                font-size: 16px;
            }

            .heart-icon {
                color: #333;
                margin-right: 5px;
                font-size: 18px;
            }

            .item-title {
                font-size: 14px;
                color: #333;
                line-height: 1.4;
                margin-bottom: 5px;
            }

            .item-subtitle {
                font-size: 12px;
                color: #666;
                margin-bottom: 20px;
            }

            .other-works-title {
                font-size: 14px;
                font-weight: bold;
                color: #333;
                margin-bottom: 10px;
            }

            .thumbnails {
                display: flex;
                gap: 10px;
            }

            .thumb-img {
                width: 70px;
                height: 70px;
                background-color: #eee;
                border-radius: 6px;
                object-fit: cover;
                border: 1px solid #eee;
            }

            .right-column {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
            }

            .shop-banner {
                width: 100%;
                height: 80px;
                background-color: ${shopBannerBgColor};
                border-radius: 8px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 20px;
                position: relative;
                overflow: hidden;
                border: 1px solid #eee;
            }

            .banner-text {
                font-family: 'Courier New', Courier, monospace;
                font-weight: bold;
                font-size: 24px;
                color: #fff;
                text-shadow: 1px 1px 0 #aaa;
                letter-spacing: 1px;
            }

            .banner-char {
                height: 90%;
                position: absolute;
                right: 0;
                bottom: 0;
            }

            .author-info {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
            }

            .author-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: #ddd;
                margin-right: 10px;
                object-fit: cover;
            }

            .author-name {
                color: ${textColor};
                font-weight: bold;
                font-size: 14px;
            }

            .info-bubble {
                background-color: ${infoBubbleBgColor};
                border-radius: 15px;
                padding: 25px;
                color: ${textColor};
                font-size: 13px;
                line-height: 1.6;
                position: relative;
            }

            .bubble-header {
                font-weight: bold;
                margin-bottom: 10px;
                display: block;
            }

            .bubble-text p {
                margin-bottom: 10px;
            }

            .bubble-link {
                display: block;
                margin-top: 20px;
                text-align: right;
                color: ${textColor};
                font-weight: bold;
                text-decoration: none;
                font-size: 14px;
            }

            .footer-bar {
                background: linear-gradient(to right, ${footerGradientColor1}, ${footerGradientColor2});
                padding: 15px 30px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid rgba(0,0,0,0.05);
            }

            .footer-left {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .footer-center {
                font-weight: bold;
                color: #333;
                font-size: 14px;
            }

            @media (max-width: 768px) {
                .content-wrapper {
                    flex-direction: column;
                }
                .left-column {
                    width: 100%;
                    margin-right: 0;
                    margin-bottom: 20px;
                }
                .shop-banner {
                    height: 60px;
                }
                .banner-text {
                    font-size: 18px;
                }
            }
        </style>
    </head>
    <body>
        <div class="card-container">
            <div class="top-gradient-bg"></div>

            <div class="header-logo-area">
                <span class="booth-text">BOOTH</span>
                <div class="booth-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                </div>
            </div>

            <div class="content-wrapper">
                <div class="left-column">
                    <img src="${item.image_url}" alt="${item.title || 'Item'}" class="main-image" onerror="this.style.backgroundColor='#f0f0f0'; this.alt='图片加载失败'">

                    <div class="price-row">
                        <div class="price-tag">¥${item.price ? item.price.toLocaleString() : '0'}</div>
                        <div class="like-count">
                            <span class="heart-icon">♥</span> ${item.likes || 0}
                        </div>
                    </div>

                    <div class="item-title">${item.title || 'Untitled Item'}</div>
                    <div class="item-subtitle">${item.category || '3D Models/3D Characters'}</div>

                    <div class="other-works-title">其余作品</div>
                    <div class="thumbnails">
                        ${(relatedItems || []).slice(0, 3).map(work => {
                            if (work.image_url && work.image_url.trim() !== '') {
                                return `<img src="${work.image_url}" class="thumb-img" onerror="this.style.display='none'">`;
                            }
                            return '';
                        }).filter(Boolean).join('')}
                        ${Array(Math.max(0, 3 - (relatedItems || []).filter(w => w.image_url && w.image_url.trim() !== '').length)).fill(0).map((_, i) => `
                            <div style="width:70px;height:70px;background:#f0f0f0;border-radius:6px;"></div>
                        `).join('')}
                    </div>
                </div>

                <div class="right-column">
                    <div class="shop-banner">
                        <div class="banner-text">${item.author || 'Unknown'}'s SHOP</div>
                        ${item.author_thumbnail_url ? `<img src="${item.author_thumbnail_url}" class="banner-char" style="opacity: 0.5; height:90%; position:absolute; right:0; bottom:0;" onerror="this.style.display='none'">` : ''}
                    </div>

                    <div class="author-info">
                        ${item.author_thumbnail_url ? `<img src="${item.author_thumbnail_url}" alt="Avatar" class="author-avatar" onerror="this.style.backgroundColor='#ddd'">` : '<div class="author-avatar" style="background:#ddd;"></div>'}
                        <span class="author-name">作者：${item.author || 'Unknown'}</span>
                    </div>

                    <div class="info-bubble">
                        <span class="bubble-header">🏠 商品说明 🏠</span>
                        <div class="bubble-text">
                            <p>${(item.description || '暂无详细说明').slice(0, 200)}${(item.description || '').length > 200 ? '...' : ''}</p>
                        </div>
                        <a href="https://booth.pm/zh-cn/items/${item.id}" class="bubble-link">链接：https://booth.pm/zh-cn/items/${item.id}</a>
                    </div>
                </div>
            </div>

            <div class="footer-bar">
                <div class="footer-left">
                    <span class="booth-text">BOOTH</span>
                    <div class="booth-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                    </div>
                </div>
                <div class="footer-center">
                    由乃花生成 | BOOTH 提供
                </div>
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

      // 获取卡片实际宽度
      const cardWidth = config.cardWidth || 900;
      await page.setViewport({ width: cardWidth + 40, height: 1600 });
      
      // 等待所有图片加载完成（包括主图、头像、缩略图等）
      const imageStatus = await page.evaluate(() => {
        return new Promise((resolve) => {
          const images = Array.from(document.querySelectorAll('img'));
          if (images.length === 0) {
            resolve({ total: 0, loaded: 0, failed: 0, urls: [] });
            return;
          }
          
          let loadedCount = 0;
          let failedCount = 0;
          const totalImages = images.length;
          const results = [];
          
          images.forEach((img, index) => {
            const url = img.src;
            results.push({ url, status: 'pending' });
            
            if (img.complete) {
              if (img.naturalHeight !== 0) {
                loadedCount++;
                results[index].status = 'loaded';
              } else {
                failedCount++;
                results[index].status = 'failed';
              }
              
              if (loadedCount + failedCount === totalImages) {
                resolve({ total: totalImages, loaded: loadedCount, failed: failedCount, urls: results });
              }
            } else {
              img.onload = () => {
                loadedCount++;
                results[index].status = 'loaded';
                if (loadedCount + failedCount === totalImages) {
                  resolve({ total: totalImages, loaded: loadedCount, failed: failedCount, urls: results });
                }
              };
              img.onerror = () => {
                failedCount++;
                results[index].status = 'failed';
                if (loadedCount + failedCount === totalImages) {
                  resolve({ total: totalImages, loaded: loadedCount, failed: failedCount, urls: results });
                }
              };
            }
          });
          
          // 设置超时，最多等待8秒
          setTimeout(() => {
            resolve({ total: totalImages, loaded: loadedCount, failed: failedCount, urls: results });
          }, 8000);
        });
      });

      this.ctx.logger("booth-get").info(`图片加载状态:`, imageStatus);

      // 额外等待一小段时间确保渲染完成
      await new Promise(resolve => setTimeout(resolve, 1000));

      const container = await page.$('.card-container') || await page.$('body');
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