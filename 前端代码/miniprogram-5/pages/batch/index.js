const api = require('../../utils/api')

const REFRESH_KEY = 'batchNeedRefresh'

Page({
    data: {
        batches: [],
        queryNo: '',
        loading: false
    },

    onLoad() {
        this.listAll()
    },

    onShow() {
        if (wx.getStorageSync(REFRESH_KEY)) {
            wx.removeStorageSync(REFRESH_KEY)
            this.listAll()
        }
    },

    async listAll() {
        this.setData({ loading: true })
        try {
            const res = await api.request('/api/v1/batches')
            this.setData({ batches: res.data || [] })
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    async query() {
        if (!this.data.queryNo) {
            return this.listAll()
        }
        this.setData({ loading: true })
        try {
            const res = await api.request(`/api/v1/batches/${this.data.queryNo}`)
            // Result might be a single object or error
            if (res.data) {
                this.setData({ batches: [res.data] })
            } else {
                this.setData({ batches: [] })
                wx.showToast({ title: '未找到批次', icon: 'none' })
            }
        } catch (err) {
            console.error(err)
            this.setData({ batches: [] })
        } finally {
            this.setData({ loading: false })
        }
    },

    startCreate() {
        wx.navigateTo({ url: '/pages/batch-form/index' })
    },

    editFromList(e) {
        const item = e.currentTarget.dataset.item
        if (!item || !item.batchNo) return
        wx.navigateTo({ url: `/pages/batch-form/index?batchNo=${encodeURIComponent(String(item.batchNo))}` })
    },

    onQueryInput(e) {
        this.setData({ queryNo: e.detail.value })
    },
})
