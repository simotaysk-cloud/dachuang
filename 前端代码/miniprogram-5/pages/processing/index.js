const api = require('../../utils/api')

Page({
    data: {
        records: [], // list of processing records
        form: {
            id: '',
            parentBatchNo: '',
            batchNo: '',
            processType: '',
            factory: '',
            details: '',
            operator: '',
            imageUrl: ''
        },
        queryNo: '',
        showForm: false,
        loading: false
    },

    onLoad() {
        // Optionally load recent records if API supports it, or just empty
        // For now let's query a dummy one or just wait for user query
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`form.${field}`]: e.detail.value })
    },

    onQueryInput(e) {
        this.setData({ queryNo: e.detail.value })
    },

    startCreate() {
        this.setData({
            showForm: true,
            form: {
                id: '',
                parentBatchNo: '',
                batchNo: '',
                processType: '',
                factory: '',
                details: '',
                operator: '',
                imageUrl: ''
            }
        })
    },

    editFromList(e) {
        const item = e.currentTarget.dataset.item
        this.setData({
            showForm: true,
            form: { ...item }
        })
    },

    cancelEdit() {
        this.setData({ showForm: false })
    },

    async query() {
        if (!this.data.queryNo) return wx.showToast({ title: '请输入批次号', icon: 'none' })

        this.setData({ loading: true })
        try {
            // The API currently searches by batchNo (output) or parentBatchNo
            // For simplicity in UI, we search by batchNo first
            const res = await api.request(`/api/v1/processing?batchNo=${this.data.queryNo}`)
            this.setData({ records: res.data || [] })
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

    async save() {
        try {
            let res
            const payload = { ...this.data.form }
            if (!payload.id) delete payload.id
            if (!payload.batchNo) delete payload.batchNo // allow backend to gen

            if (this.data.form.id) {
                res = await api.request(`/api/v1/processing/${this.data.form.id}`, 'PUT', payload)
            } else {
                res = await api.request('/api/v1/processing', 'POST', payload)
            }

            wx.showToast({ title: '保存成功' })
            this.setData({ showForm: false })
            // Auto refresh list with the involved batch
            this.setData({ queryNo: res.data.batchNo || payload.parentBatchNo })
            this.query()
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '保存失败', icon: 'none' })
        }
    },

    async remove() {
        if (!this.data.form.id) return
        const that = this
        wx.showModal({
            title: '确认删除',
            content: '确定要删除该记录吗？',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        await api.request(`/api/v1/processing/${that.data.form.id}`, 'DELETE')
                        wx.showToast({ title: '删除成功' })
                        that.setData({ showForm: false })
                        // Refresh if possible
                        if (that.data.queryNo) that.query()
                        else that.setData({ records: [] })
                    } catch (err) {
                        console.error(err)
                    }
                }
            }
        })
    }
})
