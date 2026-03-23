Page({
  data: {
    currentTab: 0, // 0: 直供饮片, 1: 云林认养
    products: [
      { id: 1, name: '高山野生林下黄连', tag: '清热燥湿', price: '298.00', unit: '500g', sales: 428, img: 'https://cpuzhbc.cn/assets/tcm_herb.png' },
      { id: 2, name: '镇坪九叶重楼', tag: '消肿止痛', price: '860.00', unit: '100g', sales: 112, img: 'https://cpuzhbc.cn/assets/tcm_herb.png' }
    ],
    adoptions: [
      { id: 101, name: '小曙河高寒黄连试验田 (第3号区)', area: '5平米', price: '1999.00', status: '可认养', yield: '约 1.5kg 全季', img: 'https://cpuzhbc.cn/assets/tcm_herb.png' },
      { id: 102, name: '曾家镇向阳重楼野化林', area: '10平米', price: '4500.00', status: '剩余假植 2 份', yield: '挂牌专属采挖权', img: 'https://cpuzhbc.cn/assets/tcm_herb.png' }
    ]
  },

  switchTab(e) {
    this.setData({ currentTab: e.currentTarget.dataset.index });
  },

  handlePurchase() {
    wx.showToast({
      title: '已加入助农专列',
      icon: 'success'
    });
  },

  handleAdopt() {
    wx.showModal({
      title: '云端认养协议',
      content: '基于智能合约的区块链地契即将生成，请确认签署镇坪助农扶贫云认养协议。',
      confirmText: '链上签署',
      success(res) {
        if (res.confirm) {
          wx.showToast({ title: '上链存证中...', icon: 'loading', duration: 1500 });
        }
      }
    });
  }
});
