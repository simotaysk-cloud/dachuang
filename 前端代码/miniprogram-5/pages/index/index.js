const api = require('../../utils/api')

Page({
  data: {
    baseUrl: api.baseUrl,
    healthStatus: 'UNKNOWN',
    token: api.token,
    role: api.role
  },

  onLoad() {
    this.checkHealth()
  },

  onShow() {
    // 每次回来刷新 token 状态
    this.setData({ token: api.token, role: api.role })
  },

  onBaseUrlInput(e) {
    const url = e.detail.value
    this.setData({ baseUrl: url })
    api.setBaseUrl(url)
  },

  async checkHealth() {
    try {
      const res = await api.checkHealth()
      this.setData({ healthStatus: res?.data?.status || 'UP' })
    } catch (err) {
      this.setData({ healthStatus: 'DOWN' })
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  },

  navTo(e) {
    const { url } = e.currentTarget.dataset
    wx.navigateTo({ url })
  }
})
