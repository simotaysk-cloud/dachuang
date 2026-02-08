const api = require('../../utils/api')

const LAST_BATCH_KEY = 'lastPlantingBatchNo'
const OPERATION_OPTIONS = ['施肥', '灌溉', '除草', '病虫害防治', '采收', '其他']
const KEY_OPERATIONS = ['施肥', '灌溉', '除草', '病虫害防治', '采收', '播种']

function resolveUrlMaybe(url) {
    const u = String(url || '').trim()
    if (!u) return ''
    if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('wxfile://')) return u
    if (u.startsWith('/')) return `${api.baseUrl}${u}`
    return u
}

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
            audioUrl: '',
            latitude: null,
            longitude: null
        },
        // local attachments (picked/recorded on device)
        imageFilePath: '',
        audioFilePath: '',
        recording: false,
        uploading: false,
        profile: null,
        batches: [],
        batchIndex: -1,
        currentBatch: null,
        operationOptions: OPERATION_OPTIONS,
        selectedOperation: '',
        customOperation: '',
        showOptional: false,
        queryKey: '',
        allRecords: [],
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
                this.setData({ loading: false, allRecords: [], records: [] })
                return
            }

            const res = await api.request(`/api/v1/planting?batchNo=${encodeURIComponent(batchNo)}`)
            const list = Array.isArray(res?.data) ? res.data : []
            const allRecords = list.map((item) => ({
                ...item,
                createdAtText: item?.createdAt ? String(item.createdAt).replace('T', ' ') : '',
                updatedAtText: item?.updatedAt ? String(item.updatedAt).replace('T', ' ') : ''
            }))

            const records = this.applyQuery(allRecords, this.data.queryKey)
            this.setData({
                allRecords,
                records,
                lastUpdatedAt: new Date().toLocaleString(),
                loading: false
            })
        } catch (err) {
            this.setData({ loading: false })
        }
    },

    onQueryInput(e) {
        this.setData({ queryKey: e.detail.value })
    },

    async query() {
        const batchNo = this.data.currentBatch?.batchNo
        if (!batchNo) {
            wx.showToast({ title: '请先选择批次', icon: 'none' })
            return
        }

        // Keep behavior consistent with other modules: query triggers a fetch, then filters.
        await this.refresh()
        if (this.data.queryKey && (!this.data.records || this.data.records.length === 0)) {
            wx.showToast({ title: '未找到记录', icon: 'none' })
        }
    },

    applyQuery(allRecords, queryKey) {
        const list = Array.isArray(allRecords) ? allRecords : []
        const q = (queryKey || '').trim()
        if (!q) return list

        const qLower = q.toLowerCase()
        return list.filter((r) => {
            const idText = r?.id == null ? '' : String(r.id)
            const fieldName = (r?.fieldName || '').toLowerCase()
            const operation = (r?.operation || '').toLowerCase()
            const operator = (r?.operator || '').toLowerCase()
            const details = (r?.details || '').toLowerCase()
            return (
                idText === q ||
                idText.includes(q) ||
                fieldName.includes(qLower) ||
                operation.includes(qLower) ||
                operator.includes(qLower) ||
                details.includes(qLower)
            )
        })
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
            imageFilePath: '',
            audioFilePath: '',
            recording: false,
            uploading: false,
            form: {
                id: '',
                batchNo,
                fieldName: '',
                operation: '',
                operator,
                details: '',
                imageUrl: '',
                audioUrl: '',
                latitude: null,
                longitude: null
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
            imageFilePath: '',
            audioFilePath: '',
            recording: false,
            uploading: false,
            form: {
                id: record.id ? String(record.id) : '',
                batchNo: record.batchNo || '',
                fieldName: record.fieldName || '',
                operation,
                operator: record.operator || '',
                details: record.details || '',
                imageUrl: record.imageUrl || '',
                audioUrl: record.audioUrl || '',
                latitude: record.latitude ?? null,
                longitude: record.longitude ?? null
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

        // Key operations require evidence; open the attachment section by default.
        if (KEY_OPERATIONS.includes(value)) {
            this.setData({ showOptional: true })
            // Auto-fetch location so user doesn't need to click.
            this.fetchLocation()
        }
    },

    onCustomOperationInput(e) {
        const v = (e.detail.value || '').trim()
        this.setData({
            customOperation: v,
            'form.operation': v
        })
    },

    async fetchLocation() {
        try {
            const pos = await new Promise((resolve, reject) => {
                wx.getLocation({
                    type: 'wgs84',
                    success: resolve,
                    fail: reject
                })
            })
            const latitude = typeof pos?.latitude === 'number' ? pos.latitude : null
            const longitude = typeof pos?.longitude === 'number' ? pos.longitude : null
            if (latitude == null || longitude == null) {
                wx.showToast({ title: '定位失败', icon: 'none' })
                return false
            }
            this.setData({
                'form.latitude': latitude,
                'form.longitude': longitude
            })
            return true
        } catch (err) {
            wx.showToast({ title: '请授权定位后重试', icon: 'none' })
            return false
        }
    },

    async chooseImage() {
        try {
            const res = await new Promise((resolve, reject) => {
                wx.chooseMedia({
                    count: 1,
                    mediaType: ['image'],
                    sourceType: ['camera', 'album'],
                    success: resolve,
                    fail: reject
                })
            })
            const filePath = res?.tempFiles?.[0]?.tempFilePath || ''
            if (!filePath) return
            this.setData({ imageFilePath: filePath, 'form.imageUrl': '' })
        } catch (err) {
            // ignore
        }
    },

    async previewImage() {
        const p = this.data.imageFilePath
        const url = p || resolveUrlMaybe(this.data.form.imageUrl)
        if (!url) return
        wx.previewImage({ urls: [url] })
    },

    clearImage() {
        this.setData({ imageFilePath: '', 'form.imageUrl': '' })
    },

    async chooseAudio() {
        try {
            const res = await new Promise((resolve, reject) => {
                wx.chooseMessageFile({
                    count: 1,
                    type: 'file',
                    extension: ['mp3', 'm4a', 'wav', 'aac'],
                    success: resolve,
                    fail: reject
                })
            })
            const filePath = res?.tempFiles?.[0]?.path || ''
            if (!filePath) return
            this.setData({ audioFilePath: filePath, 'form.audioUrl': '' })
        } catch (err) {
            // ignore
        }
    },

    startRecord() {
        if (this.data.recording) return
        const rm = wx.getRecorderManager()
        this._recorder = rm
        if (!this._recorderInited) {
            this._recorderInited = true
            rm.onStop((res) => {
                const filePath = res?.tempFilePath || ''
                if (filePath) {
                    this.setData({ audioFilePath: filePath, 'form.audioUrl': '' })
                }
                this.setData({ recording: false })
            })
            rm.onError(() => {
                this.setData({ recording: false })
                wx.showToast({ title: '录音失败', icon: 'none' })
            })
        }
        this.setData({ recording: true })
        rm.start({ format: 'mp3', duration: 60 * 1000 })
    },

    stopRecord() {
        if (!this.data.recording) return
        try {
            this._recorder && this._recorder.stop()
        } catch (e) {
            this.setData({ recording: false })
        }
    },

    clearAudio() {
        this.setData({ audioFilePath: '', 'form.audioUrl': '' })
    },

    async uploadAttachmentsIfNeeded() {
        const imageFilePath = this.data.imageFilePath
        const audioFilePath = this.data.audioFilePath
        if (!imageFilePath && !audioFilePath) return

        this.setData({ uploading: true })
        try {
            if (imageFilePath) {
                const up = await api.uploadFile(imageFilePath)
                const url = up?.data?.url ? String(up.data.url) : ''
                if (url) {
                    // Store relative URL in DB; preview uses baseUrl at runtime.
                    this.setData({ 'form.imageUrl': url, imageFilePath: '' })
                }
            }
            if (audioFilePath) {
                const up = await api.uploadFile(audioFilePath)
                const url = up?.data?.url ? String(up.data.url) : ''
                if (url) {
                    this.setData({ 'form.audioUrl': url, audioFilePath: '' })
                }
            }
        } finally {
            this.setData({ uploading: false })
        }
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

            const op = (this.data.form.operation || '').trim()
            const isKeyOp = KEY_OPERATIONS.includes(op)
            if (isKeyOp) {
                // If user picked/recorded attachments, upload first and use returned URL as evidence.
                await this.uploadAttachmentsIfNeeded()

                const hasEvidence = !!((this.data.form.imageUrl || '').trim() || (this.data.form.audioUrl || '').trim())
                if (!hasEvidence) {
                    this.setData({ showOptional: true })
                    wx.showToast({ title: '关键操作需上传图片或语音', icon: 'none' })
                    return
                }
                if (this.data.form.latitude == null || this.data.form.longitude == null) {
                    const ok = await this.fetchLocation()
                    if (!ok) return
                }
            }

            let res
            if (this.data.form.id) {
                res = await api.request(`/api/v1/planting/${this.data.form.id}`, 'PUT', this.data.form)
            } else {
                const payload = { ...this.data.form }
                delete payload.id
                res = await api.request('/api/v1/planting', 'POST', payload)
            }
            wx.showToast({ title: '保存成功' })
            this.setData({ showForm: false })
            await this.refresh()
        } catch (err) {
            const backendMsg = err?.data?.message || err?.data?.msg || ''
            const rawMsg = backendMsg || err?.message || err?.errMsg || ''
            wx.showToast({ title: backendMsg || (rawMsg ? String(rawMsg) : '保存失败'), icon: 'none' })
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
            wx.showToast({ title: '删除成功' })
            this.setData({ showForm: false })
            await this.refresh()
        } catch (err) {
        }
    }
})
