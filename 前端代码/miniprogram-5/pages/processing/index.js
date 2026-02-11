const api = require('../../utils/api')
const { guardFeatureAccess } = require('../../utils/rbac')

const REFRESH_KEY = 'processingNeedRefresh'
const LAST_QUERY_KEY = 'processingLastQueryNo'

Page({
    data: {
        batches: [], // list of root batches
        queryNo: '',
        loading: false
    },

    onLoad() {
        if (!guardFeatureAccess(api.role, 'PROCESSING')) return

        // Default show latest list for demo.
        this.listAll()
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
        wx.navigateTo({ url: '/pages/line-work/index' })
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

    // List item click is removed in WXML, but keeping this safe
    editFromList(e) {
        // Read-only
    },

    async listAll() {
        this.setData({ loading: true })
        try {
            // User requested to show "Initial Batches" (Root Batches)
            const res = await api.request('/api/v1/batches?rootOnly=true')
            this.setData({ batches: res.data || [] })
            if (!res.data || res.data.length === 0) {
                wx.showToast({ title: '暂无源头批次', icon: 'none' })
            }
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    refreshList() {
        this.setData({ queryNo: '' })
        wx.removeStorageSync(LAST_QUERY_KEY)
        this.listAll()
    },

    async query() {
        const q = this.data.queryNo
        if (!q) return wx.showToast({ title: '请输入批次号', icon: 'none' })

        this.setData({ loading: true })
        try {
            // API doesn't have a fuzzy search for batches, so we try exact match first
            // If it's a root batch, it will be in the list, but if we want to find a specific one:
            const res = await api.request(`/api/v1/batches/${q}`)
            if (res.data) {
                this.setData({ batches: [res.data] })
            } else {
                this.setData({ batches: [] })
                wx.showToast({ title: '未找到批次', icon: 'none' })
            }
        } catch (err) {
            console.error(err)
            // Fallback: maybe it's not found
            this.setData({ batches: [] })
            wx.showToast({ title: '查询失败或未找到', icon: 'none' })
        } finally {
            this.setData({ loading: false })
            wx.setStorageSync(LAST_QUERY_KEY, q)
        }
    },

    viewTrace(e) {
        const batchNo = e.currentTarget.dataset.batch
        if (!batchNo) return
        wx.navigateTo({ url: `/pages/batch/trace/index?batchNo=${encodeURIComponent(batchNo)}` })
    }
})
