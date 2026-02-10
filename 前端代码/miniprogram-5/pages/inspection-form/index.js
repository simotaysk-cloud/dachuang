const api = require('../../utils/api')

const REFRESH_KEY = 'inspectionNeedRefresh'
const LAST_QUERY_KEY = 'inspectionLastQueryNo'

Page({
    data: {
        mode: 'SIMPLE',
        form: {
            id: '',
            batchNo: '',
            result: '',
            reportUrl: '',
            inspector: ''
        },
        deriveForm: {
            parentBatchNo: '',
            childBatchNo: '',
            result: '',
            reportUrl: '',
            inspector: '',
            details: ''
        }
    },

    onLoad(options) {
        if (api.role === 'FARMER') {
            wx.showToast({ title: '无权限（农户仅可使用种植相关模块）', icon: 'none' })
            return wx.redirectTo({ url: '/pages/index/index' })
        }
        this.init(options || {})
    },

    async init(options) {
        const id = options.id ? String(options.id) : ''
        if (!id) return

        try {
            const res = await api.request(`/api/v1/inspection/${encodeURIComponent(id)}`)
            if (res?.data) {
                this.setData({
                    mode: 'SIMPLE',
                    form: { ...res.data }
                })
            }
        } catch (err) {
            wx.showToast({ title: '加载失败', icon: 'none' })
        }
    },

    switchMode(e) {
        const mode = e.currentTarget.dataset.mode
        if (!mode) return
        this.setData({ mode })
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`form.${field}`]: e.detail.value })
    },

    onDeriveInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`deriveForm.${field}`]: e.detail.value })
    },

    async derive() {
        try {
            await api.request('/api/v1/inspection/derive', 'POST', this.data.deriveForm)
            const q = this.data.deriveForm.parentBatchNo || this.data.deriveForm.childBatchNo || ''
            if (q) wx.setStorageSync(LAST_QUERY_KEY, q)
            wx.setStorageSync(REFRESH_KEY, true)
            wx.showToast({ title: '派生并发布成功' })
            setTimeout(() => wx.navigateBack(), 300)
        } catch (err) {
            wx.showToast({ title: err?.data?.message || '操作失败', icon: 'none' })
        }
    },

    async save() {
        try {
            const payload = { ...this.data.form }
            if (!payload.id) delete payload.id

            if (this.data.form.id) {
                await api.request(`/api/v1/inspection/${this.data.form.id}`, 'PUT', payload)
            } else {
                await api.request('/api/v1/inspection', 'POST', payload)
            }

            if (payload.batchNo) wx.setStorageSync(LAST_QUERY_KEY, payload.batchNo)
            wx.setStorageSync(REFRESH_KEY, true)
            wx.showToast({ title: '保存成功' })
            setTimeout(() => wx.navigateBack(), 300)
        } catch (err) {
            wx.showToast({ title: err?.data?.message || '保存失败', icon: 'none' })
        }
    },

    async remove() {
        if (!this.data.form.id) return
        const confirmed = await new Promise((resolve) => {
            wx.showModal({
                title: '确认撤回',
                content: '确定要撤回该质检报告吗？',
                confirmText: '撤回',
                confirmColor: '#e74c3c',
                success: (r) => resolve(!!r.confirm),
                fail: () => resolve(false)
            })
        })
        if (!confirmed) return

        try {
            await api.request(`/api/v1/inspection/${this.data.form.id}`, 'DELETE')
            wx.setStorageSync(REFRESH_KEY, true)
            wx.showToast({ title: '撤回成功' })
            setTimeout(() => wx.navigateBack(), 300)
        } catch (err) {
            wx.showToast({ title: err?.data?.message || '操作失败', icon: 'none' })
        }
    },

    cancel() {
        wx.navigateBack()
    }
})

