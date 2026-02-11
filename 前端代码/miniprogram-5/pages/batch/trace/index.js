const api = require('../../../utils/api')
const { guardFeatureAccess } = require('../../../utils/rbac')

Page({
    data: {
        currentBatchNo: '',
        rootBatch: null,
        tree: [],
        loading: false
    },

    onLoad(options) {
        if (!guardFeatureAccess(api.role, 'BATCH')) return
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
                        childName: childInfo.data.name || '未命名产品',
                        createdAtFormatted: this.formatTime(edge.createdAt)
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
    },

    formatTime(ts) {
        if (!ts) return ''
        // If array: [2024, 2, 10, 12, 30, 45] -> month is 1-based in Java LocalTime array? Yes usually.
        if (Array.isArray(ts)) {
            const [y, m, d, h, min] = ts
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
        }
        // If string
        return String(ts).replace('T', ' ').substring(0, 16)
    },

    viewDetail(e) {
        console.log('viewDetail clicked', e);
        try {
            const item = e.currentTarget.dataset.item;
            if (!item) {
                console.error('No item data found');
                return;
            }
            // Encode object to JSON string to pass to detail page
            const data = encodeURIComponent(JSON.stringify(item));
            wx.navigateTo({
                url: `/pages/batch/lineage-detail/index?data=${data}`,
                fail: (err) => console.error('Navigate failed', err)
            });
        } catch (err) {
            console.error('viewDetail error', err);
            wx.showToast({ title: '无法查看详情', icon: 'none' });
        }
    }
})
