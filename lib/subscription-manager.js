const fs = require('fs').promises;
const path = require('path');

class SubscriptionManager {
  constructor() {
    this.ctx = null;
    this.config = null;
    this.SUBS_FILE = path.join(__dirname, "subscriptions.json");
    this.GROUP_SUBS_FILE = path.join(__dirname, "group_subscriptions.json");
    this.AUTHOR_ITEMS_FILE = path.join(__dirname, "author_items.json");
  }

  init(ctx, config) {
    this.ctx = ctx;
    this.config = config;
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

  normalizeBoothUrl(target) {
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

  async addUserSubscription(platform, userId, target) {
    const url = this.normalizeBoothUrl(target);
    const userKey = `user:${platform}:${userId}`;
    const subs = await this.loadJSON(this.SUBS_FILE);
    subs[userKey] = subs[userKey] || [];
    
    if (!subs[userKey].includes(url)) {
      subs[userKey].push(url);
      await this.saveJSON(this.SUBS_FILE, subs);
      return true;
    }
    return false;
  }

  async removeUserSubscription(platform, userId, target) {
    const url = this.normalizeBoothUrl(target);
    const userKey = `user:${platform}:${userId}`;
    const subs = await this.loadJSON(this.SUBS_FILE);
    
    if (!subs[userKey] || subs[userKey].length === 0) return false;
    
    const originalLength = subs[userKey].length;
    subs[userKey] = subs[userKey].filter(u => u !== url);
    await this.saveJSON(this.SUBS_FILE, subs);
    return originalLength !== subs[userKey].length;
  }

  async getUserSubscriptions(platform, userId) {
    const userKey = `user:${platform}:${userId}`;
    const subs = await this.loadJSON(this.SUBS_FILE);
    return subs[userKey] || [];
  }

  async addGroupSubscription(platform, channelId, target) {
    const url = this.normalizeBoothUrl(target);
    const groupKey = `group:${platform}:${channelId}`;
    const groupSubs = await this.loadJSON(this.GROUP_SUBS_FILE);
    groupSubs[groupKey] = groupSubs[groupKey] || [];
    
    if (!groupSubs[groupKey].includes(url)) {
      groupSubs[groupKey].push(url);
      await this.saveJSON(this.GROUP_SUBS_FILE, groupSubs);
      return true;
    }
    return false;
  }

  async removeGroupSubscription(platform, channelId, target) {
    const url = this.normalizeBoothUrl(target);
    const groupKey = `group:${platform}:${channelId}`;
    const groupSubs = await this.loadJSON(this.GROUP_SUBS_FILE);
    
    if (!groupSubs[groupKey] || groupSubs[groupKey].length === 0) return false;
    
    const originalLength = groupSubs[groupKey].length;
    groupSubs[groupKey] = groupSubs[groupKey].filter(u => u !== url);
    await this.saveJSON(this.GROUP_SUBS_FILE, groupSubs);
    return originalLength !== groupSubs[groupKey].length;
  }

  async getGroupSubscriptions(platform, channelId) {
    const groupKey = `group:${platform}:${channelId}`;
    const groupSubs = await this.loadJSON(this.GROUP_SUBS_FILE);
    return groupSubs[groupKey] || [];
  }

  async getSubscribersForAuthor(authorUrl) {
    const userSubs = await this.loadJSON(this.SUBS_FILE);
    const groupSubs = await this.loadJSON(this.GROUP_SUBS_FILE);
    
    const userKeys = Object.keys(userSubs).filter(k => (userSubs[k] || []).includes(authorUrl));
    const groupKeys = Object.keys(groupSubs).filter(k => (groupSubs[k] || []).includes(authorUrl));
    
    return { userKeys, groupKeys };
  }

  async updateAuthorItems(authorUrl, itemIds) {
    const authorItems = await this.loadJSON(this.AUTHOR_ITEMS_FILE);
    authorItems[authorUrl] = itemIds;
    await this.saveJSON(this.AUTHOR_ITEMS_FILE, authorItems);
  }

  async getAuthorItems(authorUrl) {
    const authorItems = await this.loadJSON(this.AUTHOR_ITEMS_FILE);
    return authorItems[authorUrl] || [];
  }
}

module.exports = new SubscriptionManager();