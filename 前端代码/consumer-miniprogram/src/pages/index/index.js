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
        id: 1,
        mark: '草',
        tag: '节气·春养',
        time: '今日推荐',
        title: '守胃和肝经日常适宜',
        excerpt: '以一味甘淡平和的小材入饮，适合清晨温水同服。',
        tone: 'wood'
      },
      {
        id: 2,
        mark: '丸',
        tag: '饮片推荐',
        time: '立夏前',
        title: '北芪饮',
        excerpt: '辛气小温，因承古方，可为春末体虚者作佐助参考。',
        tone: 'earth'
      },
      {
        id: 3,
        mark: '花',
        tag: '节气·新材',
        time: '适合清饮',
        title: '茶白山菊',
        excerpt: '茶冷小香，不伤津液，适合作为清单中的日常轻选。',
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
