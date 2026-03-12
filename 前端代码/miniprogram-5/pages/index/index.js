const api = require('../../utils/api')
const { getMenuAccess } = require('../../utils/rbac')

Page({
  data: {
    healthStatus: '异常',
    baseUrl: api.baseUrl,
    token: api.token,
    role: api.role,
    menuAccess: getMenuAccess(api.role)
  },

  onLoad() {
    this.checkHealth()
  },

  onShow() {
    // 每次回来刷新 token 状态
    this.setData({
      baseUrl: api.baseUrl,
      token: api.token,
      role: api.role,
      menuAccess: getMenuAccess(api.role)
    })
  },

  onBaseUrlInput(e) {
    this.setData({ baseUrl: e.detail.value })
  },

  async saveBaseUrlAndCheck() {
    const next = String(this.data.baseUrl || '').trim()
    if (!next) {
      wx.showToast({ title: '请输入后端URL', icon: 'none' })
      return
    }
    api.setBaseUrl(next)
    this.setData({ baseUrl: api.baseUrl })
    await this.checkHealth()
    const tip = String(api.baseUrl || '').toLowerCase().startsWith('http://')
      ? '已保存，正式版请用HTTPS'
      : '已保存'
    wx.showToast({ title: tip, icon: 'none' })
  },

  async checkHealth() {
    try {
      const res = await api.checkHealth()
      const raw = String(res?.data?.status || '').trim().toUpperCase()
      const ok = raw === 'UP' || raw === 'OK' || raw === 'HEALTHY' || raw === 'NORMAL'
      this.setData({ healthStatus: ok ? '正常' : '异常' })
    } catch (err) {
      this.setData({ healthStatus: '异常' })
    }
  },

  navTo(e) {
    const { url } = e.currentTarget.dataset
    wx.navigateTo({ url })
  }
})
