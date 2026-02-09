const api = require('../../utils/api')

Page({
    data: {
        shipments: [],
        events: [],
        currentShipment: null,

        shipmentForm: {
            batchNo: '',
            distributorName: '',
            carrier: '',
            trackingNo: '',
            remarks: ''
        },
        // For searching shipments
        shipmentQueryBatchNo: '',

        // For adding new event
        shipmentEventForm: {
            location: '',
            status: '',
            details: ''
        },

        showShipmentForm: false,
        loading: false
    },

    scrollToShipmentForm() {
        setTimeout(() => {
            const q = wx.createSelectorQuery()
            q.select('#shipmentFormCard').boundingClientRect()
            q.selectViewport().scrollOffset()
            q.exec((res) => {
                const rect = res && res[0]
                const viewport = res && res[1]
                if (!rect || !viewport) return
                wx.pageScrollTo({ scrollTop: rect.top + viewport.scrollTop - 12, duration: 260 })
            })
        }, 80)
    },

    onLoad() {
        if (api.role === 'FARMER') {
            wx.showToast({ title: '无权限（农户仅可使用种植相关模块）', icon: 'none' })
            return wx.redirectTo({ url: '/pages/index/index' })
        }
    },

    onShipmentInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`shipmentForm.${field}`]: e.detail.value })
    },

    onShipmentQueryInput(e) {
        this.setData({ shipmentQueryBatchNo: e.detail.value })
    },

    onShipmentEventInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`shipmentEventForm.${field}`]: e.detail.value })
    },

    startCreateShipment() {
        this.setData({
            showShipmentForm: true,
            shipmentForm: {
                batchNo: '',
                distributorName: '',
                carrier: '',
                trackingNo: '',
                remarks: ''
            }
        }, () => {
            wx.showToast({ title: '已进入新建', icon: 'none' })
            this.scrollToShipmentForm()
        })
    },

    cancelShipmentEdit() {
        this.setData({ showShipmentForm: false })
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

    async createShipment() {
        try {
            const res = await api.request('/api/v1/shipments', 'POST', this.data.shipmentForm)
            wx.showToast({ title: '创建成功' })
            this.setData({ showShipmentForm: false })
            // Refresh list
            this.listShipments()
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '创建失败', icon: 'none' })
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
