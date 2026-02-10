const api = require('../../utils/api')

const OPERATION_OPTIONS = ['播种', '施肥', '灌溉', '除草', '病虫害防治', '采收', '其他']
const KEY_OPERATIONS = ['施肥', '灌溉', '除草', '病虫害防治', '采收', '播种']
const REFRESH_KEY = 'plantingNeedRefresh'

function resolveUrlMaybe(url) {
    const u = String(url || '').trim()
    if (!u) return ''
    if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('wxfile://')) return u
    if (u.startsWith('/')) return `${api.baseUrl}${u}`
    return u
}

Page({
    data: {
        readOnly: false,
        operationOptions: OPERATION_OPTIONS,
        selectedOperation: '',
        customOperation: '',
        operationTimeText: '保存后自动记录',
        manualTime: false,
        operationDate: '',
        operationClock: '',
        // local attachments (picked/recorded on device)
        imageFilePath: '',
        audioFilePath: '',
        recording: false,
        uploading: false,
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
            longitude: null,
            operationTime: ''
        }
    },

    onLoad(options) {
        this.init(options || {})
    },

    getNowParts() {
        const d = new Date()
        const pad = (n) => String(n).padStart(2, '0')
        const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
        const clock = `${pad(d.getHours())}:${pad(d.getMinutes())}`
        return { date, clock }
    },

    updateOperationTimeFromParts(date, clock) {
        const d = (date || '').trim()
        const c = (clock || '').trim()
        if (!d || !c) return
        this.setData({
            operationTimeText: `${d} ${c}:00`,
            'form.operationTime': `${d}T${c}:00`
        })
    },

    async init(options) {
        try {
            const id = options.id ? String(options.id) : ''
            const batchNo = options.batchNo ? decodeURIComponent(String(options.batchNo)) : ''

            const meRes = await api.getMe()
            const p = meRes?.data || {}
            const operator = p?.name || p?.nickname || p?.username || ''

            if (id) {
                const res = await api.request(`/api/v1/planting/${encodeURIComponent(id)}`)
                const record = res?.data || {}
                const op = record.operation || ''
                const matched = OPERATION_OPTIONS.includes(op) ? op : (op ? '其他' : '')
                const nowParts = this.getNowParts()
                const opTimeRaw = record?.operationTime ? String(record.operationTime) : ''
                const opTimeText = opTimeRaw ? opTimeRaw.replace('T', ' ') : '保存后自动记录'
                const opTimeParts = opTimeRaw ? opTimeRaw.replace(' ', 'T').split('T') : []
                const date = opTimeParts[0] || nowParts.date
                const clock = (opTimeParts[1] || nowParts.clock).slice(0, 5)
                this.setData({
                    readOnly: true,
                    selectedOperation: matched,
                    customOperation: matched === '其他' ? op : '',
                    operationTimeText: opTimeText,
                    manualTime: !!opTimeRaw,
                    operationDate: date,
                    operationClock: clock,
                    form: {
                        id: record.id ? String(record.id) : '',
                        batchNo: record.batchNo || '',
                        fieldName: record.fieldName || '',
                        operation: op,
                        operator: record.operator || operator,
                        details: record.details || '',
                        imageUrl: record.imageUrl || '',
                        audioUrl: record.audioUrl || '',
                        latitude: record.latitude ?? null,
                        longitude: record.longitude ?? null,
                        operationTime: opTimeRaw || ''
                    }
                })
                // Auto-get location if missing for key ops (no manual click).
                if (KEY_OPERATIONS.includes(op) && (record.latitude == null || record.longitude == null)) {
                    this.fetchLocation()
                }
                return
            }

            if (!batchNo) {
                wx.showToast({ title: '缺少批次号', icon: 'none' })
                wx.navigateBack()
                return
            }

            const now = this.getNowParts()
            this.setData({
                readOnly: false,
                selectedOperation: '',
                customOperation: '',
                imageFilePath: '',
                audioFilePath: '',
                recording: false,
                uploading: false,
                operationTimeText: '保存后自动记录',
                manualTime: false,
                operationDate: now.date,
                operationClock: now.clock,
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
                    longitude: null,
                    operationTime: ''
                }
            })
            // Auto-get location as soon as user enters the page.
            this.fetchLocation()
        } catch (err) {
            wx.showToast({ title: '加载失败', icon: 'none' })
        }
    },

    onManualTimeChange(e) {
        if (this.data.readOnly) return
        const v = !!e.detail.value
        this.setData({ manualTime: v })
        if (!v) {
            this.setData({ operationTimeText: '保存后自动记录', 'form.operationTime': '' })
            return
        }
        // Enable manual time: default to now (can be changed by picker).
        const now = this.getNowParts()
        const date = this.data.operationDate || now.date
        const clock = this.data.operationClock || now.clock
        this.setData({ operationDate: date, operationClock: clock })
        this.updateOperationTimeFromParts(date, clock)
    },

    onOperationDateChange(e) {
        if (this.data.readOnly) return
        const date = e.detail.value
        this.setData({ operationDate: date })
        if (this.data.manualTime) this.updateOperationTimeFromParts(date, this.data.operationClock)
    },

    onOperationClockChange(e) {
        if (this.data.readOnly) return
        const clock = e.detail.value
        this.setData({ operationClock: clock })
        if (this.data.manualTime) this.updateOperationTimeFromParts(this.data.operationDate, clock)
    },

    onInput(e) {
        if (this.data.readOnly) return
        const { field } = e.currentTarget.dataset
        this.setData({ [`form.${field}`]: e.detail.value })
    },

    selectOperation(e) {
        if (this.data.readOnly) return
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

        // Auto-fetch location for key operations.
        if (KEY_OPERATIONS.includes(value)) {
            this.fetchLocation()
        }
    },

    onCustomOperationInput(e) {
        if (this.data.readOnly) return
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
            // If user previously denied permission, guide to settings.
            try {
                const setting = await new Promise((resolve) => wx.getSetting({ success: resolve, fail: () => resolve(null) }))
                const authed = setting?.authSetting?.['scope.userLocation']
                if (authed === false) {
                    wx.showModal({
                        title: '需要定位权限',
                        content: '关键操作需自动获取定位，请在设置中开启定位权限。',
                        confirmText: '去设置',
                        success: (r) => {
                            if (r.confirm) wx.openSetting({})
                        }
                    })
                    return false
                }
            } catch (e) {
                // ignore
            }
            wx.showToast({ title: '定位失败（请授权定位）', icon: 'none' })
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

    doStartRecord() {
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

    startRecord() {
        if (this.data.recording) return
        wx.authorize({
            scope: 'scope.record',
            success: () => this.doStartRecord(),
            fail: () => {
                wx.showModal({
                    title: '需要录音权限',
                    content: '用于语音留痕，请在设置中开启录音权限。',
                    confirmText: '去设置',
                    success: (r) => {
                        if (r.confirm) wx.openSetting({})
                    }
                })
            }
        })
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
        if (this.data.readOnly) {
            wx.showToast({ title: '该记录已锁定，不可修改', icon: 'none' })
            return
        }
        try {
            if (!this.data.form.batchNo) {
                wx.showToast({ title: '缺少批次号', icon: 'none' })
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
                await this.uploadAttachmentsIfNeeded()

                const hasEvidence = !!((this.data.form.imageUrl || '').trim() || (this.data.form.audioUrl || '').trim())
                if (!hasEvidence) {
                    wx.showToast({ title: '关键操作需上传图片或语音', icon: 'none' })
                    return
                }
                if (this.data.form.latitude == null || this.data.form.longitude == null) {
                    const ok = await this.fetchLocation()
                    if (!ok) return
                }
            }

            if (this.data.form.id) {
                const payload = { ...this.data.form }
                if (!payload.operationTime) delete payload.operationTime
                await api.request(`/api/v1/planting/${this.data.form.id}`, 'PUT', payload)
            } else {
                const payload = { ...this.data.form }
                delete payload.id
                if (!payload.operationTime) delete payload.operationTime
                await api.request('/api/v1/planting', 'POST', payload)
            }

            wx.setStorageSync(REFRESH_KEY, true)
            wx.showToast({ title: '保存成功' })
            setTimeout(() => wx.navigateBack(), 300)
        } catch (err) {
            const backendMsg = err?.data?.message || err?.data?.msg || ''
            const rawMsg = backendMsg || err?.message || err?.errMsg || ''
            wx.showToast({ title: backendMsg || (rawMsg ? String(rawMsg) : '保存失败'), icon: 'none' })
        }
    },

    async remove() {
        if (this.data.readOnly) {
            wx.showToast({ title: '该记录已锁定，不可删除', icon: 'none' })
            return
        }
        if (!this.data.form.id) return

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
            await api.request(`/api/v1/planting/${this.data.form.id}`, 'DELETE')
            wx.setStorageSync(REFRESH_KEY, true)
            wx.showToast({ title: '删除成功' })
            setTimeout(() => wx.navigateBack(), 300)
        } catch (err) {
            wx.showToast({ title: err?.data?.message || '删除失败', icon: 'none' })
        }
    },

    cancel() {
        wx.navigateBack()
    }
})
