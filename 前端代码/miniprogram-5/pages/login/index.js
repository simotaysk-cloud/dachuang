const api = require('../../utils/api')

const REMEMBER_USERNAME_KEY = 'loginRememberUsername'
const REMEMBER_PASSWORD_KEY = 'loginRememberPassword'
const SAVED_USERNAME_KEY = 'loginSavedUsername'
const SAVED_PASSWORD_KEY = 'loginSavedPassword'

Page({
    data: {
        baseUrl: api.baseUrl,
        username: '',
        password: '',
        rememberUsername: false,
        rememberPassword: false
    },

    onLoad() {
        try {
            const info = wx.getAppBaseInfo()
            if (info && info.platform === 'devtools') {
                api.setBaseUrl('http://192.168.31.157:8091')
                this.setData({ baseUrl: api.baseUrl })
            }
        } catch (e) {
            // ignore
        }
        api.init()
        const rememberUsername = !!wx.getStorageSync(REMEMBER_USERNAME_KEY)
        const rememberPassword = !!wx.getStorageSync(REMEMBER_PASSWORD_KEY)
        const username = rememberUsername ? (wx.getStorageSync(SAVED_USERNAME_KEY) || '') : ''
        const password = (rememberUsername && rememberPassword) ? (wx.getStorageSync(SAVED_PASSWORD_KEY) || '') : ''
        this.setData({ rememberUsername, rememberPassword: rememberUsername && rememberPassword, username, password })
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        const value = (e.detail.value || '').trim()
        this.setData({ [field]: value })
    },

    onRememberUsernameChange(e) {
        const rememberUsername = !!e.detail.value
        // If user disables remembering username, also disable remembering password.
        this.setData({ rememberUsername, rememberPassword: rememberUsername ? this.data.rememberPassword : false })
        wx.setStorageSync(REMEMBER_USERNAME_KEY, rememberUsername)
        if (!rememberUsername) {
            wx.removeStorageSync(SAVED_USERNAME_KEY)
            wx.setStorageSync(REMEMBER_PASSWORD_KEY, false)
            wx.removeStorageSync(SAVED_PASSWORD_KEY)
        }
    },

    onRememberPasswordChange(e) {
        const rememberPassword = !!e.detail.value
        // Remembering password implies remembering username.
        if (rememberPassword && !this.data.rememberUsername) {
            this.setData({ rememberUsername: true })
            wx.setStorageSync(REMEMBER_USERNAME_KEY, true)
        }
        this.setData({ rememberPassword })
        wx.setStorageSync(REMEMBER_PASSWORD_KEY, rememberPassword)
        if (!rememberPassword) {
            wx.removeStorageSync(SAVED_PASSWORD_KEY)
        }
    },

    onBaseUrlInput(e) {
        const url = (e.detail.value || '').trim()
        this.setData({ baseUrl: url })
        // Avoid breaking all requests while user is typing an incomplete URL.
        if (/^https?:\/\//.test(url)) {
            api.setBaseUrl(url)
        }
    },

    goIndex() {
        wx.reLaunch({ url: '/pages/index/index' })
    },

    async checkHealth() {
        try {
            wx.showLoading({ title: '检测中...' })
            const res = await api.checkHealth({ quiet: true })
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
            // Use quiet: true to handle UI notifications manually and avoid showLoading/hideLoading mismatch warnings.
            const loginRes = await api.login(username, password, { quiet: true })
            wx.hideLoading()

            if (loginRes?.data?.token) {
                if (this.data.rememberUsername) {
                    wx.setStorageSync(SAVED_USERNAME_KEY, username)
                }
                if (this.data.rememberPassword) {
                    wx.setStorageSync(SAVED_PASSWORD_KEY, password)
                }
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
        // Keep navigation consistent across roles.
        // FARMER needs access to both "批次管理" and "种植录入", so landing on index is required.
        const url = '/pages/index/index'
        wx.reLaunch({ url })
    }
})
