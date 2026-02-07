const api = require('../../utils/api')

Page({
    data: {
        batchNo: '',
        result: ''
    },

    onInput(e) {
        this.setData({ batchNo: e.detail.value })
    },

    setResult(data) {
        this.setData({ result: JSON.stringify(data, null, 2) })
    },

    async query() {
        if (!this.data.batchNo) return wx.showToast({ title: '请输入 batchNo', icon: 'none' })
        try {
            const res = await api.request(`/api/v1/trace/${this.data.batchNo}`)
            this.setResult(res)
        } catch (err) {
            this.setResult(err)
        }
    }
})
