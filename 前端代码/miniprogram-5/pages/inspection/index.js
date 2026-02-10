const api = require('../../utils/api')

const REFRESH_KEY = 'inspectionNeedRefresh'
const LAST_QUERY_KEY = 'inspectionLastQueryNo'

Page({
    data: {
        records: [],
        queryNo: '',
        loading: false
    },

    onLoad() {
        if (api.role === 'FARMER') {
            wx.showToast({ title: '无权限（农户仅可使用种植相关模块）', icon: 'none' })
            return wx.redirectTo({ url: '/pages/index/index' })
        }

        this.listAll()
    },

    onShow() {
        if (wx.getStorageSync(REFRESH_KEY)) {
            wx.removeStorageSync(REFRESH_KEY)
            const last = wx.getStorageSync(LAST_QUERY_KEY) || ''
            if (last) this.setData({ queryNo: last })
            if (this.data.queryNo) this.query()
        }
    },

    onQueryInput(e) {
        this.setData({ queryNo: e.detail.value })
    },

    startCreate() {
        wx.navigateTo({ url: '/pages/inspection-form/index' })
    },

    editFromList(e) {
        const item = e.currentTarget.dataset.item
        if (!item || item.id == null) return
        wx.navigateTo({ url: `/pages/inspection-form/index?id=${encodeURIComponent(String(item.id))}` })
    },

    async listAll() {
        this.setData({ loading: true })
        try {
            const res = await api.request('/api/v1/inspection')
            this.setData({ records: res.data || [] })
            if (!res.data || res.data.length === 0) {
                wx.showToast({ title: '暂无记录', icon: 'none' })
            }
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    refreshList() {
        this.setData({ queryNo: '' })
        wx.removeStorageSync(LAST_QUERY_KEY)
        this.listAll()
    },

    async query() {
        if (!this.data.queryNo) return wx.showToast({ title: '请输入批次号', icon: 'none' })

        this.setData({ loading: true })
        try {
            const res = await api.request(`/api/v1/inspection?batchNo=${this.data.queryNo}`)
            this.setData({ records: res.data || [] })
            wx.setStorageSync(LAST_QUERY_KEY, this.data.queryNo)
            if (!res.data || res.data.length === 0) {
                wx.showToast({ title: '未找到记录', icon: 'none' })
            }
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '查询失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },
})
