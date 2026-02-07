const api = require('../../utils/api')

Page({
    data: {
        records: [],
        form: {
            id: '',
            batchNo: '',
            result: '',
            reportUrl: '',
            inspector: ''
        },
        deriveForm: {
            parentBatchNo: '',
            childBatchNo: '',
            result: '',
            reportUrl: '',
            inspector: '',
            details: ''
        },
        queryNo: '',
        showForm: false,
        mode: 'SIMPLE', // SIMPLE or DERIVE
        loading: false
    },

    onLoad() {
        // Optionally load recent records
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`form.${field}`]: e.detail.value })
    },

    onDeriveInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`deriveForm.${field}`]: e.detail.value })
    },

    onQueryInput(e) {
        this.setData({ queryNo: e.detail.value })
    },

    switchMode(e) {
        const mode = e.currentTarget.dataset.mode
        this.setData({ mode })
    },

    startCreate() {
        this.setData({
            showForm: true,
            mode: 'SIMPLE',
            form: {
                id: '',
                batchNo: '',
                result: '',
                reportUrl: '',
                inspector: ''
            },
            deriveForm: {
                parentBatchNo: '',
                childBatchNo: '',
                result: '',
                reportUrl: '',
                inspector: '',
                details: ''
            }
        })
    },

    editFromList(e) {
        const item = e.currentTarget.dataset.item
        // Determine mode based on item structure or just default to SIMPLE for viewing
        this.setData({
            showForm: true,
            mode: 'SIMPLE',
            form: { ...item }
        })
    },

    cancelEdit() {
        this.setData({ showForm: false })
    },

    async query() {
        if (!this.data.queryNo) return wx.showToast({ title: '请输入批次号', icon: 'none' })

        this.setData({ loading: true })
        try {
            const res = await api.request(`/api/v1/inspection?batchNo=${this.data.queryNo}`)
            this.setData({ records: res.data || [] })
            if (!res.data || res.data.length === 0) {
                wx.showToast({ title: '未找到记录', icon: 'none' })
            }
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '查询失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    async derive() {
        try {
            const res = await api.request('/api/v1/inspection/derive', 'POST', this.data.deriveForm)
            wx.showToast({ title: '派生并发布成功' })
            this.setData({ showForm: false })
            // Refresh logic: query the parent or child
            this.setData({ queryNo: this.data.deriveForm.parentBatchNo })
            this.query()
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '操作失败', icon: 'none' })
        }
    },

    async save() {
        try {
            let res
            const payload = { ...this.data.form }
            if (!payload.id) delete payload.id

            if (this.data.form.id) {
                res = await api.request(`/api/v1/inspection/${this.data.form.id}`, 'PUT', payload)
            } else {
                res = await api.request('/api/v1/inspection', 'POST', payload)
            }

            wx.showToast({ title: '保存成功' })
            this.setData({ showForm: false })
            this.query()
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '保存失败', icon: 'none' })
        }
    },

    async remove() {
        if (!this.data.form.id) return
        const that = this
        wx.showModal({
            title: '确认撤回',
            content: '确定要撤回该质检报告吗？',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        await api.request(`/api/v1/inspection/${that.data.form.id}`, 'DELETE')
                        wx.showToast({ title: '撤回成功' })
                        that.setData({ showForm: false })
                        that.query()
                    } catch (err) {
                        console.error(err)
                    }
                }
            }
        })
    }
})
