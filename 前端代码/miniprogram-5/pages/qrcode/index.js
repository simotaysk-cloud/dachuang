const api = require('../../utils/api')

Page({
  data: {
    batchNo: '',
    loading: false,
    qrSrc: ''
  },

  onLoad(options) {
    if (api.role === 'FARMER') {
      wx.showToast({ title: '无权限（农户仅可使用种植相关模块）', icon: 'none' })
      return wx.redirectTo({ url: '/pages/index/index' })
    }

    const batchNo = options.batchNo ? decodeURIComponent(String(options.batchNo)) : ''
    if (!batchNo) {
      wx.showToast({ title: '缺少批次号', icon: 'none' })
      return wx.navigateBack()
    }

    this.setData({ batchNo })
    this.loadQr()
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
    wx.navigateTo({ url: `/pages/trace/index?batchNo=${encodeURIComponent(this.data.batchNo)}` })
  },

  back() {
    wx.navigateBack()
  }
})
