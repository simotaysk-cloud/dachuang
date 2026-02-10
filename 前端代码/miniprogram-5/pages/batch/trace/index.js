const api = require('../../../utils/api')

Page({
    data: {
        currentBatchNo: '',
        rootBatch: null,
        tree: [],
        loading: false
    },

    onLoad(options) {
        if (options.batchNo) {
            this.setData({ currentBatchNo: options.batchNo })
            this.loadData(options.batchNo)
        }
    },

    async loadData(batchNo) {
        this.setData({ loading: true, currentBatchNo: batchNo })
        try {
            // 1. Get Root Info
            const batchRes = await api.request(`/api/v1/batches/${batchNo}`)

            // 2. Get Children (1 level for now)
            const childrenRes = await api.request(`/api/v1/batches/${batchNo}/children`)

            // 3. To display names for child batches, we need to fetch them individually or use a bulk API.
            // Since we don't have a bulk API yet (except getAll), let's just show batchNo if name is missing from lineage.
            // Optimization: The backend lineage doesn't strictly include the Child Name, but we can assume it's related or just show batchNo.
            // BETTER: Let's quickly fetch the child batch details for the name? 
            // OR: Just rely on the user clicking to see details.
            // Let's iterate and fetch details for a better UI (N+1 prob but okay for small scale).

            const edges = childrenRes.data || []
            const tree = []

            for (const edge of edges) {
                try {
                    const childInfo = await api.request(`/api/v1/batches/${edge.childBatchNo}`)
                    tree.push({
                        ...edge,
                        childName: childInfo.data.name || '未命名产品'
                    })
                } catch (e) {
                    tree.push({ ...edge, childName: '未知产品' })
                }
            }

            this.setData({
                rootBatch: batchRes.data,
                tree: tree
            })
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    traceChild(e) {
        const batchNo = e.currentTarget.dataset.batch
        if (batchNo) {
            wx.navigateTo({
                url: `/pages/batch/trace/index?batchNo=${encodeURIComponent(batchNo)}`
            })
        }
    },

    copy(e) {
        const text = e.currentTarget.dataset.text
        wx.setClipboardData({ data: text })
    }
})
