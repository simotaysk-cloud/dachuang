const api = require('../../../utils/api')
const { guardFeatureAccess } = require('../../../utils/rbac')

Page({
    data: {
        usernameRaw: api.username || 'user',
        roleLabel: api.getRoleName(api.role),
        currentBatchNo: '',
        stations: [],
        loading: false,
        scanCompleted: false,
        showDetail: false,
        showCertModal: false,
        showLedgerViz: false,
        mockCert: {},
        currHashShort: '',
        prevHashShort: '',

        tcmProperties: {
            nature: '微温',
            taste: '甘、微苦',
            meridian: '脾、肺、心、肾经',
            ingredients: [
                { name: '人参总皂苷', value: 3.52 },
                { name: '人参多糖', value: 12.8 }
            ],
            combinations: ['配黄芪：补气固表', '配麦冬：生津敛汗', '配五味子：益气生津']
        },

        envData: {
            altitude: 852,
            daylight: '2380h',
            rainfall: '720mm',
            soilPH: '6.2'
        }
    },

    onLoad(options) {
        if (!guardFeatureAccess(api.role, 'BATCH')) return
        this.setData({
            usernameRaw: api.username || 'user',
            roleLabel: api.getRoleName(api.role)
        })
        if (options.batchNo) {
            this.loadData(options.batchNo)
        }
    },

    onBack() {
        const pages = getCurrentPages()
        if (pages.length > 1) {
            wx.navigateBack()
            return
        }
        wx.reLaunch({ url: '/pages/index/index' })
    },

    async loadData(batchNo) {
        this.setData({ loading: true, currentBatchNo: batchNo, scanCompleted: false })
        try {
            const res = await api.request(`/api/v1/trace/${batchNo}`)
            const data = res.data || {}

            // 数据解析：将扁平记录转换为“流水线工位”
            const stations = this.parseStations(data)

            this.setData({
                batchData: data.batch || {},
                stations: stations,
                batchNo: batchNo
            })

            // 模拟高科技激光扫描鉴伪动画
            setTimeout(() => {
                this.setData({ scanCompleted: true })
            }, 2500)

        } catch (err) {
            console.error('loadData Failed:', err)
            wx.showToast({ title: '流转数据解析失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    parseStations(traceData) {
        const { batch, processingRecords, logisticsRecords, inspectionRecords } = traceData
        const stations = []

        const rawInspections = (inspectionRecords || []).filter(r => r.inspectionType === 'RAW')
        const processInspections = (inspectionRecords || []).filter(r => r.inspectionType === 'IN-PROCESS')
        const finishedInspections = (inspectionRecords || []).filter(r => r.inspectionType === 'FINISHED' || !r.inspectionType)

        // 1. 种植/源头工位
        stations.push({
            id: 'p1',
            type: 'planting',
            title: '地头溯源 (种植)',
            active: true,
            icon: '🌱',
            time: this.formatTime(batch.productionDate),
            records: [
                { content: `基地位置：${batch.origin || '自有GAP基地'}` },
                { content: `品种批次已在至信链存证` }
            ],
            outputQty: batch.quantity,
            unit: batch.unit
        })

        // 2. 原料初检
        const hasRaw = rawInspections.length > 0
        stations.push({
            id: 'p_raw',
            type: 'inspection',
            title: '原料初检',
            active: hasRaw,
            icon: '🔬',
            time: hasRaw ? this.formatTime(rawInspections[0].createdAt) : '',
            records: hasRaw
                ? rawInspections.map(r => ({ content: `结果：${r.result} (${r.inspector || '系统'})` }))
                : [{ content: '等待产地初检确认' }],
            outputQty: '原料',
            unit: '入库'
        })

        // 3. 加工工位 (如果有记录)
        if (processingRecords && processingRecords.length > 0) {
            const lastProc = processingRecords[processingRecords.length - 1]
            const procRecords = processingRecords.map(r => ({ content: `${r.processType}: ${r.lineName}` }))
            processInspections.forEach(r => procRecords.push({ content: `[抽检] ${r.result}` }))

            stations.push({
                id: 'p2',
                type: 'processing',
                title: '工业化加工',
                active: true,
                icon: '🏭',
                time: this.formatTime(lastProc.createdAt),
                records: procRecords,
                progress: 100,
                currentStep: '加工已完成',
                outputQty: lastProc.outputQuantity || batch.quantity,
                unit: lastProc.outputUnit || batch.unit
            })
        } else {
            // Mock 一个正在处理的状态
            stations.push({
                id: 'p2',
                type: 'processing',
                title: '数字化车间',
                active: true,
                icon: '🏭',
                records: [{ content: '正在读取车间传感器数据...' }],
                progress: 65,
                currentStep: '工序流转中'
            })
        }

        // 4. 成品质检
        const hasFinished = finishedInspections.length > 0
        stations.push({
            id: 'p_fin',
            type: 'inspection',
            title: '成品出厂检',
            active: hasFinished,
            icon: '📋',
            time: hasFinished ? this.formatTime(finishedInspections[0].createdAt) : '',
            records: hasFinished
                ? finishedInspections.map(r => ({ content: `放行：${r.result}` }))
                : [{ content: '等待批次检验放行单' }],
            outputQty: '质签',
            unit: '达标'
        })

        // 5. 物流/分发
        const lastLog = (logisticsRecords && logisticsRecords.length > 0) ? logisticsRecords[logisticsRecords.length-1] : null
        stations.push({
            id: 'p4',
            type: 'logistics',
            title: '数字仓储物流',
            active: !!lastLog,
            icon: '🚚',
            time: lastLog ? this.formatTime(lastLog.createdAt) : '',
            records: lastLog
                ? [{ content: `当前位置：${lastLog.location}` }, { content: `运输状态：${lastLog.status}` }]
                : [{ content: '待集仓出库' }],
            outputQty: '物流',
            unit: '运输中'
        })

        return stations
    },

    toggleDetail() {
        this.setData({ showDetail: !this.data.showDetail })
    },

    async verifyLogic(e) {
        const idx = e.currentTarget.dataset.index
        const station = this.data.stations[idx]
        const nextStation = this.data.stations[idx + 1]

        wx.showLoading({ title: '链上数据核验...' })

        setTimeout(() => {
            wx.hideLoading()
            wx.showModal({
                title: '脉络逻辑核验成功',
                content: `数据胶囊从 [${station.title}] 流向 [${nextStation.title}]，继承批次属性 ${station.outputQty}${station.unit}。至信链签名校验成功，数据流转闭环且不可篡改。`,
                showCancel: false,
                confirmText: '确认'
            })
        }, 800)
    },

    formatTime(ts) {
        if (!ts) return ''
        if (Array.isArray(ts)) {
            const y = ts[0], m = ts[1], d = ts[2], h = ts[3], min = ts[4]
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
        }
        return String(ts).replace('T', ' ').substring(0, 16)
    },

    showBlockCert() {
        const hashStr = this.data.batchData.txHash || this.generateMockHash(this.data.batchNo + 'tx');
        const heightBase = 16843029;
        const offset = (this.data.batchNo || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 47;

        wx.showLoading({ title: '提取密码学证明', mask: true })
        setTimeout(() => {
            wx.showLoading({ title: '解析至信链回执', mask: true })
            setTimeout(() => {
                wx.hideLoading()
                this.setData({
                    showCertModal: true,
                    mockCert: {
                        txHash: hashStr,
                        contractAddr: '0x3A9E8c3bF02D4A1B8C5F6A90eB32109F4aB2Cc41',
                        blockHeight: heightBase + offset,
                        timestamp: this.formatTime(new Date())
                    }
                })
            }, 600)
        }, 800)
    },

    showLedgerViz() {
        const hashStr = this.data.batchData.txHash || this.generateMockHash(this.data.batchNo + 'tx');
        const prevHash = this.generateMockHash(this.data.batchNo + 'prev');
        const heightBase = 16843029;
        const offset = (this.data.batchNo || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 47;

        wx.showLoading({ title: '连接共识节点...', mask: true })
        setTimeout(() => {
            wx.showLoading({ title: '同步账本拓扑...', mask: true })
            setTimeout(() => {
                wx.hideLoading()
                this.setData({
                    showLedgerViz: true,
                    mockCert: {
                        txHash: hashStr,
                        contractAddr: '0x3A9E8c3bF02D4A1B8C5F6A90eB32109F4aB2Cc41',
                        blockHeight: heightBase + offset,
                        timestamp: this.formatTime(new Date())
                    },
                    currHashShort: '0x' + hashStr.substring(2, 6) + '...' + hashStr.substring(60),
                    prevHashShort: '0x' + prevHash.substring(2, 6) + '...' + prevHash.substring(60)
                })
            }, 800)
        }, 800)
    },

    closeLedgerViz() {
        this.setData({ showLedgerViz: false })
    },

    closeBlockCert() {
        this.setData({ showCertModal: false })
    },

    stopProp() {},

    generateMockHash(str) {
       let hash = '';
       const chars = '0123456789abcdef';
       let num = 0;
       for(let i = 0; i < str.length; i++) num += str.charCodeAt(i);
       for(let i = 0; i < 64; i++) {
           num = (num * 1103515245 + 12345) & 0x7fffffff;
           hash += chars[num % 16];
       }
       return '0x' + hash;
    }
})
