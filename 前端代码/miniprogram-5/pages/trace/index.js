const api = require('../../utils/api')

Page({
    data: {
        batchNo: '',
        result: ''
    },

    onLoad() {
        if (api.role === 'FARMER') {
            wx.showToast({ title: '无权限（农户仅可使用种植相关模块）', icon: 'none' })
            return wx.redirectTo({ url: '/pages/index/index' })
        }
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
