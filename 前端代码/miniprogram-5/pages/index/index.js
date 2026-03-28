const api = require('../../utils/api')
const { getMenuAccess } = require('../../utils/rbac')

Page({
  data: {
    healthStatus: '异常',
    baseUrl: api.baseUrl,
    token: api.token,
    role: api.role,
    username: '用户名：' + (api.username || '待登录'),
    roleName: '用户身份：' + api.getRoleName(api.role),
    menuAccess: getMenuAccess(api.role),
    flowNodes: [],
    logisticsActive: false
  },

  onLoad() {
    this.checkHealth()
  },

  onShow() {
    const r = (api.role || '').toUpperCase()
    this.setData({
      baseUrl: api.baseUrl,
      token: api.token,
      role: api.role,
      username: '用户名：' + (api.username || '待登录'),
      roleName: '用户身份：' + api.getRoleName(api.role),
      menuAccess: getMenuAccess(api.role),
      flowNodes: this.getFlowNodes(api.role),
      logisticsActive: r === 'LOGISTICS' || r === 'ADMIN',
      currentStepIdx: this.getCurrentStepIdx(api.role)
    })
  },

  getCurrentStepIdx(role) {
    const r = (role || '').toUpperCase()
    if (r === 'FARMER') return 0
    if (r === 'QUALITY') return [1, 3] // Highlights both Raw Material and Finished Product Inspections
    if (r === 'FACTORY' || r === 'MANUFACTURER') return 2

    // Admin/Regulator defaults to terminal (4) or overview (-1).
    // In 'role' mode, giving them 4 will just highlight terminal.
    // If they want to see all stages, they can switch roles via the login screen.
    if (r === 'ADMIN' || r === 'REGULATOR') return -1 
    return -1
  },

  getFlowNodes(role) {
    const r = (role || '').toUpperCase()
    const isAdmin = r === 'ADMIN' || r === 'REGULATOR'
    return [
      { id: 'origin', name: '资源产地', active: isAdmin || r === 'FARMER' },
      { id: 'inspect1', name: '原料质检', active: isAdmin || r === 'FARMER' || r === 'QUALITY' },
      { id: 'process', name: '深加工', active: isAdmin || r === 'MANUFACTURER' || r === 'FACTORY' },
      { id: 'inspect2', name: '成品检验', active: isAdmin || r === 'QUALITY' || r === 'MANUFACTURER' },
      { id: 'terminal', name: '终端溯源', active: isAdmin }
    ]
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
