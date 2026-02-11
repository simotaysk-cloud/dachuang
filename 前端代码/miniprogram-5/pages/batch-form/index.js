const api = require('../../utils/api')
const { guardFeatureAccess } = require('../../utils/rbac')

const REFRESH_KEY = 'batchNeedRefresh'

Page({
    data: {
        role: api.role || '',
        loading: false,
        form: {
            id: '',
            batchNo: '',
            minCode: '',
            name: '',
            category: '根茎类',
            origin: '',
            status: 'PLANTING',
            quantity: '',
            unit: '',
            description: '',
            gs1Locked: false
        },
        categories: ['根茎类', '花叶类', '全草类', '饮片', '提取物', '颗粒剂', '成药/胶囊', '其他']
    },

    onCategoryChange(e) {
        const idx = e.detail.value
        this.setData({ 'form.category': this.data.categories[idx] })
    },

    onLoad(options) {
        if (!guardFeatureAccess(api.role, 'BATCH')) return
        this.setData({ role: api.role || '' })
        this.init(options || {})
    },

    async init(options) {
        const batchNo = options.batchNo ? decodeURIComponent(String(options.batchNo)) : ''
        if (!batchNo) return

        this.setData({ loading: true })
        try {
            const res = await api.request(`/api/v1/batches/${encodeURIComponent(batchNo)}`)
            if (res?.data) {
                this.setData({ form: { ...res.data } })
            }
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

            // For FARMER, backend ignores client batchNo; we avoid sending it.
            if (this.data.role === 'FARMER') {
                delete payload.batchNo
            } else {
                if (!payload.batchNo) delete payload.batchNo
            }

            // Quantity handling (demo): accept numeric; empty means null.
            if (payload.quantity === '' || payload.quantity == null) {
                delete payload.quantity
            } else {
                const q = Number(payload.quantity)
                if (Number.isNaN(q)) {
                    delete payload.quantity
                } else {
                    payload.quantity = q
                }
            }
            if (!payload.unit) delete payload.unit

            if (this.data.form.id) {
                await api.request(`/api/v1/batches/${this.data.form.id}`, 'PUT', payload)
            } else {
                await api.request('/api/v1/batches', 'POST', payload)
            }

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
                content: '确定要删除该批次吗？',
                confirmText: '删除',
                confirmColor: '#e74c3c',
                success: (r) => resolve(!!r.confirm),
                fail: () => resolve(false)
            })
        })
        if (!confirmed) return

        try {
            await api.request(`/api/v1/batches/${this.data.form.id}`, 'DELETE')
            wx.setStorageSync(REFRESH_KEY, true)
            wx.showToast({ title: '删除成功' })
            setTimeout(() => wx.navigateBack(), 300)
        } catch (err) {
            wx.showToast({ title: err?.data?.message || '删除失败', icon: 'none' })
        }
    },

    async lockGs1() {
        const batchNo = this.data.form.batchNo
        if (!batchNo) return

        const confirmed = await new Promise((resolve) => {
            wx.showModal({
                title: '确认锁定GS1',
                content: '锁定后，数量和单位将不可再次修改。请确保已完成打印贴标。',
                confirmText: '锁定',
                success: (r) => resolve(!!r.confirm),
                fail: () => resolve(false)
            })
        })
        if (!confirmed) return

        try {
            const res = await api.request(`/api/v1/batches/${encodeURIComponent(batchNo)}/lock-gs1`, 'POST')
            if (res?.data) {
                this.setData({ form: { ...res.data } })
            } else {
                this.setData({ 'form.gs1Locked': true })
            }
            wx.setStorageSync(REFRESH_KEY, true)
            wx.showToast({ title: '已锁定' })
        } catch (err) {
            wx.showToast({ title: err?.data?.message || '锁定失败', icon: 'none' })
        }
    },

    cancel() {
        wx.navigateBack()
    }
})
