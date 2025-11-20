# koishi-plugin-booth-get

[![NPM](https://img.shields.io/npm/v/koishi-plugin-booth-get)](https://www.npmjs.com/package/koishi-plugin-booth-get)
[![GitHub](https://img.shields.io/github/license/Unbloomed-flowers/koishi-plugin-booth-get)](https://github.com/Unbloomed-flowers/koishi-plugin-booth-get)

## 简介

koishi-plugin-booth-get 是一个用于获取 [BOOTH.pm](https://booth.pm) 平台商品信息的 Koishi 插件。该插件可以获取 VRChat 相关商品、MMD 模型、周边商品、游戏、Live2D 资源等各类内容，并以精美的卡片形式展示。

## 功能特性

- 🎯 **商品搜索**: 支持按商品 ID、关键词、作者名搜索 BOOTH 商品
- 📝 **自动解析**: 自动识别消息中的 BOOTH 链接并生成商品卡片
- 🔔 **订阅系统**: 用户和群组可订阅作者，获取最新商品更新通知
- 💰 **折扣追踪**: 自动追踪指定标签的折扣商品并推送到目标群组
- 🖼️ **精美卡片**: 生成包含商品信息、作者信息、相关推荐的精美 HTML 卡片
- 🚫 **内容过滤**: 可配置 R18 内容检测和过滤
- ⚙️ **高度可配置**: 支持多种配置选项以满足不同需求

## 安装

```bash
npm install koishi-plugin-booth-get
```

## 使用方法

### 基础命令

#### 获取指定商品信息
```
摊位 <商品ID>
```

#### 搜索商品
```
摊位名称 <关键词> [-a <作者>]
```

示例:
```
摊位名称 模型
摊位名称 模型 -a 作者名
```

#### 查看作者店铺
```
摊位作者 <作者名>
```

### 订阅功能

#### 订阅作者
```
摊位订阅 <作者名或链接>
```

#### 取消订阅
```
摊位退订 <作者名或链接>
```

#### 查看订阅列表
```
摊位订阅列表
```

#### 群组订阅作者
```
摊位群组订阅 <作者名或链接>
```

#### 群组取消订阅
```
摊位群组退订 <作者名或链接>
```

#### 查看群组订阅列表
```
摊位群组订阅列表
```

## 配置选项

| 配置项 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| loadTimeout | number | 10000 | 加载页面的最长时间(毫秒) |
| idleTimeout | number | 30000 | 等待页面空闲的最长时间(毫秒) |
| proxyServer | string | "" | 代理服务器地址 |
| enableR18Check | boolean | true | 启用R18内容检测 |
| r18Tags | string[] | ["r18", "18禁", ...] | R18标签列表 |
| updateInterval | number | 30 | 检测订阅更新间隔(分钟) |
| enableDiscountTracking | boolean | true | 启用折扣商品自动追踪 |
| discountCheckInterval | number | 60 | 折扣检测间隔(分钟) |
| maxDiscountPushCount | number | 5 | 每次最大推送商品数量 |
| targetTags | string[] | ["VRChat", "3Dモデル", "Avatar", "VRM"] | 目标标签 |
| targetGroups | string[] | [] | 折扣商品推送目标群组 |

## 模块说明

### Command Handler (命令处理器)
处理所有用户命令，包括商品查询、作者搜索、订阅管理等。

### Card Generator (卡片生成器)
生成精美的 HTML 商品卡片，包括普通商品卡片和折扣商品卡片。

### Subscription Manager (订阅管理器)
管理用户和群组的作者订阅，处理订阅的添加、删除和查询。

### Discount Tracker (折扣追踪器)
定期搜索和追踪折扣商品，将折扣信息推送到指定群组。

## 注意事项

1. 插件依赖 Puppeteer，需要相应的浏览器环境支持
2. BOOTH.pm 网站访问可能受网络环境影响
3. 折扣追踪功能需要配置 `targetGroups` 才能正常工作
4. R18 内容检测可根据需要启用或禁用

## 许可证

MIT License
