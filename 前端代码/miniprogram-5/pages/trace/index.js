const api = require('../../utils/api')

Page({
    data: {
        batchNo: '',
        loading: false,
        report: null, // Structured trace report
    },

    onLoad() {
        if (api.role === 'FARMER') {
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

        // --- Ultra-Robust GS1 Detection ---
        let gs1 = b.gs1Code || b.gs1code || b.gs1_code || ''

        // 1. If not found by key, search all string values for the GS1 pattern (01)
        if (!gs1) {
            const keys = Object.keys(b)
            const gKey = keys.find(k => typeof b[k] === 'string' && b[k].includes('(01)'))
            if (gKey) gs1 = b[gKey]
        }

        // 2. If still not found, try to construct it from lotNo if we have it
        if (!gs1) {
            const lot = b.gs1LotNo || b.gs1lot_no || b.gs1lotno || ''
            if (lot) {
                gs1 = `(01)06912345678901(10)${lot}`
            }
        }

        // 3. Final fallback: use batchNo
        if (!gs1 && b.batchNo) {
            gs1 = `(01)06912345678901(10)${b.batchNo}`
        }

        // Flatten all records into a chronological timeline
        const timeline = []

        // 1. Planting
        if (data.plantingRecords) {
            data.plantingRecords.forEach(r => {
                timeline.push({
                    stage: 'PLANTING',
                    tag: '种植',
                    title: r.operation,
                    time: r.createdAt,
                    details: `${r.fieldName} | 操作人: ${r.operator}\n${r.details}`,
                    icon: '🌱'
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
                    details: `${r.factory} | 操作人: ${r.operator}\n${r.details}`,
                    icon: '⚙️'
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
                timeline: timeline
            }
        })
    }
})
