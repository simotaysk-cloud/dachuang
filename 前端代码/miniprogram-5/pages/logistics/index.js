const api = require('../../utils/api')

Page({
    data: {
        shipmentForm: {
            batchNo: '',
            distributorName: '',
            carrier: '',
            trackingNo: '',
            remarks: ''
        },
        shipmentQueryBatchNo: '',
        shipmentEventsQueryNo: '',
        shipmentEventForm: {
            shipmentNo: '',
            eventTime: '',
            location: '',
            status: '',
            details: ''
        },

        form: {
            id: '',
            batchNo: '',
            fromLocation: '',
            toLocation: '',
            trackingNo: '',
            location: '',
            status: '',
            updateTime: ''
        },
        queryNo: '',
        result: ''
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`form.${field}`]: e.detail.value })
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

    onShipmentEventQueryInput(e) {
        this.setData({ shipmentEventsQueryNo: e.detail.value })
    },

    onQueryInput(e) {
        this.setData({ queryNo: e.detail.value })
    },

    setResult(data) {
        this.setData({ result: JSON.stringify(data, null, 2) })
    },

    async createShipment() {
        try {
            const res = await api.request('/api/v1/shipments', 'POST', this.data.shipmentForm)
            this.setResult(res)
            if (res?.data?.shipmentNo) {
                this.setData({ [`shipmentEventForm.shipmentNo`]: res.data.shipmentNo })
            }
            wx.showToast({ title: '创建成功' })
        } catch (err) {
            this.setResult(err)
        }
    },

    async listShipments() {
        try {
            const batchNo = (this.data.shipmentQueryBatchNo || '').trim()
            const qs = batchNo ? `?batchNo=${encodeURIComponent(batchNo)}` : ''
            const res = await api.request(`/api/v1/shipments${qs}`)
            this.setResult(res)
        } catch (err) {
            this.setResult(err)
        }
    },

    async addShipmentEvent() {
        if (!this.data.shipmentEventForm.shipmentNo) {
            return wx.showToast({ title: '请输入 shipmentNo', icon: 'none' })
        }
        try {
            const payload = {
                eventTime: this.data.shipmentEventForm.eventTime || undefined,
                location: this.data.shipmentEventForm.location,
                status: this.data.shipmentEventForm.status,
                details: this.data.shipmentEventForm.details
            }
            const res = await api.request(`/api/v1/shipments/${this.data.shipmentEventForm.shipmentNo}/events`, 'POST', payload)
            this.setResult(res)
            wx.showToast({ title: '添加成功' })
        } catch (err) {
            this.setResult(err)
        }
    },

    async listShipmentEvents() {
        if (!this.data.shipmentEventsQueryNo) {
            return wx.showToast({ title: '请输入 shipmentNo', icon: 'none' })
        }
        try {
            const res = await api.request(`/api/v1/shipments/${this.data.shipmentEventsQueryNo}/events`)
            this.setResult(res)
        } catch (err) {
            this.setResult(err)
        }
    },

    async save() {
        try {
            let res
            if (this.data.form.id) {
                res = await api.request(`/api/v1/logistics/${this.data.form.id}`, 'PUT', this.data.form)
            } else {
                res = await api.request('/api/v1/logistics', 'POST', this.data.form)
            }
            this.setResult(res)
            wx.showToast({ title: '保存成功' })
        } catch (err) {
            this.setResult(err)
        }
    },

    async query() {
        if (!this.data.queryNo) return wx.showToast({ title: '请输入 batchNo', icon: 'none' })
        try {
            const res = await api.request(`/api/v1/logistics?batchNo=${this.data.queryNo}`)
            this.setResult(res)
        } catch (err) {
            this.setResult(err)
        }
    },

    async remove() {
        if (!this.data.form.id) return wx.showToast({ title: '请输入记录ID', icon: 'none' })
        try {
            const res = await api.request(`/api/v1/logistics/${this.data.form.id}`, 'DELETE')
            this.setResult(res)
            wx.showToast({ title: '删除成功' })
        } catch (err) {
            this.setResult(err)
        }
    }
})
