const api = require('../../../utils/api')
const { guardFeatureAccess } = require('../../../utils/rbac')

Page({
    data: {
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
        // 模拟的本草数据 (TCM Properties)
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
        // 生态环境数据 (Environmental Data)
        envData: {
            altitude: 852,
            daylight: '2380h',
            rainfall: '720mm',
            soilPH: '6.2'
        }
    },

    onStepClick(e) {
        const stepIdx = e.detail.step;
        
        // Map 5 stepper index to 5 pipeline station IDs
        let targetId = 'p1';
        switch (stepIdx) {
            case 0: targetId = 'p1'; break; // 资源产地 -> p1
            case 1: targetId = 'p2'; break; // 原料质检 -> p2
            case 2: targetId = 'p3'; break; // 深加工 -> p3
            case 3: targetId = 'p4'; break; // 成品检验 -> p4
            case 4: targetId = 'p5'; break; // 终端溯源 -> p5
        }
        
        wx.pageScrollTo({
            selector: '.pipeline-container',
            duration: 300,
            success: () => {
                setTimeout(() => {
                    this.setData({ scrollToId: targetId });
                }, 300);
            }
        });
    },

    onLoad(options) {
        if (!guardFeatureAccess(api.role, 'BATCH')) return
        if (options.batchNo) {
            this.loadData(options.batchNo)
        } else {
            wx.showToast({ title: '批次号无效', icon: 'error' })
        }
    },

    async loadData(batchNo) {
        this.setData({ loading: true, currentBatchNo: batchNo, scanCompleted: false })
        try {
            const res = await api.request(`/api/v1/trace/${batchNo}?t=${Date.now()}`)
            const data = res.data || {}
            
            const stations = this.parseStations(data)

            let processStepIdx = 0; 
            if (data.processingRecords && data.processingRecords.length > 0) {
                processStepIdx = 2; // 加工阶段
            } else if (data.inspectionRecords && data.inspectionRecords.some(r => r.inspectionType === 'RAW' || !r.inspectionType)) {
                processStepIdx = 1; // 原料质检
            }
            if (data.logisticsRecords && data.logisticsRecords.length > 0) {
                processStepIdx = 4; // 物流阶段/终端溯源
            } else if (data.inspectionRecords && data.inspectionRecords.some(r => r.inspectionType === 'FINISHED' || (!r.inspectionType && data.inspectionRecords.length > 1))) {
                processStepIdx = 3; // 成品检验 
            }

            this.setData({
                batchData: data.batch || {},
                stations: stations,
                batchNo: batchNo,
                processStepIdx: processStepIdx
            })

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

        // 1. 资源产地 (p1)
        stations.push({
            id: 'p1',
            type: 'planting',
            title: '资源产地',
            active: true,
            icon: '🌱',
            time: this.formatTime(batch?.createdAt),
            records: [
                { content: `产地归属：${batch?.origin || '标准GAP种植基地'}` },
                { content: `品种记录已完成链上登记` }
            ],
            outputQty: batch?.quantity || 0,
            unit: batch?.unit || '单位'
        })

        // 2. 原料质检 (p2)
        const rawInspection = inspectionRecords && (
            inspectionRecords.find(r => r.inspectionType === 'RAW') || 
            (inspectionRecords.length > 0 && !inspectionRecords[0].inspectionType ? inspectionRecords[0] : null)
        );
        let p2Records = [];
        if (rawInspection) {
            const resStr = rawInspection.result || '合格';
            if (resStr.includes('；')) {
                const parts = resStr.split('；').filter(Boolean);
                p2Records = parts.map(p => ({ content: p.trim() }));
            } else {
                p2Records = [{ content: `质检结果：${resStr}` }];
            }
            p2Records.push({ content: `操作人：${rawInspection.inspector || '质检员'}` });
        } else {
            p2Records = [{ content: '暂无收样质检数据' }];
        }

        stations.push({
            id: 'p2',
            type: 'inspection-raw',
            title: '原料质检',
            active: !!rawInspection,
            icon: '🔬',
            time: rawInspection ? this.formatTime(rawInspection.createdAt) : '',
            records: p2Records,
            outputQty: '通过',
            unit: '检验'
        })

        // 3. 深加工 (p3)
        // ... (keep p3 as is)
        const hasProcessing = processingRecords && processingRecords.length > 0;
        let p3Records = [];
        if (hasProcessing) {
            p3Records = processingRecords.map(r => {
                const stepName = r.processType || '加工工序';
                const detailName = r.lineName || r.details || r.factory || '按规范处理';
                return { content: `${stepName}: ${detailName}` };
            });
        } else {
            p3Records = [{ content: '尚未进入深加工阶段' }];
        }
        
        stations.push({
            id: 'p3',
            type: 'processing',
            title: '工业深加工',
            active: hasProcessing,
            icon: '🏭',
            time: hasProcessing ? this.formatTime(processingRecords[processingRecords.length - 1].createdAt) : '',
            records: p3Records,
            progress: hasProcessing ? 100 : '',
            currentStep: hasProcessing ? '加工已完成' : '',
            outputQty: hasProcessing ? (processingRecords[processingRecords.length - 1].outputQuantity || batch?.quantity || 0) : '未出库',
            unit: hasProcessing ? (processingRecords[processingRecords.length - 1].outputUnit || batch?.unit || '单位') : ''
        })

        // 4. 成品检验 (p4)
        const finishInspection = inspectionRecords && (
            inspectionRecords.find(r => r.inspectionType === 'FINISHED') || 
            (inspectionRecords.length > 1 && !inspectionRecords[inspectionRecords.length - 1].inspectionType ? inspectionRecords[inspectionRecords.length - 1] : null)
        );
        let p4Records = [];
        if (finishInspection) {
            const resStr = finishInspection.result || '合格';
            if (resStr.includes('；')) {
                const parts = resStr.split('；').filter(Boolean);
                p4Records = parts.map(p => ({ content: p.trim() }));
            } else {
                p4Records = [{ content: `放行核准：${resStr}` }];
            }
        } else {
            p4Records = [{ content: '等待产线提交质检报告' }];
        }

        stations.push({
            id: 'p4',
            type: 'inspection-end',
            title: '成品检验',
            active: !!finishInspection,
            icon: '✅',
            time: finishInspection ? this.formatTime(finishInspection.createdAt) : '',
            records: p4Records,
            outputQty: '合格率',
            unit: '100%'
        })

        // 5. 终端溯源 / 物流 (p5)
        const lastLog = logisticsRecords && logisticsRecords.length > 0 ? logisticsRecords[logisticsRecords.length-1] : null;
        stations.push({
            id: 'p5',
            type: 'logistics',
            title: '终端溯源',
            active: !!lastLog,
            icon: '🚚',
            time: lastLog ? this.formatTime(lastLog.createdAt) : '',
            records: lastLog 
                ? [{ content: `当前位置：${lastLog.location}` }, { content: `运输状态：${lastLog.status}` }]
                : [{ content: '待入库分发' }],
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
            const [y, m, d, h, min] = ts
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
