const api = require('../../utils/api')

Page({
    data: {
        batches: [],
        form: {
            id: '',
            batchNo: '',
            minCode: '',
            name: '',
            category: '',
            origin: '',
            status: '',
            quantity: '',
            unit: '',
            description: '',
            gs1Locked: false
        },
        queryNo: '',
        showForm: false,
        loading: false,
        showQrModal: false,
        qrCodeBase64: '',
        currentBatchNo: ''
    },

    onLoad() {
        this.setData({ role: api.role })
        this.listAll()
    },

    async listAll() {
        this.setData({ loading: true })
        try {
            const res = await api.request('/api/v1/batches?rootOnly=true')
            this.setData({ batches: res.data || [] })
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    async query() {
        const q = String(this.data.queryNo || '').trim()
        if (!q) {
            return this.listAll()
        }
        this.setData({ loading: true })
        try {
            // Batch management only shows root (original) batches.
            const res = await api.request('/api/v1/batches?rootOnly=true')
            const roots = Array.isArray(res.data) ? res.data : []
            const matched = roots.filter((item) => {
                const idText = item && item.id != null ? String(item.id) : ''
                const batchNo = item && item.batchNo ? String(item.batchNo) : ''
                return idText === q || batchNo === q
            })
            if (matched.length > 0) {
                this.setData({ batches: matched })
            } else {
                this.setData({ batches: [] })
                wx.showToast({ title: '未找到批次', icon: 'none' })
            }
        } catch (err) {
            console.error(err)
            this.setData({ batches: [] })
        } finally {
            this.setData({ loading: false })
        }
    },

    startCreate() {
        this.setData({
            showForm: true,
            form: {
                id: '',
                batchNo: '',
                minCode: '',
                name: '',
                category: '',
                origin: '',
                status: 'PLANTING',
                quantity: '',
                unit: '',
                description: '',
                imageUrl: '', // clear image
                gs1Locked: false
            }
        })
    },

    startExternalRegistration() {
        wx.navigateTo({ url: '/pages/batch/add-external/index' })
    },

    async chooseImage() {
        const that = this
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: async (res) => {
                const tempFilePath = res.tempFiles[0].tempFilePath
                wx.showLoading({ title: '上传中...' })
                try {
                    const uploadRes = await api.uploadFile(tempFilePath)
                    that.setData({ 'form.imageUrl': uploadRes.data }) // Assuming backend returns { code: 200, data: "url" }
                    wx.hideLoading()
                } catch (e) {
                    wx.hideLoading()
                    wx.showToast({ title: '上传失败', icon: 'none' })
                }
            }
        })
    },

    editFromList(e) {
        const item = e.currentTarget.dataset.item
        this.setData({
            showForm: true,
            form: { ...item } // clone
        })
    },

    cancelEdit() {
        this.setData({ showForm: false })
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`form.${field}`]: e.detail.value })
    },

    onQueryInput(e) {
        this.setData({ queryNo: e.detail.value })
    },

    async save() {
        try {
            const payload = { ...this.data.form }

            // MANUFACTURER VALIDATION
            if (this.data.role === 'MANUFACTURER' && !payload.id) {
                if (!payload.imageUrl) {
                    return wx.showToast({ title: '必须上传来源凭证(照片)', icon: 'none' })
                }
            }

            if (!payload.id) delete payload.id
            if (!payload.batchNo) delete payload.batchNo // allow backend to gen (recommended for farmers)

            // Quantity handling
            if (payload.quantity === '' || payload.quantity == null) {
                delete payload.quantity
            } else {
                const q = Number(payload.quantity)
                if (Number.isNaN(q)) {
                    delete payload.quantity
                } else {
                    payload.quantity = q
                }
            }
            if (!payload.unit) delete payload.unit

            let res
            if (this.data.form.id) {
                res = await api.request(`/api/v1/batches/${this.data.form.id}`, 'PUT', payload)
            } else {
                res = await api.request('/api/v1/batches', 'POST', payload)
            }

            wx.showToast({ title: '保存成功' })
            this.setData({ showForm: false })
            this.listAll() // Refresh list
        } catch (err) {
            console.error(err)
            // Show error in a more user friendly way if possible, or just toast
            wx.showToast({ title: '保存失败', icon: 'none' })
        }
    },

    async remove() {
        if (!this.data.form.id) return
        const that = this
        wx.showModal({
            title: '确认删除',
            content: '确定要删除该批次吗？',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        await api.request(`/api/v1/batches/${that.data.form.id}`, 'DELETE')
                        wx.showToast({ title: '删除成功' })
                        that.setData({ showForm: false })
                        that.listAll()
                    } catch (err) {
                        console.error(err)
                        wx.showToast({ title: err?.data?.message || '删除失败', icon: 'none' })
                    }
                }
            }
        })
    },

    async lockGs1() {
        const batchNo = this.data.form.batchNo
        if (!batchNo) return

        const that = this
        wx.showModal({
            title: '确认锁定GS1',
            content: '锁定后，数量和单位将不可再次修改。请确保已完成打印贴标。',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        await api.request(`/api/v1/batches/${batchNo}/lock-gs1`, 'POST')
                        wx.showToast({ title: '已锁定' })
                        that.setData({
                            'form.gs1Locked': true
                        })
                        that.listAll()
                    } catch (err) {
                        console.error(err)
                    }
                }
            }
        })
    },

    async showQrCode(e) {
        const item = e.currentTarget.dataset.item
        const batchNo = item.batchNo
        const isLocked = item.gs1Locked

        if (!isLocked) {
            const confirm = await new Promise((resolve) => {
                wx.showModal({
                    title: '锁定提示',
                    content: '注意：查看/下载二维码将【永久锁定】该批次数据（数量/单位不可更改）。是否继续？',
                    confirmText: '锁定并查看',
                    confirmColor: '#e74c3c',
                    success: (res) => resolve(res.confirm)
                })
            })
            if (!confirm) return

            // Lock it first
            try {
                wx.showLoading({ title: '正在锁定...' })
                await api.request(`/api/v1/batches/${batchNo}/lock-gs1`, 'POST')
                // Update local list state to reflect lock
                const newBatches = this.data.batches.map(b => {
                    if (b.batchNo === batchNo) return { ...b, gs1Locked: true }
                    return b
                })
                this.setData({ batches: newBatches })
            } catch (err) {
                wx.hideLoading()
                console.error(err)
                return wx.showToast({ title: '锁定失败，无法查看', icon: 'none' })
            }
        }

        this.setData({ loading: true })
        try {
            const res = await api.request(`/api/v1/public/qr-code/${batchNo}`)
            this.setData({
                qrCodeBase64: res.data,
                showQrModal: true,
                currentBatchNo: batchNo
            })
            wx.hideLoading()
        } catch (err) {
            wx.hideLoading()
            console.error('QR Code Fetch Error details:', JSON.stringify(err))
            const msg = err?.data?.message || '获取二维码失败'
            wx.showToast({ title: msg, icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    hideQrModal() {
        this.setData({ showQrModal: false })
    },

    viewTrace() {
        const batchNo = this.data.form.batchNo
        if (!batchNo) return
        wx.navigateTo({ url: `/pages/batch/trace/index?batchNo=${encodeURIComponent(batchNo)}` })
    },

    saveQrCode() {
        // Simple implementation to save the Base64 image
        const fs = wx.getFileSystemManager()
        const filePath = `${wx.env.USER_DATA_PATH}/qr_${this.data.currentBatchNo}.png`
        fs.writeFile({
            filePath,
            data: this.data.qrCodeBase64,
            encoding: 'base64',
            success: () => {
                wx.saveImageToPhotosAlbum({
                    filePath,
                    success: () => {
                        wx.showToast({ title: '已保存到相册' })
                        this.hideQrModal()
                    },
                    fail: () => {
                        wx.showToast({ title: '保存失败', icon: 'none' })
                    }
                })
            },
            fail: (err) => {
                console.error(err)
                wx.showToast({ title: '文件写入失败', icon: 'none' })
            }
        })
    }
})
