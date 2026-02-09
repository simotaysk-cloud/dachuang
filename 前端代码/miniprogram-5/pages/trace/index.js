const api = require('../../utils/api')

Page({
    data: {
        batchNo: '',
        loading: false,
        report: null, // Structured trace report
        isScanned: false, // Whether loaded via QR scan
    },

    onLoad(options) {
        if (options && options.batchNo) {
            this.setData({ batchNo: options.batchNo, isScanned: true })
            this.query()
        } else if (api.role === 'FARMER') {
            wx.showToast({ title: '无权限（农户仅可使用种植相关模块）', icon: 'none' })
            return wx.redirectTo({ url: '/pages/index/index' })
        }
    },

    onInput(e) {
        this.setData({ batchNo: e.detail.value })
    },

    async query() {
        if (!this.data.batchNo) {
            return wx.showToast({ title: '请输入批次号', icon: 'none' })
        }

        this.setData({ loading: true, report: null })
        wx.showLoading({ title: '回溯档案中...' })

        try {
            const res = await api.request(`/api/v1/trace/${this.data.batchNo}`)
            // Unwrapping the data field from the Result object
            this.prepareReport(res.data)
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '查询失败，请检查批次号', icon: 'none' })
        } finally {
            this.setData({ loading: false })
            wx.hideLoading()
        }
    },

    prepareReport(data) {
        console.log('Trace Data Received:', data)
        const b = data.batch || {}

        // Parse commonPairings string into array
        let pairings = []
        if (b.commonPairings) {
            pairings = b.commonPairings.split('\n').map(s => s.replace(/^\d+\.\s*/, '').trim()).filter(s => s)
        }

        // --- Ultra-Robust GS1 Detection ---
        let gs1 = b.gs1Code || b.gs1code || b.gs1_code || ''

        if (!gs1) {
            const keys = Object.keys(b)
            const gKey = keys.find(k => typeof b[k] === 'string' && b[k].includes('(01)'))
            if (gKey) gs1 = b[gKey]
        }

        if (!gs1 && b.gs1LotNo) {
            gs1 = `(01)06912345678901(10)${b.gs1LotNo}`
        }

        if (!gs1 && b.batchNo) {
            gs1 = `(01)06912345678901(10)${b.batchNo}`
        }

        // Flatten all records into a chronological timeline
        const timeline = []

        const formatTime = (isoStr) => {
            if (!isoStr) return '未知时间'
            const d = new Date(isoStr)
            return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        }

        // 1. Planting
        if (data.plantingRecords) {
            data.plantingRecords.forEach(r => {
                timeline.push({
                    stage: 'PLANTING',
                    tag: '种植',
                    title: r.operation,
                    time: r.createdAt,
                    timeDisplay: formatTime(r.createdAt),
                    details: `${r.fieldName} | 操作人: ${r.operator}\n${r.details}`,
                    icon: '🌱',
                    imageUrl: r.imageUrl
                })
            })
        }

        // 2. Processing
        if (data.processingRecords) {
            data.processingRecords.forEach(r => {
                timeline.push({
                    stage: 'PROCESSING',
                    tag: '加工',
                    title: r.processType,
                    time: r.createdAt,
                    timeDisplay: formatTime(r.createdAt),
                    details: `${r.factory} | 操作人: ${r.operator}\n${r.details}`,
                    icon: '⚙️',
                    imageUrl: r.imageUrl
                })
            })
        }

        // 3. Inspection
        if (data.inspectionRecords) {
            data.inspectionRecords.forEach(r => {
                timeline.push({
                    stage: 'INSPECTION',
                    tag: '质检',
                    title: '品质检验通过',
                    time: r.createdAt,
                    timeDisplay: formatTime(r.createdAt),
                    details: `结论: ${r.result} | 质检员: ${r.inspector}`,
                    icon: '🛡️',
                    isHighlight: true
                })
            })
        }

        // 4. Logistics
        if (data.shipmentsWithEvents) {
            data.shipmentsWithEvents.forEach(s => {
                if (s.events) {
                    s.events.forEach(e => {
                        timeline.push({
                            stage: 'LOGISTICS',
                            tag: '物流',
                            title: e.details,
                            time: e.eventTime,
                            timeDisplay: formatTime(e.eventTime),
                            details: `位置: ${e.location} | 状态: ${e.status}`,
                            icon: '🚚'
                        })
                    })
                }
            })
        }

        // Sort by time
        timeline.sort((a, b) => new Date(a.time) - new Date(b.time))

        this.setData({
            report: {
                batch: b,
                gs1: gs1,
                timeline: timeline,
                pairings: pairings
            }
        })
    }
})
