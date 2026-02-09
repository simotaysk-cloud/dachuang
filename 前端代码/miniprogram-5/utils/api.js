function getDefaultBaseUrl() {
    try {
        const info = wx.getAppBaseInfo()
        if (info && info.platform === 'devtools') {
            return 'http://127.0.0.1:8091'
        }
    } catch (e) {
        // ignore
    }
    // Real device preview cannot access 127.0.0.1 on PC; use LAN IP (can be overridden in login page).
    // Real device preview cannot access 127.0.0.1 on PC; use LAN IP (can be overridden in login page).
    return 'http://192.168.31.157:8091'
}

function normalizeRole(role) {
    return String(role || '').trim().toUpperCase()
}

function normalizeBaseUrl(url) {
    const u = String(url || '').trim()
    if (!u) return u
    // Upgrade legacy defaults to the new dev port (8091) to avoid the 8081 port conflict.
    if (u === 'http://127.0.0.1:8081') return 'http://127.0.0.1:8091'
    if (u === 'http://192.168.31.157:8081') return 'http://192.168.31.157:8091'
    return u
}

const api = {
    baseUrl: normalizeBaseUrl(wx.getStorageSync('baseUrl') || getDefaultBaseUrl()),
    token: wx.getStorageSync('token') || '',
    role: normalizeRole(wx.getStorageSync('role') || ''),

    init() {
        console.log('Current API Base URL:', this.baseUrl)
    },

    setBaseUrl(url) {
        const u = normalizeBaseUrl(url)
        this.baseUrl = u
        wx.setStorageSync('baseUrl', u)
    },

    setToken(token) {
        this.token = token
        wx.setStorageSync('token', token)
    },

    setRole(role) {
        const r = normalizeRole(role)
        this.role = r
        wx.setStorageSync('role', r)
    },

    request(path, method = 'GET', data = undefined) {
        return new Promise((resolve, reject) => {
            const headers = { 'Content-Type': 'application/json' }
            if (this.token) {
                headers.Authorization = `Bearer ${this.token}`
            }
            wx.request({
                url: `${this.baseUrl}${path}`,
                method,
                data,
                header: headers,
                success: (res) => {
                    const payload = res.data
                    const error = { statusCode: res.statusCode, data: payload }

                    // Backend always returns HTTP 200 with business `code`.
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        if (payload && typeof payload === 'object' && 'code' in payload && payload.code !== 200) {
                            console.error('API Business Error:', payload.code, payload.message)
                            wx.showToast({
                                title: payload?.message || '请求失败',
                                icon: 'none'
                            })
                            reject(error)
                            return
                        }
                        resolve(payload)
                        return
                    }

                    wx.showToast({
                        title: payload?.message || '请求失败',
                        icon: 'none'
                    })
                    reject(error)
                },
                fail: (err) => {
                    wx.showToast({
                        title: '网络错误',
                        icon: 'none'
                    })
                    reject(err)
                }
            })
        })
    },

    // Auth
    async login(username, password) {
        const res = await this.request('/api/v1/auth/login', 'POST', { username, password })
        if (res?.data?.token) {
            this.setToken(res.data.token)
        }
        if (res?.data?.role) {
            this.setRole(res.data.role)
        }
        return res
    },

    // Health
    checkHealth() {
        return this.request('/api/v1/health')
    },

    // Profile
    getMe() {
        return this.request('/api/v1/auth/me')
    },

    // Batches
    listBatches() {
        return this.request('/api/v1/batches')
    },

    uploadFile(filePath) {
        return new Promise((resolve, reject) => {
            const header = {}
            if (this.token) {
                header.Authorization = `Bearer ${this.token}`
            }
            wx.uploadFile({
                url: `${this.baseUrl}/api/v1/files/upload`,
                filePath,
                name: 'file',
                header,
                success: (res) => {
                    let payload = null
                    try {
                        payload = JSON.parse(res.data)
                    } catch (e) {
                        payload = null
                    }
                    const error = { statusCode: res.statusCode, data: payload }
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        if (payload && typeof payload === 'object' && 'code' in payload && payload.code !== 200) {
                            wx.showToast({ title: payload?.message || '上传失败', icon: 'none' })
                            reject(error)
                            return
                        }
                        resolve(payload)
                        return
                    }
                    wx.showToast({ title: payload?.message || '上传失败', icon: 'none' })
                    reject(error)
                },
                fail: (err) => {
                    wx.showToast({ title: '上传失败', icon: 'none' })
                    reject(err)
                }
            })
        })
    }
}

module.exports = api
