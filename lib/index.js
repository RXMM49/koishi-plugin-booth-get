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

const cardGenerator = require('./card-generator');
const subscriptionManager = require('./subscription-manager');
const discountTracker = require('./discount-tracker');
const commandHandler = require('./command-handler');
const commandHandlerDiscord = require('./command-handler-discord');

var name = "koishi-plugin-booth-get";
var inject = ["puppeteer"];

var Config = import_koishi.Schema.object({
  loadTimeout: import_koishi.Schema.natural().role("ms").description("加载页面的最长时间").default(import_koishi.Time.second * 10),
  idleTimeout: import_koishi.Schema.natural().role("ms").description("等待页面空闲的最长时间").default(import_koishi.Time.second * 30),
  proxyServer: import_koishi.Schema.string().description("代理服务器地址").default(""),
  enableR18Check: import_koishi.Schema.boolean().description("启用R18内容检测").default(true),
  r18Tags: import_koishi.Schema.array(import_koishi.Schema.string()).description("R18标签").default(["r18", "18禁", "R-18", "R18+", "R-18+", "R18G", "R-18G", "R18G+", "R-18G+", "R18G++", "R-18G++", "R18G+++", "R-18G+++", "R18G++++", "R-18G++++"]).hidden(),
  updateInterval: import_koishi.Schema.natural().description("检测订阅更新间隔（分钟）").default(30),
  enableDiscountTracking: import_koishi.Schema.boolean().description("启用折扣商品自动追踪").default(true),
  discountCheckInterval: import_koishi.Schema.natural().description("折扣检测间隔（分钟）").default(60),
  maxDiscountPushCount: import_koishi.Schema.number().min(1).max(50).description("每次最大推送商品数量").default(5),
  targetTags: import_koishi.Schema.array(import_koishi.Schema.string()).description("目标标签").default(["VRChat", "3Dモデル", "Avatar", "VRM"]).hidden(),
  targetGroups: import_koishi.Schema.array(import_koishi.Schema.string()).description("折扣商品推送目标群组“ID”").default([]),
  enableDiscordCommands: import_koishi.Schema.boolean().description("是否启用 Discord 专用指令（启用后仅在 Discord 平台生效）").default(false)
}).description("booth-get");

function apply(ctx, config) {
  const logger = ctx.logger("booth-get");
  
  cardGenerator.init(ctx, config);
  subscriptionManager.init(ctx, config);
  discountTracker.init(ctx, config);
  commandHandler.init(ctx, config, {
    cardGenerator,
    subscriptionManager,
    discountTracker
  });
  commandHandlerDiscord.init(ctx, config, {
    cardGenerator,
    subscriptionManager,
    discountTracker
  });
  
  logger.info('BOOTH插件已启动');
}

__name(apply, "apply");
