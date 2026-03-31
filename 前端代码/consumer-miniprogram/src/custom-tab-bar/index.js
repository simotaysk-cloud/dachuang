Component({
  data: {
    selected: 0,
    color: '#7f8a82',
    selectedColor: '#264230',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        key: 'home'
      },
      {
        pagePath: 'pages/market/index',
        text: '云市集',
        key: 'market'
      },
      {
        pagePath: 'pages/ai-consult/index',
        text: '智问',
        key: 'consult'
      },
      {
        pagePath: 'pages/user/index',
        text: '我的',
        key: 'user'
      }
    ]
  },

  lifetimes: {
    attached() {
      const app = getApp();
      const presetSelected = app && app.globalData ? app.globalData.tabBarSelected : null;
      if (typeof presetSelected === 'number') {
        this.setData({ selected: presetSelected });
      }
      this.updateSelected();
    }
  },

  pageLifetimes: {
    show() {
      this.updateSelected();
    }
  },

  methods: {
    updateSelected() {
      const pages = getCurrentPages();
      const current = pages[pages.length - 1];
      const route = current ? current.route : '';
      const selected = this.data.list.findIndex((item) => item.pagePath === route);
      if (selected !== -1 && selected !== this.data.selected) {
        this.setData({ selected });
      }
      if (selected !== -1) {
        const app = getApp();
        if (app && app.globalData) {
          app.globalData.tabBarSelected = selected;
        }
      }
    },

    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      const nextIndex = Number(index);
      if (!path) return;

      if (!Number.isNaN(nextIndex) && nextIndex !== this.data.selected) {
        this.setData({ selected: nextIndex });
      }
      const app = getApp();
      if (app && app.globalData && !Number.isNaN(nextIndex)) {
        app.globalData.tabBarSelected = nextIndex;
      }

      wx.switchTab({
        url: '/' + path
      });
    }
  }
});
