const api = require('../../../utils/api')

Page({
    data: {
        form: {
            name: '',
            category: '外源原料',
            origin: '',
            status: 'PURCHASED',
            quantity: '',
            unit: 'kg',
            description: '【外源采购】供应商：\n',
            imageUrl: ''
        }
    },

    onLoad() {
        // No special load needed
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [`form.${field}`]: e.detail.value })
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
                    that.setData({ 'form.imageUrl': uploadRes.data })
                    wx.hideLoading()
                } catch (e) {
                    wx.hideLoading()
                    wx.showToast({ title: '上传失败', icon: 'none' })
                }
            }
        })
    },

    async save() {
        const payload = { ...this.data.form }

        if (!payload.name) return wx.showToast({ title: '请填写药材名称', icon: 'none' })
        if (!payload.imageUrl) return wx.showToast({ title: '必须上传凭证', icon: 'none' })

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

        try {
            wx.showLoading({ title: '提交中...' })
            await api.request('/api/v1/batches', 'POST', payload)
            wx.hideLoading()

            wx.showToast({ title: '登记成功' })
            setTimeout(() => {
                wx.navigateBack()
            }, 1000)
        } catch (err) {
            wx.hideLoading()
            console.error(err)
            wx.showToast({ title: '提交失败', icon: 'none' })
        }
    }
})
