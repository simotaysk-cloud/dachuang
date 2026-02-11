const api = require('../../utils/api')
const { guardFeatureAccess } = require('../../utils/rbac')

const LAST_BATCH_KEY = 'lastPlantingBatchNo'
const REFRESH_KEY = 'plantingNeedRefresh'

Page({
    data: {
        profile: null,
        batches: [],
        batchIndex: -1,
        currentBatch: null,
        queryKey: '',
        allRecords: [],
        records: [],
        loading: false,
        lastUpdatedAt: ''
    },

    onLoad() {
        if (!guardFeatureAccess(api.role, 'PLANTING')) return
        this.init()
    },

    onShow() {
        if (wx.getStorageSync(REFRESH_KEY)) {
            wx.removeStorageSync(REFRESH_KEY)
            this.refresh()
        }
    },

    async init() {
        try {
            this.setData({ loading: true })

            const [batchesRes, meRes] = await Promise.all([
                api.listBatches(),
                api.getMe()
            ])

            const batches = Array.isArray(batchesRes?.data) ? batchesRes.data : []
            const profile = meRes?.data || null
            const lastBatchNo = wx.getStorageSync(LAST_BATCH_KEY) || ''

            let batchIndex = 0
            if (lastBatchNo) {
                const idx = batches.findIndex((b) => b?.batchNo === lastBatchNo)
                if (idx >= 0) batchIndex = idx
            }
            if (!batches.length) batchIndex = -1

            const currentBatch = batchIndex >= 0 ? batches[batchIndex] : null
            this.setData({
                batches,
                profile,
                batchIndex,
                currentBatch,
                loading: false
            })

            if (currentBatch?.batchNo) {
                wx.setStorageSync(LAST_BATCH_KEY, currentBatch.batchNo)
                await this.refresh()
            }
        } catch (err) {
            this.setData({ loading: false })
        }
    },

    onBatchChange(e) {
        const idx = Number(e.detail.value)
        if (Number.isNaN(idx)) return
        const currentBatch = this.data.batches[idx] || null
        this.setData({ batchIndex: idx, currentBatch })
        if (currentBatch?.batchNo) {
            wx.setStorageSync(LAST_BATCH_KEY, currentBatch.batchNo)
            this.refresh()
        }
    },

    async refresh() {
        try {
            this.setData({ loading: true })
            const batchNo = this.data.currentBatch?.batchNo
            if (!batchNo) {
                this.setData({ loading: false, allRecords: [], records: [] })
                return
            }

            const res = await api.request(`/api/v1/planting?batchNo=${encodeURIComponent(batchNo)}`)
            const list = Array.isArray(res?.data) ? res.data : []
            const allRecords = list.map((item) => ({
                ...item,
                createdAtText: item?.createdAt ? String(item.createdAt).replace('T', ' ') : '',
                updatedAtText: item?.updatedAt ? String(item.updatedAt).replace('T', ' ') : '',
                operationTimeText: item?.operationTime ? String(item.operationTime).replace('T', ' ') : ''
            }))

            const records = this.applyQuery(allRecords, this.data.queryKey)
            this.setData({
                allRecords,
                records,
                lastUpdatedAt: new Date().toLocaleString(),
                loading: false
            })
        } catch (err) {
            this.setData({ loading: false })
        }
    },

    onQueryInput(e) {
        this.setData({ queryKey: e.detail.value })
    },

    async query() {
        const batchNo = this.data.currentBatch?.batchNo
        if (!batchNo) {
            wx.showToast({ title: '请先选择批次', icon: 'none' })
            return
        }

        // Keep behavior consistent with other modules: query triggers a fetch, then filters.
        await this.refresh()
        if (this.data.queryKey && (!this.data.records || this.data.records.length === 0)) {
            wx.showToast({ title: '未找到记录', icon: 'none' })
        }
    },

    applyQuery(allRecords, queryKey) {
        const list = Array.isArray(allRecords) ? allRecords : []
        const q = (queryKey || '').trim()
        if (!q) return list

        const qLower = q.toLowerCase()
        return list.filter((r) => {
            const idText = r?.id == null ? '' : String(r.id)
            const fieldName = (r?.fieldName || '').toLowerCase()
            const operation = (r?.operation || '').toLowerCase()
            const operator = (r?.operator || '').toLowerCase()
            const details = (r?.details || '').toLowerCase()
            return (
                idText === q ||
                idText.includes(q) ||
                fieldName.includes(qLower) ||
                operation.includes(qLower) ||
                operator.includes(qLower) ||
                details.includes(qLower)
            )
        })
    },

    startCreate() {
        const batchNo = this.data.currentBatch?.batchNo || ''
        if (!batchNo) {
            wx.showToast({ title: '请先选择批次', icon: 'none' })
            return
        }
        wx.navigateTo({ url: `/pages/planting-form/index?batchNo=${encodeURIComponent(batchNo)}` })
    },

    editFromList(e) {
        const { id } = e.currentTarget.dataset
        if (!id) return
        wx.navigateTo({ url: `/pages/planting-form/index?id=${encodeURIComponent(String(id))}` })
    }
})
