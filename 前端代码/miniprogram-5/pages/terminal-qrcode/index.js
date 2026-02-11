const api = require('../../utils/api')

Page({
  data: {
    role: '',
    rootBatchNo: '',
    roots: [],
    leafRows: [],
    qrRows: [],
    loading: false,
    generating: false,
    exporting: false,
    previewVisible: false,
    previewSrc: '',
    previewBatchNo: ''
  },

  onLoad() {
    if (api.role === 'FARMER') {
      wx.showToast({ title: '无权限', icon: 'none' })
      return wx.redirectTo({ url: '/pages/index/index' })
    }
    this.setData({ role: api.role || '' })
    this.loadRoots()
    this.loadLeafBatches()
  },

  async loadRoots() {
    this.setData({ loading: true })
    try {
      const res = await api.request('/api/v1/batches?rootOnly=true')
      this.setData({ roots: Array.isArray(res.data) ? res.data : [] })
    } catch (e) {
      wx.showToast({ title: '加载原始批次失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onRootInput(e) {
    this.setData({ rootBatchNo: String(e.detail.value || '').trim() })
  },

  onRootPick(e) {
    const idx = Number(e.detail.value)
    const item = this.data.roots[idx]
    if (!item) return
    this.setData({ rootBatchNo: item.batchNo || '' })
    this.loadLeafBatches()
  },

  parseBatchNoFromScanResult(raw) {
    const s = String(raw || '').trim()
    if (!s) return ''
    const m1 = s.match(/[?&]batchNo=([^&]+)/i)
    if (m1 && m1[1]) return decodeURIComponent(m1[1])
    if (s.startsWith('http://') || s.startsWith('https://') || s.includes('/')) {
      const noHash = s.split('#')[0]
      const noQuery = noHash.split('?')[0]
      const parts = noQuery.split('/').filter(Boolean)
      if (parts.length > 0) return decodeURIComponent(parts[parts.length - 1])
    }
    return s
  },

  async scanRootBatch() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.scanCode({
          scanType: ['qrCode', 'barCode'],
          success: resolve,
          fail: reject
        })
      })
      const batchNo = this.parseBatchNoFromScanResult(res?.result || '')
      if (!batchNo) {
        wx.showToast({ title: '未识别到批次号', icon: 'none' })
        return
      }
      this.setData({ rootBatchNo: batchNo })
      this.loadLeafBatches()
    } catch (e) {
      // user cancel
    }
  },

  async loadLeafBatches() {
    const root = String(this.data.rootBatchNo || '').trim()
    this.setData({ loading: true, leafRows: [], qrRows: [] })
    try {
      const path = root
        ? `/api/v1/batches/${encodeURIComponent(root)}/leaf-batches?limit=500`
        : '/api/v1/batches/leaf-batches?limit=500'
      const res = await api.request(path)
      const rows = Array.isArray(res.data) ? res.data : []
      this.setData({ leafRows: rows })
      if (rows.length === 0) {
        wx.showToast({ title: root ? '该批次暂无末端批次' : '暂无末端批次', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '加载末端批次失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async generateAllQrcodes() {
    const root = String(this.data.rootBatchNo || '').trim()
    this.setData({ generating: true })
    try {
      const path = root
        ? `/api/v1/batches/${encodeURIComponent(root)}/leaf-qrcodes?size=260&limit=500`
        : '/api/v1/batches/leaf-qrcodes?size=260&limit=500'
      const res = await api.request(path)
      const rows = Array.isArray(res.data) ? res.data : []
      this.setData({ qrRows: rows })
      wx.showToast({ title: `已生成 ${rows.length} 条`, icon: 'none' })
    } catch (e) {
      wx.showToast({ title: '批量生成失败', icon: 'none' })
    } finally {
      this.setData({ generating: false })
    }
  },

  async previewQr(e) {
    const item = e.currentTarget.dataset.item || {}
    if (item.src) {
      this.setData({
        previewVisible: true,
        previewSrc: item.src,
        previewBatchNo: item.batchNo || ''
      })
      return
    }
    const batchNo = item.batchNo
    if (!batchNo) return
    try {
      const res = await api.request(`/api/v1/batches/${encodeURIComponent(batchNo)}/qrcode?size=360`)
      this.setData({
        previewVisible: true,
        previewSrc: (res.data && res.data.src) || '',
        previewBatchNo: batchNo
      })
    } catch (e2) {
      wx.showToast({ title: '预览失败', icon: 'none' })
    }
  },

  closePreview() {
    this.setData({
      previewVisible: false,
      previewSrc: '',
      previewBatchNo: ''
    })
  },

  async exportBatchCsv() {
    const root = String(this.data.rootBatchNo || '').trim()
    this.setData({ exporting: true })
    try {
      const path = root
        ? `/api/v1/batches/${encodeURIComponent(root)}/leaf-qrcodes/export?size=220&limit=500`
        : '/api/v1/batches/leaf-qrcodes/export?size=220&limit=500'
      const res = await api.request(path)
      const data = res.data || {}
      const csv = String(data.csv || '')
      const filename = String(data.filename || `leaf-qrcodes-${Date.now()}.csv`)
      if (!csv) {
        wx.showToast({ title: '导出数据为空', icon: 'none' })
        return
      }

      const filePath = `${wx.env.USER_DATA_PATH}/${filename}`
      const fs = wx.getFileSystemManager()
      fs.writeFile({
        filePath,
        data: csv,
        encoding: 'utf8',
        success: () => {
          wx.openDocument({
            filePath,
            fileType: 'csv',
            showMenu: true,
            success: () => wx.showToast({ title: '导出成功', icon: 'none' }),
            fail: () => wx.showToast({ title: '打开文件失败', icon: 'none' })
          })
        },
        fail: () => wx.showToast({ title: '写入文件失败', icon: 'none' })
      })
    } catch (e) {
      wx.showToast({ title: '导出失败', icon: 'none' })
    } finally {
      this.setData({ exporting: false })
    }
  }
})
