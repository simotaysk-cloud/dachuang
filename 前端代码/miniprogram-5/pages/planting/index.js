const api = require('../../utils/api')

Page({
    data: {
        form: {
            id: '',
            batchNo: '',
            fieldName: '',
            operation: '',
            operator: '',
            details: '',
            imageUrl: '',
            audioUrl: ''
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

    setResult(data) {
        this.setData({ result: JSON.stringify(data, null, 2) })
    },

    async save() {
        try {
            let res
            if (this.data.form.id) {
                res = await api.request(`/api/v1/planting/${this.data.form.id}`, 'PUT', this.data.form)
            } else {
                res = await api.request('/api/v1/planting', 'POST', this.data.form)
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
            const res = await api.request(`/api/v1/planting?batchNo=${this.data.queryNo}`)
            this.setResult(res)
        } catch (err) {
            this.setResult(err)
        }
    }
})
