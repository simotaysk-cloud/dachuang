const api = require('../../utils/api')

const LAST_BATCH_KEY = 'lastPlantingBatchNo'
const OPERATION_OPTIONS = ['施肥', '灌溉', '除草', '病虫害防治', '采收', '其他']

Page({
    data: {
        form: {
            id: '',
            batchNo: '',
            fieldName: '',
            operation: '',
            operator: '',
            details: '',
            imageUrl: '',
            audioUrl: ''
        },
        profile: null,
        batches: [],
        batchIndex: -1,
        currentBatch: null,
        operationOptions: OPERATION_OPTIONS,
        selectedOperation: '',
        customOperation: '',
        showOptional: false,
        records: [],
        loading: false,
        showForm: false,
        lastUpdatedAt: ''
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`form.${field}`]: e.detail.value })
    },

    onLoad() {
        this.init()
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
        // Switching batch while editing easily creates mismatched data; close the form.
        this.setData({ batchIndex: idx, currentBatch, showForm: false })
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
                this.setData({ loading: false, records: [] })
                return
            }

            const res = await api.request(`/api/v1/planting?batchNo=${encodeURIComponent(batchNo)}`)
            const list = Array.isArray(res?.data) ? res.data : []
            const records = list.map((item) => ({
                ...item,
                createdAtText: item?.createdAt ? String(item.createdAt).replace('T', ' ') : '',
                updatedAtText: item?.updatedAt ? String(item.updatedAt).replace('T', ' ') : ''
            }))
            this.setData({
                records,
                lastUpdatedAt: new Date().toLocaleString(),
                loading: false
            })
        } catch (err) {
            this.setData({ loading: false })
        }
    },

    startCreate() {
        const batchNo = this.data.currentBatch?.batchNo || ''
        if (!batchNo) {
            wx.showToast({ title: '请先选择批次', icon: 'none' })
            return
        }

        const p = this.data.profile || {}
        const operator = p?.name || p?.nickname || p?.username || ''
        this.setData({
            showForm: true,
            showOptional: false,
            selectedOperation: '',
            customOperation: '',
            form: {
                id: '',
                batchNo,
                fieldName: '',
                operation: '',
                operator,
                details: '',
                imageUrl: '',
                audioUrl: ''
            }
        })
    },

    editFromList(e) {
        const { id } = e.currentTarget.dataset
        const record = this.data.records.find((r) => String(r.id) === String(id))
        if (!record) return
        const operation = record.operation || ''
        const matched = OPERATION_OPTIONS.includes(operation) ? operation : (operation ? '其他' : '')
        this.setData({
            showForm: true,
            showOptional: false,
            selectedOperation: matched,
            customOperation: matched === '其他' ? operation : '',
            form: {
                id: record.id ? String(record.id) : '',
                batchNo: record.batchNo || '',
                fieldName: record.fieldName || '',
                operation,
                operator: record.operator || '',
                details: record.details || '',
                imageUrl: record.imageUrl || '',
                audioUrl: record.audioUrl || ''
            }
        })
    },

    cancelEdit() {
        this.setData({ showForm: false })
    },

    toggleOptional() {
        this.setData({ showOptional: !this.data.showOptional })
    },

    selectOperation(e) {
        const { value } = e.currentTarget.dataset
        if (!value) return
        if (value === '其他') {
            this.setData({
                selectedOperation: '其他',
                customOperation: '',
                'form.operation': ''
            })
            return
        }
        this.setData({
            selectedOperation: value,
            customOperation: '',
            'form.operation': value
        })
    },

    onCustomOperationInput(e) {
        const v = (e.detail.value || '').trim()
        this.setData({
            customOperation: v,
            'form.operation': v
        })
    },

    async save() {
        try {
            if (!this.data.form.batchNo) {
                wx.showToast({ title: '请先选择批次', icon: 'none' })
                return
            }
            if (!this.data.form.operation) {
                wx.showToast({ title: '请选择操作类型', icon: 'none' })
                return
            }
            if (!this.data.form.fieldName) {
                wx.showToast({ title: '请填写地块名称', icon: 'none' })
                return
            }

            let res
            if (this.data.form.id) {
                res = await api.request(`/api/v1/planting/${this.data.form.id}`, 'PUT', this.data.form)
            } else {
                const payload = { ...this.data.form }
                delete payload.id
                res = await api.request('/api/v1/planting', 'POST', payload)
            }
            if (res?.code === 0) {
                wx.showToast({ title: '保存成功' })
                this.setData({ showForm: false })
                await this.refresh()
            }
        } catch (err) {
        }
    },

    async remove() {
        if (!this.data.form.id) return wx.showToast({ title: '该记录尚未保存，无法删除', icon: 'none' })

        const confirmed = await new Promise((resolve) => {
            wx.showModal({
                title: '确认删除',
                content: `删除记录 #${this.data.form.id}？此操作不可恢复。`,
                confirmText: '删除',
                confirmColor: '#e74c3c',
                success: (r) => resolve(!!r.confirm),
                fail: () => resolve(false)
            })
        })
        if (!confirmed) return

        try {
            const res = await api.request(`/api/v1/planting/${this.data.form.id}`, 'DELETE')
            if (res?.code === 0) {
                wx.showToast({ title: '删除成功' })
                this.setData({ showForm: false })
                await this.refresh()
            }
        } catch (err) {
        }
    }
})
