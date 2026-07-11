# koishi-plugin-booth-get

[![NPM](https://img.shields.io/npm/v/koishi-plugin-booth-get)](https://www.npmjs.com/package/koishi-plugin-booth-get)
[![GitHub](https://img.shields.io/github/license/Unbloomed-flowers/koishi-plugin-booth-get)](https://github.com/Unbloomed-flowers/koishi-plugin-booth-get)

# BOOTH 获取插件

基于 Koishi 的 BOOTH 商品信息获取插件，支持商品卡片、订阅通知、折扣追踪。

---

## 命令

| 命令 | 说明 |
|------|------|
| `摊位 <ID>` | 获取商品卡片 |
| `摊位名称 <关键词>` | 搜索商品 |
| `摊位作者 <作者名>` | 查看作者店铺 |
| `摊位订阅 <作者/链接>` | 订阅作者 |
| `摊位退订 <作者/链接>` | 取消订阅 |
| `摊位订阅列表` | 查看订阅列表 |
| `摊位群组订阅 <目标>` | 群组订阅 |
| `摊位群组退订 <目标>` | 群组取消订阅 |
| `摊位群组订阅列表` | 查看群组订阅 |

**Discord 模式**（`enableDiscordCommands: true`）：命令前缀改为 `booth.`（如 `booth.item <ID>`）

**自动解析**：发送 BOOTH 链接自动生成卡片预览。

![BOOTH卡片模板](https://github.com/Unbloomed-flowers/koishi-plugin-booth-get/blob/main/BOOTH模板.png?raw=true)


---

## 配置

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `enableR18Check` | boolean | true | R18 内容过滤 |
| `updateInterval` | number | 30 | 订阅检测间隔（分钟） |
| `enableDiscountTracking` | boolean | true | 折扣追踪 |
| `discountCheckInterval` | number | 60 | 折扣检测间隔（分钟） |
| `enableDiscordCommands` | boolean | false | Discord 命令模式 |
| `cardWidth` | number | 900 | 卡片宽度（px） |

---

## 安装

```bash
npm install koishi-plugin-booth-get

## 许可证

MIT License
