const api = require('../../utils/api')

const REFRESH_KEY = 'inspectionNeedRefresh'
const LAST_QUERY_KEY = 'inspectionLastQueryNo'

Page({
    data: {
        // When id is present, we are viewing/updating an existing record.
        id: '',
        loading: false,
        parentLocked: false,

        // Create flow (always generates a new child batch + QR).
        createForm: {
            parentBatchNo: '',
            result: '',
            reportUrl: '',
            inspector: '',
            details: ''
        },

        // Detail/edit flow for an existing inspection record.
        record: {
            id: '',
            batchNo: '',
            result: '',
            reportUrl: '',
            inspector: ''
        }
    },

    onLoad(options) {
        if (api.role === 'FARMER') {
            wx.showToast({ title: '无权限（农户仅可使用种植相关模块）', icon: 'none' })
            return wx.redirectTo({ url: '/pages/index/index' })
        }

        const opts = options || {}
        const id = opts.id ? String(opts.id) : ''
        this.setData({ id })

        if (id) {
            this.loadRecord(id)
            return
        }

        // Prefill from scan/manual entry.
        if (opts.parentBatchNo) {
            this.setData({
                'createForm.parentBatchNo': String(opts.parentBatchNo),
                parentLocked: String(opts.lockedParent || '') === '1'
            })
        } else {
            this.setData({ parentLocked: false })
        }
    },

    async loadRecord(id) {
        this.setData({ loading: true })
        try {
            const res = await api.request(`/api/v1/inspection/${encodeURIComponent(String(id))}`)
            const r = res?.data || {}
            this.setData({
                record: {
                    id: r.id ? String(r.id) : '',
                    batchNo: r.batchNo || '',
                    result: r.result || '',
                    reportUrl: r.reportUrl || '',
                    inspector: r.inspector || ''
                }
            })
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    onCreateInput(e) {
        const { field } = e.currentTarget.dataset
        if (field === 'parentBatchNo' && this.data.parentLocked) return
        this.setData({ [`createForm.${field}`]: e.detail.value })
    },

    onRecordInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`record.${field}`]: e.detail.value })
    },

    async submitAndGenQr() {
        const payload = { ...this.data.createForm }
        if (!payload.parentBatchNo) return wx.showToast({ title: '请先填写被检批次号', icon: 'none' })
        if (!payload.result) return wx.showToast({ title: '请先填写检测结果', icon: 'none' })
        if (!payload.inspector) return wx.showToast({ title: '请先填写质检员', icon: 'none' })

        try {
            wx.showLoading({ title: '正在提交' })
            // Force backend to auto-generate child batchNo.
            payload.childBatchNo = null
            const res = await api.request('/api/v1/inspection/derive', 'POST', payload)
            const derivedBatchNo = res?.data?.derivedBatch?.batchNo || ''

            // Refresh list after returning.
            if (derivedBatchNo) wx.setStorageSync(LAST_QUERY_KEY, derivedBatchNo)
            wx.setStorageSync(REFRESH_KEY, true)

            wx.hideLoading()
            wx.showToast({ title: '提交成功' })

            if (!derivedBatchNo) {
                setTimeout(() => wx.navigateBack(), 300)
                return
            }

            setTimeout(() => {
                wx.redirectTo({ url: `/pages/qrcode/index?batchNo=${encodeURIComponent(String(derivedBatchNo))}` })
            }, 300)
        } catch (err) {
            wx.hideLoading()
            wx.showToast({ title: err?.data?.message || '提交失败', icon: 'none' })
        }
    },

    async saveRecord() {
        const r = this.data.record || {}
        if (!r.id) return
        if (!r.batchNo) return wx.showToast({ title: '缺少批次号', icon: 'none' })
        if (!r.result) return wx.showToast({ title: '请先填写检测结果', icon: 'none' })
        if (!r.inspector) return wx.showToast({ title: '请先填写质检员', icon: 'none' })

        try {
            wx.showLoading({ title: '正在保存' })
            await api.request(`/api/v1/inspection/${encodeURIComponent(String(r.id))}`, 'PUT', {
                batchNo: r.batchNo,
                result: r.result,
                reportUrl: r.reportUrl,
                inspector: r.inspector
            })
            wx.hideLoading()
            wx.setStorageSync(REFRESH_KEY, true)
            wx.showToast({ title: '已保存' })
        } catch (err) {
            wx.hideLoading()
            wx.showToast({ title: err?.data?.message || '保存失败', icon: 'none' })
        }
    },

    viewQr() {
        const batchNo = this.data.record?.batchNo
        if (!batchNo) return wx.showToast({ title: '缺少批次号', icon: 'none' })
        wx.navigateTo({ url: `/pages/qrcode/index?batchNo=${encodeURIComponent(String(batchNo))}` })
    },

    async revokeRecord() {
        const r = this.data.record || {}
        if (!r.id) return

        const confirmed = await new Promise((resolve) => {
            wx.showModal({
                title: '确认撤回',
                content: '确定要撤回该质检记录吗？',
                confirmText: '撤回',
                confirmColor: '#e74c3c',
                success: (res) => resolve(!!res.confirm),
                fail: () => resolve(false)
            })
        })
        if (!confirmed) return

        try {
            wx.showLoading({ title: '正在撤回' })
            await api.request(`/api/v1/inspection/${encodeURIComponent(String(r.id))}`, 'DELETE')
            wx.hideLoading()
            wx.setStorageSync(REFRESH_KEY, true)
            wx.showToast({ title: '已撤回' })
            setTimeout(() => wx.navigateBack(), 300)
        } catch (err) {
            wx.hideLoading()
            wx.showToast({ title: err?.data?.message || '操作失败', icon: 'none' })
        }
    },

    cancel() {
        wx.navigateBack()
    }
})
