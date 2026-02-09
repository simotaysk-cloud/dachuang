const api = require('../../utils/api')

const REFRESH_KEY = 'processingNeedRefresh'
const LAST_QUERY_KEY = 'processingLastQueryNo'

Page({
    data: {
        loading: false,
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

        this.setData({ loading: true })
        try {
            const res = await api.request(`/api/v1/processing/${encodeURIComponent(id)}`)
            if (res?.data) this.setData({ form: { ...res.data } })
        } catch (err) {
            wx.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`form.${field}`]: e.detail.value })
    },

    async save() {
        try {
            const payload = { ...this.data.form }
            if (!payload.id) delete payload.id
            if (!payload.batchNo) delete payload.batchNo // allow backend to gen

            let res
            if (this.data.form.id) {
                res = await api.request(`/api/v1/processing/${this.data.form.id}`, 'PUT', payload)
            } else {
                res = await api.request('/api/v1/processing', 'POST', payload)
            }

            const q = res?.data?.batchNo || payload.parentBatchNo || ''
            if (q) wx.setStorageSync(LAST_QUERY_KEY, q)
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
                title: '确认删除',
                content: '确定要删除该记录吗？',
                confirmText: '删除',
                confirmColor: '#e74c3c',
                success: (r) => resolve(!!r.confirm),
                fail: () => resolve(false)
            })
        })
        if (!confirmed) return

        try {
            await api.request(`/api/v1/processing/${this.data.form.id}`, 'DELETE')
            wx.setStorageSync(REFRESH_KEY, true)
            wx.showToast({ title: '删除成功' })
            setTimeout(() => wx.navigateBack(), 300)
        } catch (err) {
            wx.showToast({ title: err?.data?.message || '删除失败', icon: 'none' })
        }
    },

    cancel() {
        wx.navigateBack()
    }
})

