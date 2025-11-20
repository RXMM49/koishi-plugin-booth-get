const import_koishi = require("koishi");

class DiscordCommandHandler {
  constructor() {
    this.ctx = null;
    this.config = null;
    this.modules = null;
  }

  init(ctx, config, modules) {
    this.ctx = ctx;
    this.config = config;
    this.modules = modules;
    
    if (this.config.enableDiscordCommands) {
      this.registerDiscordCommands();
    }
  }

  registerDiscordCommands() {
    const logger = this.ctx.logger("booth-get");

    this.ctx.command("booth.item <id>", "获取 BOOTH 商品详情")
      .action(async ({ session }, id) => {
        if (session.platform !== 'discord') return;
        if (!id) return "请输入商品ID";
        try {
          const item = await this.getBoothItem(id);
          if (!item) return "商品获取失败";
          
          if (this.checkR18(item)) {
            return "该商品可能包含R18内容，已跳过";
          }
          
          const relatedItems = await this.fetchRelatedItems(item.author);
          const html = this.modules.cardGenerator.generateCardHTML(item, relatedItems);
          const buffer = await this.modules.cardGenerator.captureCardHTML(html, this.config);
          
          return buffer ? import_koishi.h.image(buffer, "image/png") : "卡片生成失败";
        } catch (error) {
          logger.warn(error);
          return "卡片生成失败";
        }
      });

    this.ctx.command("booth.search <query:text>", "搜索 BOOTH 商品")
      .option('author', '-a <author> 指定作者名称')
      .action(async ({ session, options }, query) => {
        if (session.platform !== 'discord') return;
        if (!query) return "请输入搜索关键词";
        return await this.handleSearchCommand(session, query, options.author);
      });

    this.ctx.command("booth.author <authorName:text>", "查看作者店铺信息")
      .action(async ({ session }, authorName) => {
        if (session.platform !== 'discord') return;
        if (!authorName) return "请输入作者名称";
        return await this.handleAuthorCommand(session, authorName);
      });

    this.ctx.command("booth.subscribe <target>", "订阅作者新作品通知")
      .action(async ({ session }, target) => {
        if (session.platform !== 'discord') return;
        if (!target) return "请输入作者名或 Booth 链接";
        const success = await this.modules.subscriptionManager.addUserSubscription(
          session.platform, session.userId, target
        );
        return success ? `✅ 已订阅：${target}` : `⚠️ 你已经订阅过 ${target} 了`;
      });

    this.ctx.command("booth.unsubscribe <target>", "取消订阅作者")
      .action(async ({ session }, target) => {
        if (session.platform !== 'discord') return;
        if (!target) return "请输入作者名或 Booth 链接";
        const success = await this.modules.subscriptionManager.removeUserSubscription(
          session.platform, session.userId, target
        );
        return success ? `❌ 已取消订阅：${target}` : "⚠️ 你还没有订阅此作者";
      });

    this.ctx.command("booth.subscriptions", "查看我的订阅列表")
      .action(async ({ session }) => {
        if (session.platform !== 'discord') return;
        const subs = await this.modules.subscriptionManager.getUserSubscriptions(
          session.platform, session.userId
        );
        return subs.length > 0 ? `📌 你订阅的作者有：\n${subs.join("\n")}` : "📭 你还没有订阅任何作者";
      });

    this.ctx.command("booth.groupSubscribe <target>", "群组订阅作者")
      .channelFields(['id'])
      .action(async ({ session }, target) => {
        if (session.platform !== 'discord') return;
        if (!target) return "请输入作者名或 Booth 链接";
        if (!session.channelId) return "此命令只能在群组内使用";
        
        const success = await this.modules.subscriptionManager.addGroupSubscription(
          session.platform, session.channelId, target
        );
        return success ? `✅ 群组已订阅：${target}` : `⚠️ 群组已经订阅过 ${target} 了`;
      });

    this.ctx.command("booth.groupUnsubscribe <target>", "群组取消订阅作者")
      .channelFields(['id'])
      .action(async ({ session }, target) => {
        if (session.platform !== 'discord') return;
        if (!target) return "请输入作者名或 Booth 链接";
        if (!session.channelId) return "此命令只能在群组内使用";
        
        const success = await this.modules.subscriptionManager.removeGroupSubscription(
          session.platform, session.channelId, target
        );
        return success ? `❌ 群组已取消订阅：${target}` : "⚠️ 群组还没有订阅此作者";
      });

    this.ctx.command("booth.groupSubscriptions", "查看群组订阅列表")
      .channelFields(['id'])
      .action(async ({ session }) => {
        if (session.platform !== 'discord') return;
        if (!session.channelId) return "此命令只能在群组内使用";
        
        const subs = await this.modules.subscriptionManager.getGroupSubscriptions(
          session.platform, session.channelId
        );
        return subs.length > 0 ? `📌 群组订阅的作者有：\n${subs.join("\n")}` : "📭 群组还没有订阅任何作者";
      });
  }

  async getBoothItem(id) {
    return this.modules.commandHandler.getBoothItem(id);
  }

  checkR18(item) {
    return this.modules.commandHandler.checkR18(item);
  }

  async fetchRelatedItems(author) {
    return this.modules.commandHandler.fetchRelatedItems(author);
  }

  async handleSearchCommand(session, query, authorFilter) {
    return this.modules.commandHandler.handleSearchCommand(session, query, authorFilter);
  }

  async handleAuthorCommand(session, authorName) {
    return this.modules.commandHandler.handleAuthorCommand(session, authorName);
  }

  generateAuthorShopCardHTML(authorName, items = []) {
    return this.modules.commandHandler.generateAuthorShopCardHTML(authorName, items);
  }

  async fetchAuthorItems(authorName, limit = 6) {
    return this.modules.commandHandler.fetchAuthorItems(authorName, limit);
  }
}

module.exports = new DiscordCommandHandler();