
Component({
  properties: {
    active: {
      type: null,
      value: 0
    },
    mode: {
      type: String,
      value: 'role'
    }
  },

  data: {
    activeMap: {0: true},

    steps: [
      { id: 0, name: '资源产地', url: '/pages/planting/index' },
      { id: 1, name: '原料质检', url: '/pages/inspection/index?active=1' },
      { id: 2, name: '深加工', url: '/pages/processing/index' },
      { id: 3, name: '成品检验', url: '/pages/inspection/index?active=3' },
      { id: 4, name: '终端溯源', url: '/pages/terminal-qrcode/index' }
    ]
  },

  observers: {
    'active': function(activeVal) {
      let map = {};
      if (Array.isArray(activeVal)) {
        activeVal.forEach(v => map[v] = true);
      } else {
        map[activeVal] = true;
      }
      this.setData({ activeMap: map });
    }
  },

  methods: {
    goToStep(e) {
      const stepIdx = parseInt(e.currentTarget.dataset.step);

      if (this.properties.mode === 'process') {


         this.triggerEvent('stepClick', { step: stepIdx });
         return;
      }

      if (stepIdx === this.properties.active) return;

      const step = this.data.steps[stepIdx];
      if (step && step.url) {

        wx.reLaunch({
          url: step.url,
          fail: (err) => {
            console.error('Navigation failed:', err);
            wx.showToast({
              title: '页面跳转失败',
              icon: 'none'
            });
          }
        });
      }
    }
  }
})
