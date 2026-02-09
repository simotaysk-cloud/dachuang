const api = require('../../utils/api')

Page({
    data: {
        batchNo: '',
        invisibleCode: '',
        bcData: '',
        result: ''
    },

    onLoad() {
        if (api.role === 'FARMER') {
            wx.showToast({ title: '无权限（农户仅可使用种植相关模块）', icon: 'none' })
            return wx.redirectTo({ url: '/pages/index/index' })
        }
    },

    onBatchInput(e) { this.setData({ batchNo: e.detail.value }) },
    onCodeInput(e) { this.setData({ invisibleCode: e.detail.value }) },
    onBCDataInput(e) { this.setData({ bcData: e.detail.value }) },

    setResult(data) { this.setData({ result: JSON.stringify(data, null, 2) }) },

    async generate() {
        if (!this.data.batchNo) return wx.showToast({ title: '请输入 batchNo', icon: 'none' })
        try {
            const res = await api.request('/api/v1/code/generate', 'POST', { batchNo: this.data.batchNo })
            this.setResult(res)
        } catch (err) { this.setResult(err) }
    },

    async verify() {
        if (!this.data.invisibleCode) return wx.showToast({ title: '请输入隐形码', icon: 'none' })
        try {
            const res = await api.request('/api/v1/code/verify', 'POST', { invisibleCode: this.data.invisibleCode })
            this.setResult(res)
        } catch (err) { this.setResult(err) }
    },

    async recordBC() {
        if (!this.data.batchNo) return wx.showToast({ title: '请输入 batchNo', icon: 'none' })
        try {
            const res = await api.request('/api/v1/blockchain/record', 'POST', {
                batchNo: this.data.batchNo,
                data: this.data.bcData
            })
            const mode = res?.data?.mode ? String(res.data.mode) : ''
            wx.showToast({ title: mode ? `上链成功(${mode})` : '上链成功', icon: 'none' })
            this.setResult(res)
        } catch (err) { this.setResult(err) }
    },

    async queryBC() {
        if (!this.data.batchNo) return wx.showToast({ title: '请输入 batchNo', icon: 'none' })
        try {
            const res = await api.request(`/api/v1/blockchain/${this.data.batchNo}`)
            this.setResult(res)
        } catch (err) { this.setResult(err) }
    },

    async verifyBC() {
        if (!this.data.batchNo) return wx.showToast({ title: '请输入 batchNo', icon: 'none' })
        try {
            const res = await api.request('/api/v1/blockchain/verify', 'POST', {
                batchNo: this.data.batchNo,
                data: this.data.bcData
            })
            const ok = !!res?.data?.match
            wx.showToast({ title: ok ? '验证成功：链上哈希一致' : '验证失败：链上哈希不一致', icon: 'none' })
            this.setResult(res)
        } catch (err) { this.setResult(err) }
    }
})
