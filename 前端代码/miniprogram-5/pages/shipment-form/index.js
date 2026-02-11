const api = require('../../utils/api')

const REFRESH_KEY = 'shipmentNeedRefresh'
const LAST_QUERY_KEY = 'shipmentLastQueryBatchNo'

Page({
    data: {
        batchLocked: false,
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
        const batchLocked = String(options.lockedBatch || '') === '1'
        this.setData({ batchLocked })
        if (batchNo) this.setData({ 'form.batchNo': batchNo })
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        if (field === 'batchNo' && this.data.batchLocked) return
        this.setData({ [`form.${field}`]: e.detail.value })
    },

    async create() {
        const batchNo = (this.data.form.batchNo || '').trim()
        const distributorName = (this.data.form.distributorName || '').trim()
        if (!batchNo) return wx.showToast({ title: '请先填写批次号', icon: 'none' })
        if (!distributorName) return wx.showToast({ title: '请先填写收货方', icon: 'none' })

        try {
            const payload = {
                items: [{ batchNo }],
                distributorName,
                carrier: this.data.form.carrier,
                trackingNo: this.data.form.trackingNo,
                remarks: this.data.form.remarks
            }
            await api.request('/api/v1/shipments', 'POST', payload)
            wx.setStorageSync(LAST_QUERY_KEY, batchNo)
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
