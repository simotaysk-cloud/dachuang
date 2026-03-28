// components/supply-chain-steps/index.js
Component({
  properties: {
    active: {
      type: null, // Allow Number or Array
      value: 0
    },
    mode: {
      type: String,
      value: 'role' // 'role' (single/multiple highlight) or 'process' (cumulative highlight)
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
         // In process mode, clicking a step should notify the parent container
         // to show specific information about THIS batch, preventing general routing.
         this.triggerEvent('stepClick', { step: stepIdx });
         return;
      }

      if (stepIdx === this.properties.active) return;

      const step = this.data.steps[stepIdx];
      if (step && step.url) {
        // Use reLaunch to clear navigation stack between core supply chain phases
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
