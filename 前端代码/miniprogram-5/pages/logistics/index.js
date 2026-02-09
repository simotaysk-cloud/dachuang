const api = require('../../utils/api')

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
        if (api.role === 'FARMER') {
            wx.showToast({ title: '无权限（农户仅可使用种植相关模块）', icon: 'none' })
            return wx.redirectTo({ url: '/pages/index/index' })
        }
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

    startCreateShipment() {
        const q = (this.data.shipmentQueryBatchNo || '').trim()
        const qs = q ? `?batchNo=${encodeURIComponent(q)}` : ''
        wx.navigateTo({ url: `/pages/shipment-form/index${qs}` })
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
