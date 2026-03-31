const api = require('../../utils/api')
const { guardFeatureAccess, hasFeatureAccess } = require('../../utils/rbac')

Page({
  data: {
    batchNo: '',
    loading: false,
    qrSrc: '',
    usernameRaw: api.username || 'user',
    roleLabel: '',
    canViewBatchArchive: false
  },

  async onLoad(options) {
    if (!guardFeatureAccess(api.role, 'QRCODE')) return
    this.setData({
      roleLabel: api.getRoleName(api.role),
      canViewBatchArchive: hasFeatureAccess(api.role, 'BATCH')
    })
    await this.loadProfile()

    const batchNo = options.batchNo ? decodeURIComponent(String(options.batchNo)) : ''
    if (!batchNo) {
      wx.showToast({ title: '缺少批次号', icon: 'none' })
      return wx.navigateBack()
    }

    this.setData({ batchNo })
    this.loadQr()
  },

  async loadProfile() {
    try {
      const res = await api.getMe()
      const profile = res?.data || {}
      this.setData({
        usernameRaw: profile?.username || profile?.name || api.username || 'user',
        roleLabel: api.getRoleName(profile?.role || api.role)
      })
    } catch (err) {
      // Ignore profile errors and keep cached identity.
    }
  },

  async loadQr() {
    this.setData({ loading: true, qrSrc: '' })
    try {
      const res = await api.request(`/api/v1/batches/${encodeURIComponent(this.data.batchNo)}/qrcode?size=360`)
      const src = res?.data?.src ? String(res.data.src) : ''
      this.setData({ qrSrc: src })
    } catch (e) {
      // ignore
    } finally {
      this.setData({ loading: false })
    }
  },

  copy() {
    wx.setClipboardData({
      data: this.data.batchNo,
      success: () => wx.showToast({ title: '已复制' })
    })
  },

  goLineWork() {
    wx.navigateTo({ url: `/pages/line-work/index?batchNo=${encodeURIComponent(this.data.batchNo)}` })
  },

  goTrace() {
    if (!this.data.canViewBatchArchive) return
    wx.navigateTo({ url: `/pages/batch/trace/index?batchNo=${encodeURIComponent(this.data.batchNo)}` })
  },

  back() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
