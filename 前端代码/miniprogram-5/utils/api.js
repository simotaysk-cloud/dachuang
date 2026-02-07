const DEFAULT_BASE_URL = 'http://127.0.0.1:8081'

const api = {
    baseUrl: wx.getStorageSync('baseUrl') || DEFAULT_BASE_URL,
    token: wx.getStorageSync('token') || '',
    role: wx.getStorageSync('role') || '',

    setBaseUrl(url) {
        this.baseUrl = url
        wx.setStorageSync('baseUrl', url)
    },

    setToken(token) {
        this.token = token
        wx.setStorageSync('token', token)
    },

    setRole(role) {
        this.role = role
        wx.setStorageSync('role', role)
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
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(res.data)
                    } else {
                        wx.showToast({
                            title: res.data?.message || '请求失败',
                            icon: 'none'
                        })
                        reject(res.data)
                    }
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
    }
}

module.exports = api
