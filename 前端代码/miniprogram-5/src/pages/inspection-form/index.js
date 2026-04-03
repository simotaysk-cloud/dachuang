const api = require('../../utils/api')
const { guardFeatureAccess } = require('../../utils/rbac')

const REFRESH_KEY = 'inspectionNeedRefresh'
const LAST_QUERY_KEY = 'inspectionLastQueryNo'

Page({
    data: {
        usernameRaw: api.username || 'user',
        roleLabel: '',
        // When id is present, we are viewing/updating an existing record.
        id: '',
        loading: false,
        parentLocked: false,

        typeOptions: ['原料初检 (RAW)', '成品出厂检 (FINISHED)', '过程抽检 (IN-PROCESS)'],
        typeValues: ['RAW', 'FINISHED', 'IN-PROCESS'],
        createTypeIndex: -1,
        recordTypeIndex: -1,

        // Create flow (always generates a new child batch + QR).
        createForm: {
            parentBatchNo: '',
            result: '',
            reportUrl: '',
            inspector: '',
            details: ''
        },

        // Detail/edit flow for an existing inspection record.
        record: {
            id: '',
            batchNo: '',
            result: '',
            reportUrl: '',
            inspector: ''
        }
    },

    async onLoad(options) {
        if (!guardFeatureAccess(api.role, 'INSPECTION')) return
        this.setData({ roleLabel: api.getRoleName(api.role) })
        await this.loadProfile()

        const opts = options || {}
        const id = opts.id ? String(opts.id) : ''
        const typeFromUrl = opts.type || ''

        this.setData({ id })

        if (id) {
            this.loadRecord(id)
            return
        }

        // Auto-select based on entry point if creating new.
        if (typeFromUrl === 'RAW') this.setData({ createTypeIndex: 0 })
        if (typeFromUrl === 'FINISHED') this.setData({ createTypeIndex: 1 })

        // Prefill from scan/manual entry.
        if (opts.parentBatchNo) {
            this.setData({
                'createForm.parentBatchNo': String(opts.parentBatchNo),
                parentLocked: String(opts.lockedParent || '') === '1'
            })
        } else {
            this.setData({ parentLocked: false })
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
            // Ignore profile errors and keep cached identity.
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

    async loadRecord(id) {
        this.setData({ loading: true })
        try {
            const res = await api.request(`/api/v1/inspection/${encodeURIComponent(String(id))}`)
            const r = res?.data || {}
            let recordTypeIndex = -1
            if (r.inspectionType === 'RAW') recordTypeIndex = 0
            if (r.inspectionType === 'FINISHED') recordTypeIndex = 1
            if (r.inspectionType === 'IN-PROCESS') recordTypeIndex = 2

            this.setData({
                recordTypeIndex,
                record: {
                    id: r.id ? String(r.id) : '',
                    batchNo: r.batchNo || '',
                    result: r.result || '',
                    reportUrl: r.reportUrl || '',
                    inspector: r.inspector || ''
                }
            })
        } catch (err) {
            console.error(err)
            wx.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            this.setData({ loading: false })
        }
    },

    onCreateInput(e) {
        const { field } = e.currentTarget.dataset
        if (field === 'parentBatchNo' && this.data.parentLocked) return
        this.setData({ [`createForm.${field}`]: e.detail.value })
    },

    onRecordInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`record.${field}`]: e.detail.value })
    },

    onCreateTypeChange(e) {
        this.setData({ createTypeIndex: Number(e.detail.value) })
    },

    onRecordTypeChange(e) {
        this.setData({ recordTypeIndex: Number(e.detail.value) })
    },

    async submitAndGenQr() {
        const payload = { ...this.data.createForm }
        if (!payload.parentBatchNo) return wx.showToast({ title: '请先填写被检批次号', icon: 'none' })
        if (this.data.createTypeIndex === -1) return wx.showToast({ title: '请选择质检环节 (类型)', icon: 'none' })
        payload.inspectionType = this.data.typeValues[this.data.createTypeIndex]
        
        if (!payload.result) return wx.showToast({ title: '请先填写检测结果', icon: 'none' })
        if (!payload.inspector) return wx.showToast({ title: '请先填写质检员', icon: 'none' })

        try {
            wx.showLoading({ title: '正在提交' })
            // Force backend to auto-generate child batchNo.
            payload.childBatchNo = null
            const res = await api.request('/api/v1/inspection/derive', 'POST', payload)
            const derivedBatchNo = res?.data?.derivedBatch?.batchNo || ''

            // Refresh list after returning.
            if (derivedBatchNo) wx.setStorageSync(LAST_QUERY_KEY, derivedBatchNo)
            wx.setStorageSync(REFRESH_KEY, true)

            wx.hideLoading()
            wx.showToast({ title: '提交成功' })

            if (!derivedBatchNo) {
                setTimeout(() => wx.navigateBack(), 300)
                return
            }

            setTimeout(() => {
                wx.redirectTo({ url: `/pages/qrcode/index?batchNo=${encodeURIComponent(String(derivedBatchNo))}` })
            }, 300)
        } catch (err) {
            wx.hideLoading()
            wx.showToast({ title: err?.data?.message || '提交失败', icon: 'none' })
        }
    },

    async saveRecord() {
        const r = this.data.record || {}
        if (!r.id) return
        if (!r.batchNo) return wx.showToast({ title: '缺少批次号', icon: 'none' })
        if (this.data.recordTypeIndex === -1) return wx.showToast({ title: '请选择质检环节 (类型)', icon: 'none' })
        const inspectionType = this.data.typeValues[this.data.recordTypeIndex]
        if (!r.result) return wx.showToast({ title: '请先填写检测结果', icon: 'none' })
        if (!r.inspector) return wx.showToast({ title: '请先填写质检员', icon: 'none' })

        try {
            wx.showLoading({ title: '正在保存' })
            await api.request(`/api/v1/inspection/${encodeURIComponent(String(r.id))}`, 'PUT', {
                batchNo: r.batchNo,
                inspectionType: inspectionType,
                result: r.result,
                reportUrl: r.reportUrl,
                inspector: r.inspector
            })
            wx.hideLoading()
            wx.setStorageSync(REFRESH_KEY, true)
            wx.showToast({ title: '已保存' })
        } catch (err) {
            wx.hideLoading()
            wx.showToast({ title: err?.data?.message || '保存失败', icon: 'none' })
        }
    },

    viewQr() {
        const batchNo = this.data.record?.batchNo
        if (!batchNo) return wx.showToast({ title: '缺少批次号', icon: 'none' })
        wx.navigateTo({ url: `/pages/qrcode/index?batchNo=${encodeURIComponent(String(batchNo))}` })
    },

    async revokeRecord() {
        const r = this.data.record || {}
        if (!r.id) return

        const confirmed = await new Promise((resolve) => {
            wx.showModal({
                title: '确认撤回',
                content: '确定要撤回该质检记录吗？',
                confirmText: '撤回',
                confirmColor: '#e74c3c',
                success: (res) => resolve(!!res.confirm),
                fail: () => resolve(false)
            })
        })
        if (!confirmed) return

        try {
            wx.showLoading({ title: '正在撤回' })
            await api.request(`/api/v1/inspection/${encodeURIComponent(String(r.id))}`, 'DELETE')
            wx.hideLoading()
            wx.setStorageSync(REFRESH_KEY, true)
            wx.showToast({ title: '已撤回' })
            setTimeout(() => wx.navigateBack(), 300)
        } catch (err) {
            wx.hideLoading()
            wx.showToast({ title: err?.data?.message || '操作失败', icon: 'none' })
        }
    },

    cancel() {
        this.onBack()
    }
})
