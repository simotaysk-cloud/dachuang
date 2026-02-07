const api = require('../../utils/api')

Page({
    data: {
        baseUrl: api.baseUrl,
        username: '',
        password: ''
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        const value = (e.detail.value || '').trim()
        this.setData({ [field]: value })
    },

    onBaseUrlInput(e) {
        const url = (e.detail.value || '').trim()
        this.setData({ baseUrl: url })
        api.setBaseUrl(url)
    },

    goIndex() {
        wx.reLaunch({ url: '/pages/index/index' })
    },

    async checkHealth() {
        try {
            wx.showLoading({ title: '检测中...' })
            const res = await api.checkHealth()
            wx.hideLoading()
            wx.showToast({ title: res?.data?.status ? `健康: ${res.data.status}` : '后端可用', icon: 'none' })
        } catch (err) {
            wx.hideLoading()
            const msg = (err && (err.message || err.errMsg)) ? (err.message || err.errMsg) : ''
            wx.showToast({ title: msg.includes('domain') ? '域名未配置(合法域名)' : '无法连接后端', icon: 'none' })
        }
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
            const statusCode = err?.statusCode
            const businessCode = err?.data?.code
            const backendMsg = err?.data?.message || err?.data?.msg || ''
            const rawMsg = backendMsg || err?.message || err?.errMsg || ''
            const msg = String(rawMsg || '')
            if (msg.includes('url not in domain list') || msg.includes('domain')) {
                wx.showToast({ title: '域名未配置：请设置 request 合法域名', icon: 'none' })
                return
            }
            if (msg.includes('request:fail') || msg.includes('Network') || msg.includes('timeout')) {
                wx.showToast({ title: '网络错误：检查 Base URL/端口/同网段', icon: 'none' })
                return
            }
            // Backend 401 message might be English; show a friendly text.
            if (statusCode === 401 || businessCode === 401 || msg.toLowerCase().includes('incorrect') || msg.includes('401')) {
                wx.showToast({ title: '账号或密码错误', icon: 'none' })
                return
            }
            wx.showToast({ title: backendMsg || '登录失败', icon: 'none' })
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
