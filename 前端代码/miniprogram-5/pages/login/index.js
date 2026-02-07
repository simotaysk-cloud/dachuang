const api = require('../../utils/api')

Page({
    data: {
        username: '',
        password: ''
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        this.setData({ [field]: e.detail.value })
    },

    async handleLogin() {
        const { username, password } = this.data
        if (!username || !password) {
            return wx.showToast({ title: '请输入账号密码', icon: 'none' })
        }

        try {
            wx.showLoading({ title: '登录中...' })
            const loginRes = await api.login(username, password)
            wx.hideLoading()

            if (loginRes?.data?.token) {
                this.redirectByRole(loginRes.data.role)
            }
        } catch (err) {
            wx.hideLoading()
            console.error('Login failed', err)
            wx.showToast({ title: '登录失败，请检查账号密码', icon: 'none' })
        }
    },

    redirectByRole(role) {
        let url = '/pages/index/index' // Default for ADMIN or others

        if (role === 'FARMER') {
            url = '/pages/planting/index'
        } else if (role === 'FACTORY') {
            url = '/pages/processing/index'
        } else if (role === 'REGULATOR') {
            url = '/pages/inspection/index'
        }

        wx.reLaunch({ url })
    }
})
