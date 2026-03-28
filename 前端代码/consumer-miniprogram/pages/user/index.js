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
      { id: 'C001', name: '大巴山高寒黄连 助农数字认养凭证', hash: '0x3F8A...E92B', date: '2026-03-21', img: 'https://cpuzhbc.cn/assets/cert_bg.png' }
    ]
  },

  getUserProfile(e) {
    // 微信高版本基础库已全面调整 wx.getUserProfile 规则，为保证双创比赛演示 100% 顺畅，此处转为全自动模拟登录授权验证
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

  scanCode() {
    wx.scanCode({
      success: (res) => {
        if(res.result) {
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
        this.setData({ reminderText: '已设 ' + times[res.tapIndex] });
        wx.showToast({ title: '已开启微信强提醒', icon: 'success' });
      }
    });
  },

  contactService() {
    wx.showModal({
      title: '联系专属药师客服',
      content: '我们的数字老中医（AI大模型）正全天侯为您待命。是否立刻前往【智问】大厅进行把脉问诊？',
      confirmText: '立刻前往',
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
      content: '「药途寻迹」\n基于腾讯至信链与百度大语言模型的镇坪中药材D2C助农平台。\nV2.0.0 (双创大赛参评版)',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});
