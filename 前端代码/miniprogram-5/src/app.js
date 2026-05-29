
App({
  onLaunch() {

    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)


    wx.login({
      timeout: 10000,
      success: res => {

      },
      fail: err => {
        console.warn('wx.login failed:', err)
      }
    })
  },
  globalData: {
    userInfo: null
  }
})
