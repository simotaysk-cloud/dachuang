Page({
  data: {
    trustMetrics: [
      { label: '质检合格率', value: '99.9%', note: '累计合作批次', icon: '质', tone: 'light' },
      { label: '可信链路节点', value: '124', note: '近 7 日同步', icon: '链', tone: 'dark' }
    ],
    heroBatchLabel: '道地本草原产溯源',
    quickActions: [
      { key: 'market', icon: '市', title: '云市集', subtitle: '浏览可信商品与批次来源', tone: 'market' },
      { key: 'consult', icon: '问', title: '问药', subtitle: '查看配伍、食养与使用建议', tone: 'consult' },
      { key: 'trace', icon: '溯', title: '办码', subtitle: '查看标准批次链路与节点信息', tone: 'trace' },
      { key: 'profile', icon: '我', title: '我的', subtitle: '个人权益与提醒设置', tone: 'profile' }
    ],
    seasonalFeed: [
      {
        id: 'gan-cao',
        herb: '甘草',
        tag: '节气·春养',
        time: '今日推荐',
        title: '甘草陈皮温润饮',
        excerpt: '甘草切片清甜温和，适合换季时搭配陈皮作日常轻饮。',
        image: '/assets/seasonal/season-gan-cao.jpg',
        tone: 'wood'
      },
      {
        id: 'huang-qi',
        herb: '黄芪',
        tag: '饮片推荐',
        time: '立夏前',
        title: '黄芪麦冬清补茶',
        excerpt: '黄芪片纹理饱满，适合在春夏交替时做清淡代茶饮。',
        image: '/assets/seasonal/season-huang-qi.jpg',
        tone: 'earth'
      },
      {
        id: 'ju-hua',
        herb: '菊花',
        tag: '节气·新材',
        time: '适合清饮',
        title: '菊花枸杞清目茶',
        excerpt: '干菊花花型完整、香气清浅，适合作为伏案后的温和茶饮。',
        image: '/assets/seasonal/season-ju-hua.jpg',
        tone: 'mist'
      }
    ]
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  openScanner: function() {
    wx.scanCode({
      success: function(res) {
        if (!res.result) return;

        wx.showToast({
          title: '扫描成功，正在跳转',
          icon: 'loading'
        });

        var batchNo = String(res.result);
        if (batchNo.indexOf('batchNo=') > -1) {
          var parts = batchNo.split('batchNo=');
          if (parts.length > 1) {
            batchNo = decodeURIComponent(parts[1].split('&')[0]);
          }
        }

        setTimeout(function() {
          wx.navigateTo({
            url: '/pages/trace/index?batchNo=' + encodeURIComponent(batchNo)
          });
        }, 500);
      },
      fail: function() {
        wx.showToast({
          title: '动作已取消',
          icon: 'none'
        });
      }
    });
  },

  openTraceExample: function() {
    wx.navigateTo({
      url: '/pages/trace/index?batchNo=HT20250815-ZJ001'
    });
  },

  openSeasonalList: function() {
    wx.navigateTo({
      url: '/pages/seasonal/index'
    });
  },

  openSeasonalDetail: function(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/seasonal/index?id=' + encodeURIComponent(id)
    });
  },

  handleQuickAction: function(e) {
    var key = e.currentTarget.dataset.key;

    if (key === 'trace') {
      this.openTraceExample();
      return;
    }

    if (key === 'market') {
      wx.switchTab({ url: '/pages/market/index' });
      return;
    }

    if (key === 'consult') {
      wx.switchTab({ url: '/pages/ai-consult/index' });
      return;
    }

    if (key === 'profile') {
      wx.switchTab({ url: '/pages/user/index' });
    }
  }
});
