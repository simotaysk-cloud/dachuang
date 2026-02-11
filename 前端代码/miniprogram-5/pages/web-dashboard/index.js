const api = require('../../utils/api')

Page({
    data: {
        loading: false,
        traceabilityRateText: '0.00',
        stats: {
            totalHerbTypes: 0,
            totalBatches: 0,
            totalRootBatches: 0,
            totalLeafBatches: 0,
            totalTerminalQrcodes: 0,
            totalProcessingRecords: 0,
            totalShipments: 0,
            totalShipmentEvents: 0,
            overallTraceabilityRate: 0,
            originDist: [],
            processTypeDist: [],
            integrityStats: {},
            recentBlockchainRecords: []
        }
    },

    onLoad() {
        this.loadStats()
    },

    async loadStats() {
        this.setData({ loading: true })
        try {
            const res = await api.request('/api/v1/dashboard/stats')
            const stats = res && res.data ? res.data : {}
            const rateNum = Number(stats.overallTraceabilityRate || 0)
            const rateText = Number.isNaN(rateNum) ? '0.00' : rateNum.toFixed(2)
            const recent = Array.isArray(stats.recentBlockchainRecords)
              ? stats.recentBlockchainRecords.map((item) => ({
                ...item,
                txShort: this.shortTx(item.txHash)
              }))
              : []
            this.setData({
              stats: {
                ...stats,
                recentBlockchainRecords: recent
              },
              traceabilityRateText: rateText
            })
        } catch (e) {
            wx.showToast({ title: '加载看板失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    shortTx(tx) {
        const s = String(tx || '')
        if (!s) return '-'
        if (s.length <= 20) return s
        return `${s.slice(0, 10)}...${s.slice(-8)}`
    }
})
