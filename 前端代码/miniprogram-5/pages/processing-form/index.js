const api = require('../../utils/api')

const REFRESH_KEY = 'processingNeedRefresh'
const LAST_QUERY_KEY = 'processingLastQueryNo'

Page({
    data: {
        loading: false,
        readOnly: false,
        form: {
            id: '',
            parentBatchNo: '',
            batchNo: '',
            processType: '',
            lineName: '',
            factory: '',
            details: '',
            operator: '',
            imageUrl: ''
        },
        actionModes: ['追加工序 (同识别码)', '完工结算 (生成新码)'],
        actionModeIndex: 0
    },

    onActionModeChange(e) {
        this.setData({ actionModeIndex: e.detail.value })
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
            if (res?.data) this.setData({ form: { ...res.data }, readOnly: true })
        } catch (err) {
            wx.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    onInput(e) {
        if (this.data.readOnly) return
        const { field } = e.currentTarget.dataset
        this.setData({ [`form.${field}`]: e.detail.value })
    },

    async save() {
        if (this.data.readOnly) {
            wx.showToast({ title: '该记录已锁定，不可修改', icon: 'none' })
            return
        }
        try {
            const payload = { ...this.data.form }
            if (!payload.id) delete payload.id

            // "Settle Line" mode: we want to create a NEW batch from the parent.
            // Backend deriveBatch is triggered when parentBatchNo is provided and batchNo matches certain conditions.
            // For our UI, if it's "Settle Mode", we ensure batchNo is empty so backend generates a new one.
            if (this.data.actionModeIndex == 1) {
                payload.batchNo = ''
            }

            if (!payload.batchNo) delete payload.batchNo

            let res
            if (this.data.form.id) {
                res = await api.request(`/api/v1/processing/${this.data.form.id}`, 'PUT', payload)
            } else {
                res = await api.request('/api/v1/processing', 'POST', payload)
            }

            const newBatchNo = res?.data?.batchNo || ''
            if (newBatchNo && this.data.actionModeIndex == 1) {
                wx.showModal({
                    title: '产线结算成功',
                    content: `已成功派生新识别码：\n${newBatchNo}\n\n请打印并贴在产线出口的容器上。`,
                    showCancel: false,
                    success: () => {
                        wx.setStorageSync(LAST_QUERY_KEY, newBatchNo)
                        wx.setStorageSync(REFRESH_KEY, true)
                        wx.navigateBack()
                    }
                })
            } else {
                const q = newBatchNo || payload.parentBatchNo || ''
                if (q) wx.setStorageSync(LAST_QUERY_KEY, q)
                wx.setStorageSync(REFRESH_KEY, true)
                wx.showToast({ title: '记录已保存' })
                setTimeout(() => wx.navigateBack(), 300)
            }
        } catch (err) {
            wx.showToast({ title: err?.data?.message || '保存失败', icon: 'none' })
        }
    },

    async remove() {
        if (this.data.readOnly) {
            wx.showToast({ title: '该记录已锁定，不可删除', icon: 'none' })
            return
        }
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
