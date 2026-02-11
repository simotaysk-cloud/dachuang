const api = require('../../utils/api')
const { guardFeatureAccess } = require('../../utils/rbac')

const REFRESH_KEY = 'shipmentNeedRefresh'
const LAST_QUERY_KEY = 'shipmentLastQueryBatchNo'

Page({
    data: {
        shipments: [],
        events: [],
        currentShipment: null,
        // For searching shipments
        shipmentQueryBatchNo: '',

        // For adding new event
        shipmentEventForm: {
            location: '',
            status: '',
            details: ''
        },
        loading: false
    },

    onLoad() {
        if (!guardFeatureAccess(api.role, 'LOGISTICS')) return
    },

    onShow() {
        if (wx.getStorageSync(REFRESH_KEY)) {
            wx.removeStorageSync(REFRESH_KEY)
            const last = wx.getStorageSync(LAST_QUERY_KEY) || ''
            if (last) this.setData({ shipmentQueryBatchNo: last })
            this.listShipments()
        }
    },

    onShipmentQueryInput(e) {
        this.setData({ shipmentQueryBatchNo: e.detail.value })
    },

    onShipmentEventInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`shipmentEventForm.${field}`]: e.detail.value })
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
            wx.navigateTo({
                url: `/pages/shipment-form/index?batchNo=${encodeURIComponent(batchNo)}&lockedBatch=1`
            })
        } catch (err) {
            // user canceled or failed
        }
    },

    startCreateShipment() {
        wx.navigateTo({ url: '/pages/shipment-form/index' })
    },

    async listShipments() {
        this.setData({ loading: true })
        try {
            const batchNo = (this.data.shipmentQueryBatchNo || '').trim()
            const qs = batchNo ? `?batchNo=${encodeURIComponent(batchNo)}` : ''
            const res = await api.request(`/api/v1/shipments${qs}`)

            // API returns list or single depending on backend implementation for query
            // Assuming it returns a list for this endpoint
            this.setData({ shipments: Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []) })
            if (batchNo) wx.setStorageSync(LAST_QUERY_KEY, batchNo)

            if (!this.data.shipments || this.data.shipments.length === 0) {
                wx.showToast({ title: '未找到发运单', icon: 'none' })
            }
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '查询失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    async viewShipmentDetail(e) {
        const item = e.currentTarget.dataset.item
        this.setData({ currentShipment: item })
        this.loadEvents(item.shipmentNo)
    },

    closeShipmentDetail() {
        this.setData({ currentShipment: null, events: [] })
    },

    async loadEvents(shipmentNo) {
        try {
            const res = await api.request(`/api/v1/shipments/${shipmentNo}/events`)
            this.setData({ events: res.data || [] })
        } catch (err) {
            console.error(err)
        }
    },

    async addShipmentEvent() {
        if (!this.data.currentShipment) return

        try {
            const payload = {
                location: this.data.shipmentEventForm.location,
                status: this.data.shipmentEventForm.status,
                details: this.data.shipmentEventForm.details
            }
            await api.request(`/api/v1/shipments/${this.data.currentShipment.shipmentNo}/events`, 'POST', payload)
            wx.showToast({ title: '添加成功' })
            // Clean form
            this.setData({
                'shipmentEventForm.location': '',
                'shipmentEventForm.status': '',
                'shipmentEventForm.details': ''
            })
            // Reload events
            this.loadEvents(this.data.currentShipment.shipmentNo)
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '添加失败', icon: 'none' })
        }
    }
})
