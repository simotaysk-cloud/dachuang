const api = require('../../utils/api')

Page({
    data: {
        username: '',
        roleName: '',
        token: ''
    },

    onLoad: function (options) {
        this.updateProfile()
    },

    onShow: function () {
        this.updateProfile()
    },

    updateProfile() {
        this.setData({
            username: api.username || '未登录',
            roleName: api.getRoleName(api.role),
            token: api.token
        })
    },

    navTo: function (e) {
        const url = e.currentTarget.dataset.url;
        if (url) {
            wx.navigateTo({
                url: url,
                fail: () => {
                    wx.switchTab({
                        url: url
                    });
                }
            });
        }
    },

    navBack: function () {
        wx.navigateBack();
    },

    logout() {
        api.setToken('')
        api.setRole('')
        api.setUsername('')
        wx.reLaunch({ url: '/pages/login/index' })
    }
});
