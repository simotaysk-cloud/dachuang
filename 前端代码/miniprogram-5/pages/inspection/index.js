const api = require('../../utils/api')
const { guardFeatureAccess } = require('../../utils/rbac')

const REFRESH_KEY = 'inspectionNeedRefresh'
const LAST_QUERY_KEY = 'inspectionLastQueryNo'

Page({
    data: {
        records: [],
        queryNo: '',
        loading: false,
        activeStep: 1 // Default to 1 (Raw Material Inspection)
    },

    onLoad(options) {
        if (options && options.active) {
            this.setData({ activeStep: parseInt(options.active) })
        }
        if (!guardFeatureAccess(api.role, 'INSPECTION')) return

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

    getInspectionType() {
        return this.data.activeStep == 1 ? 'RAW' : 'FINISHED'
    },

    startCreate() {
        // Manual entry fallback
        wx.navigateTo({ url: `/pages/inspection-form/index?type=${this.getInspectionType()}` })
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
            wx.navigateTo({
                url: `/pages/inspection-form/index?parentBatchNo=${encodeURIComponent(batchNo)}&lockedParent=1&type=${this.getInspectionType()}`
            })
        } catch (err) {
            // user canceled or failed
        }
    },

    editFromList(e) {
        const item = e.currentTarget.dataset.item
        if (!item || item.id == null) return
        wx.navigateTo({ url: `/pages/inspection-form/index?id=${encodeURIComponent(String(item.id))}&type=${this.getInspectionType()}` })
    },

    async listAll() {
        this.setData({ loading: true })
        try {
            const res = await api.request(`/api/v1/inspection?type=${this.getInspectionType()}`)
            const rawRecords = res.data || []
            const processed = rawRecords.map(item => {
                const resStr = item.result || ''
                return {
                    ...item,
                    isPass: resStr.includes('合格') && !resStr.includes('不合格'),
                    shortSummary: resStr.length > 40 ? resStr.substring(0, 40) + '...' : resStr
                }
            })
            this.setData({ records: processed })
            if (processed.length === 0) {
                wx.showToast({ title: '暂无记录', icon: 'none' })
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
        if (!this.data.queryNo) return wx.showToast({ title: '请输入批次号', icon: 'none' })

        this.setData({ loading: true })
        try {
            const res = await api.request(`/api/v1/inspection?batchNo=${this.data.queryNo}&type=${this.getInspectionType()}`)
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
