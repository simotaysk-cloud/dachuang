const api = require('../../utils/api')

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
        filterBatchNo: '',
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
        this.refresh()
    },

    onFilterInput(e) {
        this.setData({ filterBatchNo: e.detail.value })
    },

    async refresh() {
        try {
            this.setData({ loading: true })
            const batchNo = (this.data.filterBatchNo || '').trim()
            const qs = batchNo ? `?batchNo=${encodeURIComponent(batchNo)}` : ''
            const res = await api.request(`/api/v1/planting${qs}`)
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
        this.setData({
            showForm: true,
            form: {
                id: '',
                batchNo: '',
                fieldName: '',
                operation: '',
                operator: '',
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
        this.setData({
            showForm: true,
            form: {
                id: record.id ? String(record.id) : '',
                batchNo: record.batchNo || '',
                fieldName: record.fieldName || '',
                operation: record.operation || '',
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

    async save() {
        try {
            let res
            if (this.data.form.id) {
                res = await api.request(`/api/v1/planting/${this.data.form.id}`, 'PUT', this.data.form)
            } else {
                res = await api.request('/api/v1/planting', 'POST', this.data.form)
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
        if (!this.data.form.id) return wx.showToast({ title: '请输入记录ID', icon: 'none' })

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
