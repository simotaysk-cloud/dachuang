const api = require('../../utils/api')

const REMEMBER_LOGIN_KEY = 'loginRememberCredentials'
const SAVED_USERNAME_KEY = 'loginSavedUsername'
const SAVED_PASSWORD_KEY = 'loginSavedPassword'

Page({
    data: {
        username: '',
        password: '',
        rememberLogin: false,
        baseUrl: ''
    },

    onLoad() {
        try {
            const info = wx.getAppBaseInfo()
            if (info && info.platform === 'devtools') {
                api.setBaseUrl('http://192.168.31.157:8091')
            }
        } catch (e) {
            // ignore
        }
        api.init()
        const rememberLogin = !!wx.getStorageSync(REMEMBER_LOGIN_KEY)
        const username = rememberLogin ? (wx.getStorageSync(SAVED_USERNAME_KEY) || '') : ''
        const password = rememberLogin ? (wx.getStorageSync(SAVED_PASSWORD_KEY) || '') : ''
        this.setData({ rememberLogin, username, password, baseUrl: api.baseUrl })
    },

    onInput(e) {
        const { field } = e.currentTarget.dataset
        const value = (e.detail.value || '').trim()
        this.setData({ [field]: value })
    },

    onRememberLoginChange(e) {
        const rememberLogin = !!e.detail.value
        this.setData({ rememberLogin })
        wx.setStorageSync(REMEMBER_LOGIN_KEY, rememberLogin)
        if (!rememberLogin) {
            wx.removeStorageSync(SAVED_USERNAME_KEY)
            wx.removeStorageSync(SAVED_PASSWORD_KEY)
        }
    },

    onBaseUrlInput(e) {
        this.setData({ baseUrl: e.detail.value || '' })
    },

    async saveBaseUrlAndCheck() {
        const next = String(this.data.baseUrl || '').trim()
        if (!next) {
            wx.showToast({ title: '请输入后端URL', icon: 'none' })
            return
        }
        api.setBaseUrl(next)
        this.setData({ baseUrl: api.baseUrl })
        try {
            await api.checkHealth({ quiet: true })
            wx.showToast({ title: '保存成功', icon: 'none' })
        } catch (err) {
            wx.showToast({ title: '已保存，连通失败', icon: 'none' })
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
                if (this.data.rememberLogin) {
                    wx.setStorageSync(SAVED_USERNAME_KEY, username)
                    wx.setStorageSync(SAVED_PASSWORD_KEY, password)
                } else {
                    wx.removeStorageSync(SAVED_USERNAME_KEY)
                    wx.removeStorageSync(SAVED_PASSWORD_KEY)
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
