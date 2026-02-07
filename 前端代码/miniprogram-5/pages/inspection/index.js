const api = require('../../utils/api')

Page({
    data: {
        deriveForm: {
            parentBatchNo: '',
            childBatchNo: '',
            result: '',
            reportUrl: '',
            inspector: '',
            details: ''
        },

        form: {
            id: '',
            batchNo: '',
            result: '',
            reportUrl: '',
            inspector: ''
        },
        queryNo: '',
        result: ''
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`form.${field}`]: e.detail.value })
    },

    onQueryInput(e) {
        this.setData({ queryNo: e.detail.value })
    },

    onDeriveInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`deriveForm.${field}`]: e.detail.value })
    },

    setResult(data) {
        this.setData({ result: JSON.stringify(data, null, 2) })
    },

    async derive() {
        try {
            const res = await api.request('/api/v1/inspection/derive', 'POST', this.data.deriveForm)
            this.setResult(res)
            wx.showToast({ title: '派生成功' })
        } catch (err) {
            this.setResult(err)
        }
    },

    async save() {
        try {
            let res
            if (this.data.form.id) {
                res = await api.request(`/api/v1/inspection/${this.data.form.id}`, 'PUT', this.data.form)
            } else {
                res = await api.request('/api/v1/inspection', 'POST', this.data.form)
            }
            this.setResult(res)
            wx.showToast({ title: '保存成功' })
        } catch (err) {
            this.setResult(err)
        }
    },

    async remove() {
        if (!this.data.form.id) return wx.showToast({ title: '请输入记录ID', icon: 'none' })
        try {
            const res = await api.request(`/api/v1/inspection/${this.data.form.id}`, 'DELETE')
            this.setResult(res)
            wx.showToast({ title: '删除成功' })
        } catch (err) {
            this.setResult(err)
        }
    },

    async query() {
        if (!this.data.queryNo) return wx.showToast({ title: '请输入 batchNo', icon: 'none' })
        try {
            const res = await api.request(`/api/v1/inspection?batchNo=${this.data.queryNo}`)
            this.setResult(res)
        } catch (err) {
            this.setResult(err)
        }
    }
})
