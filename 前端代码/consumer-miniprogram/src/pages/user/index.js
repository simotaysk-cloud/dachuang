Page({
  data: {
    userInfo: {
      avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
      nickName: '未登录保护用户',
      points: 450,
      level: '青铜草药徒'
    },
    reminderText: '未设置',
    hasUserInfo: false,
    certs: [
      {
        id: 'C001',
        name: '大巴山高寒黄连 助农数字认养凭证',
        hash: '0x3F8A...E92B',
        date: '2026-03-21'
      }
    ],
    serviceMenus: [
      { action: 'trace', icon: '⌁', tone: 'trace', title: '扫描溯源码', desc: '直接进入批次详情与链上节点记录', meta: '立即前往' },
      { action: 'reminder', icon: '⏰', tone: 'reminder', title: '用药提醒', desc: '设置演示提醒时间并同步到当前账号', meta: '' },
      { action: 'service', icon: '问', tone: 'service', title: '专属药师问答', desc: '跳转至智问页面查看建议与搭配推荐', meta: '进入智问' },
      { action: 'about', icon: 'i', tone: 'about', title: '关于平台', desc: '查看比赛版本说明与技术背景', meta: '查看说明' }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
  },

  getUserProfile() {
    wx.showLoading({ title: '安全验证中...' });
    setTimeout(() => {
      wx.hideLoading();
      this.setData({
        userInfo: {
          avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
          nickName: '药途VIP评委',
          points: 1280,
          level: '至信本草大师'
        },
        hasUserInfo: true
      });
      wx.showToast({ title: '授权成功', icon: 'success' });
    }, 600);
  },

  handleMenuAction(e) {
    const { action } = e.currentTarget.dataset;
    if (action === 'trace') return this.scanCode();
    if (action === 'reminder') return this.setupReminder();
    if (action === 'service') return this.contactService();
    if (action === 'about') return this.showAbout();
  },

  scanCode() {
    wx.scanCode({
      success: (res) => {
        if (res.result) {
          wx.navigateTo({ url: `/pages/trace/index?batchNo=${encodeURIComponent(res.result)}` });
        }
      }
    });
  },

  showCert(e) {
    const cert = e.currentTarget.dataset.cert;
    wx.showModal({
      title: '至信链 确权证书',
      content: `证书名称: ${cert.name}\n上链时间: ${cert.date}\n存证哈希: ${cert.hash}\n\n该证书记录着您对镇坪高山农业的科技助农贡献，不可篡改。`,
      showCancel: false,
      confirmText: '骄傲收下'
    });
  },

  setupReminder() {
    wx.showActionSheet({
      itemList: ['每日早晨 08:00', '每日中午 12:30', '每日睡前 22:00'],
      success: (res) => {
        const times = ['08:00', '12:30', '22:00'];
        this.setData({ reminderText: `已设 ${times[res.tapIndex]}` });
        wx.showToast({ title: '已开启微信强提醒', icon: 'success' });
      }
    });
  },

  contactService() {
    wx.showModal({
      title: '联系专属药师客服',
      content: '当前版本把药师问答收敛为轻量工具页。是否立刻前往【智问】查看基础建议？',
      confirmText: '前往智问',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({ url: '/pages/ai-consult/index' });
        }
      }
    });
  },

  showAbout() {
    wx.showModal({
      title: '关于 药途寻迹',
      content: '「药途寻迹 - 智汇本草」\n基于可信存证、批次溯源与消费者小程序体验设计的镇坪中药材 D2C 助农平台。\nV2.0.0 (双创大赛参评版)',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});
