const api = require('../../utils/api')

const REFRESH_KEY = 'shipmentNeedRefresh'
const LAST_QUERY_KEY = 'shipmentLastQueryBatchNo'

Page({
    data: {
        form: {
            batchNo: '',
            distributorName: '',
            carrier: '',
            trackingNo: '',
            remarks: ''
        }
    },

    onLoad(options) {
        if (api.role === 'FARMER') {
            wx.showToast({ title: '无权限（农户仅可使用种植相关模块）', icon: 'none' })
            return wx.redirectTo({ url: '/pages/index/index' })
        }
        const batchNo = options.batchNo ? decodeURIComponent(String(options.batchNo)) : ''
        if (batchNo) this.setData({ 'form.batchNo': batchNo })
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`form.${field}`]: e.detail.value })
    },

    async create() {
        try {
            const payload = {
                items: [{ batchNo: this.data.form.batchNo }],
                distributorName: this.data.form.distributorName,
                carrier: this.data.form.carrier,
                trackingNo: this.data.form.trackingNo,
                remarks: this.data.form.remarks
            }
            await api.request('/api/v1/shipments', 'POST', payload)
            const q = (this.data.form.batchNo || '').trim()
            if (q) wx.setStorageSync(LAST_QUERY_KEY, q)
            wx.setStorageSync(REFRESH_KEY, true)
            wx.showToast({ title: '创建成功' })
            setTimeout(() => wx.navigateBack(), 300)
        } catch (err) {
            wx.showToast({ title: err?.data?.message || '创建失败', icon: 'none' })
        }
    },

    cancel() {
        wx.navigateBack()
    }
})

