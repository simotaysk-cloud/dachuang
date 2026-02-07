const api = require('../../utils/api')

Page({
    data: {
        batches: [],
        form: {
            id: '',
            batchNo: '',
            minCode: '',
            name: '',
            category: '',
            origin: '',
            status: '',
            quantity: '',
            unit: '',
            description: '',
            gs1Locked: false
        },
        queryNo: '',
        showForm: false,
        loading: false
    },

    onLoad() {
        this.listAll()
    },

    async listAll() {
        this.setData({ loading: true })
        try {
            const res = await api.request('/api/v1/batches')
            this.setData({ batches: res.data || [] })
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    async query() {
        if (!this.data.queryNo) {
            return this.listAll()
        }
        this.setData({ loading: true })
        try {
            const res = await api.request(`/api/v1/batches/${this.data.queryNo}`)
            // Result might be a single object or error
            if (res.data) {
                this.setData({ batches: [res.data] })
            } else {
                this.setData({ batches: [] })
                wx.showToast({ title: '未找到批次', icon: 'none' })
            }
        } catch (err) {
            console.error(err)
            this.setData({ batches: [] })
        } finally {
            this.setData({ loading: false })
        }
    },

    startCreate() {
        this.setData({
            showForm: true,
            form: {
                id: '',
                batchNo: '',
                minCode: '',
                name: '',
                category: '',
                origin: '',
                status: 'PLANTING',
                quantity: '',
                unit: '',
                description: '',
                gs1Locked: false
            }
        })
    },

    editFromList(e) {
        const item = e.currentTarget.dataset.item
        this.setData({
            showForm: true,
            form: { ...item } // clone
        })
    },

    cancelEdit() {
        this.setData({ showForm: false })
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`form.${field}`]: e.detail.value })
    },

    onQueryInput(e) {
        this.setData({ queryNo: e.detail.value })
    },

    async save() {
        try {
            const payload = { ...this.data.form }
            if (!payload.id) delete payload.id

            // Quantity handling
            if (payload.quantity === '' || payload.quantity == null) {
                delete payload.quantity
            } else {
                const q = Number(payload.quantity)
                if (Number.isNaN(q)) {
                    delete payload.quantity
                } else {
                    payload.quantity = q
                }
            }
            if (!payload.unit) delete payload.unit

            let res
            if (this.data.form.id) {
                res = await api.request(`/api/v1/batches/${this.data.form.id}`, 'PUT', payload)
            } else {
                res = await api.request('/api/v1/batches', 'POST', payload)
            }

            wx.showToast({ title: '保存成功' })
            this.setData({ showForm: false })
            this.listAll() // Refresh list
        } catch (err) {
            console.error(err)
            // Show error in a more user friendly way if possible, or just toast
            wx.showToast({ title: '保存失败', icon: 'none' })
        }
    },

    async remove() {
        if (!this.data.form.id) return
        const that = this
        wx.showModal({
            title: '确认删除',
            content: '确定要删除该批次吗？',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        await api.request(`/api/v1/batches/${that.data.form.id}`, 'DELETE')
                        wx.showToast({ title: '删除成功' })
                        that.setData({ showForm: false })
                        that.listAll()
                    } catch (err) {
                        console.error(err)
                    }
                }
            }
        })
    },

    async lockGs1() {
        const batchNo = this.data.form.batchNo
        if (!batchNo) return

        const that = this
        wx.showModal({
            title: '确认锁定GS1',
            content: '锁定后，数量和单位将不可再次修改。请确保已完成打印贴标。',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        await api.request(`/api/v1/batches/${batchNo}/lock-gs1`, 'POST')
                        wx.showToast({ title: '已锁定' })
                        that.setData({
                            'form.gs1Locked': true
                        })
                        that.listAll()
                    } catch (err) {
                        console.error(err)
                    }
                }
            }
        })
    }
})
