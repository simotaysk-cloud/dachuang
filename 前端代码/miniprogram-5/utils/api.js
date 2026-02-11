const DEFAULT_API_BASE_URL = 'http://192.168.31.157:8091'
const BASE_URL_STORAGE_KEY = 'baseUrl'

let config = {
    apiBaseUrl: DEFAULT_API_BASE_URL,
    debug: true
}

try {
    const externalConfig = require('./config')
    if (externalConfig && typeof externalConfig === 'object') {
        config = {
            ...config,
            ...externalConfig
        }
    }
} catch (err) {
    // Keep app usable even when config.js is not packaged in dev tools.
    console.warn('utils/config not loaded, using default apiBaseUrl')
}

function getDefaultBaseUrl() {
    return config.apiBaseUrl
}

function getStoredBaseUrl() {
    try {
        return wx.getStorageSync(BASE_URL_STORAGE_KEY) || ''
    } catch (err) {
        return ''
    }
}

function normalizeRole(role) {
    return String(role || '').trim().toUpperCase()
}

function normalizeBaseUrl(url) {
    let u = String(url || '').trim()
    if (!u) return u

    // Ensure protocol is present
    if (u && !u.startsWith('http')) {
        u = 'http://' + u
    }

    return u
}

const api = {
    baseUrl: normalizeBaseUrl(getStoredBaseUrl() || getDefaultBaseUrl() || DEFAULT_API_BASE_URL),
    token: wx.getStorageSync('token') || '',
    role: normalizeRole(wx.getStorageSync('role') || ''),

    init() {
        console.log('Current API Base URL:', this.baseUrl)
    },

    setBaseUrl(url) {
        const u = normalizeBaseUrl(url)
        if (!u) return
        this.baseUrl = u
        wx.setStorageSync(BASE_URL_STORAGE_KEY, u)
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

    request(path, method = 'GET', data = undefined, options = {}) {
        return new Promise((resolve, reject) => {
            const headers = { 'Content-Type': 'application/json' }
            if (this.token) {
                headers.Authorization = `Bearer ${this.token}`
            }
            const quiet = options.quiet || false
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
                            if (!quiet) {
                                wx.showToast({
                                    title: payload?.message || '请求失败',
                                    icon: 'none'
                                })
                            }
                            reject(error)
                            return
                        }
                        resolve(payload)
                        return
                    }

                    if (!quiet) {
                        wx.showToast({
                            title: payload?.message || '请求失败',
                            icon: 'none'
                        })
                    }
                    reject(error)
                },
                fail: (err) => {
                    if (!quiet) {
                        wx.showToast({
                            title: '网络错误',
                            icon: 'none'
                        })
                    }
                    reject(err)
                }
            })
        })
    },

    // Auth
    async login(username, password, options = {}) {
        const res = await this.request('/api/v1/auth/login', 'POST', { username, password }, options)
        if (res?.data?.token) {
            this.setToken(res.data.token)
        }
        if (res?.data?.role) {
            this.setRole(res.data.role)
        }
        return res
    },

    // Health
    checkHealth(options = {}) {
        return this.request('/api/v1/health', 'GET', undefined, options)
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
