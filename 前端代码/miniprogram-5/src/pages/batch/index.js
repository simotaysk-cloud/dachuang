const api = require('../../utils/api')
const { guardFeatureAccess } = require('../../utils/rbac')

const REFRESH_KEY = 'batchNeedRefresh'

Page({
    data: {
        batches: [],
        role: '',
        usernameRaw: 'user',
        roleLabel: '',
        lockedCount: 0,
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

    async onLoad() {
        if (!guardFeatureAccess(api.role, 'BATCH')) return
        this.setData({
            role: api.role,
            usernameRaw: api.username || 'user',
            roleLabel: api.getRoleName(api.role)
        })
        await this.loadProfile()
        this.listAll()
    },

    onShow() {
        if (wx.getStorageSync(REFRESH_KEY)) {
            wx.removeStorageSync(REFRESH_KEY)
            this.listAll()
        }
    },

    async loadProfile() {
        try {
            const res = await api.getMe()
            const profile = res?.data || {}
            this.setData({
                usernameRaw: profile?.username || profile?.name || api.username || 'user',
                roleLabel: api.getRoleName(profile?.role || api.role)
            })
        } catch (err) {

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

    async listAll() {
        this.setData({ loading: true })
        try {
            const res = await api.request('/api/v1/batches?rootOnly=true')
            const batches = Array.isArray(res.data) ? res.data : []
            this.setData({
                batches,
                lockedCount: batches.filter((item) => !!item.gs1Locked).length
            })
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

            const res = await api.request('/api/v1/batches?rootOnly=true')
            const roots = Array.isArray(res.data) ? res.data : []
            const matched = roots.filter((item) => {
                const idText = item && item.id != null ? String(item.id) : ''
                const batchNo = item && item.batchNo ? String(item.batchNo) : ''
                const name = item && item.name ? String(item.name) : ''
                return idText === q || batchNo === q || name.includes(q)
            })
            if (matched.length > 0) {
                this.setData({
                    batches: matched,
                    lockedCount: matched.filter((item) => !!item.gs1Locked).length
                })
            } else {
                this.setData({ batches: [], lockedCount: 0 })
                wx.showToast({ title: '未找到批次', icon: 'none' })
            }
        } catch (err) {
            console.error(err)
            this.setData({ batches: [], lockedCount: 0 })
        } finally {
            this.setData({ loading: false })
        }
    },

    startCreate() {
        wx.navigateTo({ url: '/pages/batch-form/index' })
    },

    startExternalRegistration() {
        wx.navigateTo({ url: '/pages/batch/add-external/index' })
    },

    async chooseImage() {
        if (this.data.form.id) return
        const that = this
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: async (res) => {
                const tempFilePath = res.tempFiles[0].tempFilePath
                wx.showLoading({ title: '上传中...' })
                try {
                    const uploadRes = await api.uploadFile(tempFilePath, { quiet: true })
                    const url = uploadRes?.data?.url || uploadRes?.data || ''
                    if (url) {
                        const fullUrl = url.startsWith('/') ? `${api.baseUrl}${url}` : url
                        that.setData({ 'form.imageUrl': fullUrl })
                    }
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
        const batchNo = encodeURIComponent(String(item?.batchNo || ''))
        wx.navigateTo({ url: `/pages/batch-form/index?batchNo=${batchNo}` })
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

    return() {
        // Dummy handler for catchtap="return" in WXML to prevent event bubbling
    },

    viewTrace(e) {
        const item = e?.currentTarget?.dataset?.item || {}
        const batchNo = item.batchNo || this.data.form.batchNo
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
