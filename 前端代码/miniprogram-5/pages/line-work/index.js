const api = require('../../utils/api')

Page({
    data: {
        batchNo: '',
        batchInfo: null,
        sessionRecords: [],
        showAddModal: false,
        showSettleModal: false,
        addForm: {
            processType: '',
            details: '',
            lineName: '1号生产线',
            operator: '',
            factory: '数字化工厂中心'
        },
        settleForm: {
            statusLabel: '',
            lineName: '1号生产线',
            operator: '',
            factory: '数字化工厂中心'
        }
    },

    async onLoad(options) {
        if (api.role === 'FARMER') {
            wx.showToast({ title: '无权限（农户仅可使用种植相关模块）', icon: 'none' })
            return wx.redirectTo({ url: '/pages/index/index' })
        }

        const batchNo = options.batchNo
        if (!batchNo) {
            wx.showToast({ title: '参数错误', icon: 'none' })
            return wx.navigateBack()
        }
        this.setData({ batchNo })
        await this.initOperator()
        this.fetchBatchInfo(batchNo)
    },

    async initOperator() {
        try {
            const meRes = await api.getMe()
            const u = meRes?.data || {}
            const op = u?.name || u?.nickname || u?.username || ''
            if (op) {
                this.setData({
                    'addForm.operator': op,
                    'settleForm.operator': op
                })
                return
            }
        } catch (e) {
            // ignore
        }
        if (!this.data.addForm.operator) {
            this.setData({
                'addForm.operator': '操作员',
                'settleForm.operator': '操作员'
            })
        }
    },

    async fetchBatchInfo(batchNo) {
        try {
            const res = await api.request(`/api/v1/batches/${encodeURIComponent(String(batchNo))}`)
            if (res?.data) this.setData({ batchInfo: res.data })
        } catch (e) { }
    },

    openAddDialog() {
        this.setData({ showAddModal: true })
    },

    closeAddModal() {
        this.setData({ showAddModal: false })
    },

    openSettleDialog() {
        const inferred = this.inferStatusLabel()
        this.setData({
            showSettleModal: true,
            'settleForm.statusLabel': (this.data.settleForm.statusLabel || '').trim() || inferred
        })
    },

    closeSettleModal() {
        this.setData({ showSettleModal: false })
    },

    onModalInput(e) {
        const { field } = e.currentTarget.dataset
        const { form } = e.currentTarget.dataset
        const formKey = form === 'settle' ? 'settleForm' : 'addForm'
        this.setData({ [`${formKey}.${field}`]: e.detail.value })
    },

    async confirmAdd() {
        if (!this.data.addForm.processType) {
            return wx.showToast({ title: '请填写工艺', icon: 'none' })
        }

        try {
            wx.showLoading({ title: '正在提交' })
            const payload = {
                batchNo: this.data.batchNo,
                processType: this.data.addForm.processType,
                lineName: this.data.addForm.lineName,
                operator: this.data.addForm.operator,
                factory: this.data.addForm.factory,
                details: this.data.addForm.details
            }
            const res = await api.request('/api/v1/processing', 'POST', payload)

            this.setData({
                sessionRecords: [...this.data.sessionRecords, res.data],
                showAddModal: false,
                'addForm.processType': ''
            })
            wx.hideLoading()
            wx.showToast({ title: '已添加记录' })
        } catch (err) {
            wx.hideLoading()
            wx.showToast({ title: '提交失败', icon: 'none' })
        }
    },

    async settleLine() {
        this.openSettleDialog()
    },

    async confirmSettle() {
        try {
            wx.showLoading({ title: '正在结算分支' })
            // Settle is essentially a deriveBatch via ProcessingRecord with empty batchNo
            const steps = (this.data.sessionRecords || []).map((r) => r?.processType).filter(Boolean).join('、')
            const settleTitle = (this.data.settleForm.statusLabel || '').trim() || this.inferStatusLabel()
            const payload = {
                parentBatchNo: this.data.batchNo,
                batchNo: '', // Trigger derivation
                processType: settleTitle,
                lineName: this.data.settleForm.lineName,
                operator: this.data.settleForm.operator,
                factory: this.data.settleForm.factory,
                details: steps ? `本次工序：${steps}` : '阶段性产线结算，进入下一工艺分库。'
            }
            const res = await api.request('/api/v1/processing', 'POST', payload)
            const newBatchNo = res.data.batchNo

            wx.hideLoading()
            this.setData({ showSettleModal: false })

            wx.navigateTo({ url: `/pages/qrcode/index?batchNo=${encodeURIComponent(String(newBatchNo))}` })
        } catch (err) {
            wx.hideLoading()
            const msg = err?.data?.message || err?.data?.data?.batchNo || '结算失败'
            wx.showToast({ title: msg, icon: 'none' })
        }
    },

    inferStatusLabel() {
        const steps = (this.data.sessionRecords || []).map((r) => String(r?.processType || '').trim()).filter(Boolean)
        if (steps.length === 0) return '加工完成'
        const last = steps[steps.length - 1]
        if (!last) return '加工完成'
        if (last.includes('完成') || last.includes('结算')) return last
        return `${last}完成`
    }
})
