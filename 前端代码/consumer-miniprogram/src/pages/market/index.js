Page({
  data: {
    currentTab: 0,
    heroChips: [
      { label: '在售批次', value: '64' },
      { label: '可认养地块', value: '12' },
      { label: '今日成交', value: '218' }
    ],
    products: [
      {
        id: 1,
        mark: '黄',
        tone: 'gold',
        name: '高山野生林下黄连',
        origin: '陕西镇坪',
        tag: '清热燥湿',
        price: '298.00',
        unit: '500g',
        sales: 428,
        desc: '展示真实商品信息与来源说明，不用依赖大面积概念图片。'
      },
      {
        id: 2,
        mark: '楼',
        tone: 'wood',
        name: '镇坪九叶重楼',
        origin: '曾家镇',
        tag: '消肿止痛',
        price: '860.00',
        unit: '100g',
        sales: 112,
        desc: '适合突出稀缺性、规格、库存和批次可查能力。'
      }
    ],
    adoptions: [
      {
        id: 101,
        name: '小曙河高寒黄连试验田（3号区）',
        area: '5 平米',
        price: '1999.00',
        status: '可认养',
        yield: '约 1.5kg/季',
        desc: '认养后可查看地块记录、管护节点和预计收成节奏。'
      },
      {
        id: 102,
        name: '曾家镇向阳重楼野化林',
        area: '10 平米',
        price: '4500.00',
        status: '剩余 2 份',
        yield: '专属挂牌采挖权',
        desc: '强调认养权益和后续可视化记录，而不是单纯概念展示。'
      }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  switchTab(e) {
    this.setData({ currentTab: e.currentTarget.dataset.index });
  },

  handleSearch() {
    wx.showToast({
      title: '搜索功能开发中',
      icon: 'none'
    });
  },

  handlePurchase(e) {
    const { name } = e.currentTarget.dataset;
    wx.showToast({
      title: `${name} 已加入清单`,
      icon: 'success'
    });
  },

  handleAdopt(e) {
    const { name } = e.currentTarget.dataset;
    wx.showModal({
      title: '发起认养',
      content: `将为「${name}」生成认养协议与链上存证流程，是否继续？`,
      confirmText: '继续',
      success(res) {
        if (res.confirm) {
          wx.showToast({ title: '协议生成中', icon: 'loading', duration: 1200 });
        }
      }
    });
  }
});
