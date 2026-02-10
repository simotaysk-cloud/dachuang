const api = require('../../utils/api')

const REFRESH_KEY = 'processingNeedRefresh'
const LAST_QUERY_KEY = 'processingLastQueryNo'

Page({
    data: {
        records: [], // list of processing records
        queryNo: '',
        loading: false
    },

    onLoad() {
        if (api.role === 'FARMER') {
            wx.showToast({ title: '无权限（农户仅可使用种植相关模块）', icon: 'none' })
            return wx.redirectTo({ url: '/pages/index/index' })
        }
    },

    onShow() {
        if (wx.getStorageSync(REFRESH_KEY)) {
            wx.removeStorageSync(REFRESH_KEY)
            const last = wx.getStorageSync(LAST_QUERY_KEY) || ''
            if (last) this.setData({ queryNo: last })
            if (this.data.queryNo) this.query()
        }
    },

    onQueryInput(e) {
        this.setData({ queryNo: e.detail.value })
    },

    startCreate() {
        wx.navigateTo({ url: '/pages/processing-form/index' })
    },

    parseBatchNoFromScanResult(raw) {
        const s = String(raw || '').trim()
        if (!s) return ''
        // Prefer query param: ...?batchNo=XXX
        const m1 = s.match(/[?&]batchNo=([^&]+)/i)
        if (m1 && m1[1]) return decodeURIComponent(m1[1])
        // If it's a URL-like path, take last segment.
        if (s.startsWith('http://') || s.startsWith('https://') || s.includes('/')) {
            const noHash = s.split('#')[0]
            const noQuery = noHash.split('?')[0]
            const parts = noQuery.split('/').filter(Boolean)
            if (parts.length > 0) return decodeURIComponent(parts[parts.length - 1])
        }
        return s
    },

    async onScanStart() {
        try {
            const res = await new Promise((resolve, reject) => {
                wx.scanCode({
                    scanType: ['qrCode', 'barCode'],
                    success: resolve,
                    fail: reject
                })
            })
            const raw = res?.result || ''
            const batchNo = this.parseBatchNoFromScanResult(raw)
            if (!batchNo) {
                wx.showToast({ title: '未识别到批次号', icon: 'none' })
                return
            }
            wx.navigateTo({ url: `/pages/line-work/index?batchNo=${encodeURIComponent(batchNo)}` })
        } catch (err) {
            // user canceled or failed
        }
    },

    editFromList(e) {
        const item = e.currentTarget.dataset.item
        if (!item || item.id == null) return
        wx.navigateTo({ url: `/pages/processing-form/index?id=${encodeURIComponent(String(item.id))}` })
    },

    async query() {
        if (!this.data.queryNo) return wx.showToast({ title: '请输入批次号', icon: 'none' })

        this.setData({ loading: true })
        try {
            // The API currently searches by batchNo (output) or parentBatchNo
            // For simplicity in UI, we search by batchNo first
            const res = await api.request(`/api/v1/processing?batchNo=${this.data.queryNo}`)
            this.setData({ records: res.data || [] })
            wx.setStorageSync(LAST_QUERY_KEY, this.data.queryNo)
            if (!res.data || res.data.length === 0) {
                wx.showToast({ title: '未找到记录', icon: 'none' })
            }
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '查询失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },
})
