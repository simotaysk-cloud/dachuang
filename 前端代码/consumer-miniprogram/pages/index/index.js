Page({
  data: {
    newsFeed: [
      {
        id: 1,
        tag: '春分 · 肝木生发',
        title: '春季养肝正当时：镇坪野葛根的古法泡饮避坑指南',
        excerpt: '春季五行属木，应当顺应阳气生发。AIGC 本草引擎为您深入分析镇坪独有的原生态野葛根内蕴含的高浓度黄酮成分...',
        img: 'https://cpuzhbc.cn/assets/tcm_herb.png'
      },
      {
        id: 2,
        tag: '经方配伍解读',
        title: '黄连与麦冬：清心除烦的国医千古绝配',
        excerpt: '熬夜党速收！镇坪海拔 2000 米无污染高寒产区出产的顶级黄连，小檗碱含量极高，搭配麦冬可使人体阴阳互济，水火交融...',
        img: 'https://cpuzhbc.cn/assets/tcm_herb.png'
      }
    ]
  },

  openScanner() {
    wx.scanCode({
      success: (res) => {
        if (res.result) {
          wx.showToast({
            title: '扫描成功，解密中',
            icon: 'loading'
          });
          
          let batchNo = res.result;
          if (batchNo.includes('batchNo=')) {
            const parts = batchNo.split('batchNo=');
            if (parts.length > 1) {
              batchNo = decodeURIComponent(parts[1].split('&')[0]);
            }
          }
          
          setTimeout(() => {
            wx.navigateTo({
              url: `/pages/trace/index?batchNo=${encodeURIComponent(batchNo)}`
            });
          }, 800);
        }
      },
      fail: () => {
        wx.showToast({
          title: '动作已取消',
          icon: 'none'
        });
      }
    });
  }
});