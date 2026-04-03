App({
  onLaunch() {
    console.log('Consumer App Launched');
    const userInfo = wx.getStorageSync('userInfo');
    const authToken = wx.getStorageSync('authToken');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
    if (authToken) {
      this.globalData.authToken = authToken;
    }
  },
  globalData: {
    userInfo: null,
    authToken: '',
    tabBarSelected: 0,
    aiConsultContext: null
  }
});
