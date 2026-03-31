const api = require('../../../utils/api');
const { guardFeatureAccess } = require('../../../utils/rbac');

Page({
    data: {
        info: {},
        usernameRaw: api.username || 'user',
        roleLabel: ''
    },

    async onLoad(options) {
        if (!guardFeatureAccess(api.role, 'BATCH')) return;
        this.setData({ roleLabel: api.getRoleName(api.role) });
        await this.loadProfile();
        if (options.data) {
            try {
                const info = JSON.parse(decodeURIComponent(options.data));
                this.setData({ info });
            } catch (e) {
                console.error("Failed to parse node info", e);
            }
        }
    },

    async loadProfile() {
        try {
            const res = await api.getMe();
            const profile = res?.data || {};
            this.setData({
                usernameRaw: profile?.username || profile?.name || api.username || 'user',
                roleLabel: api.getRoleName(profile?.role || api.role)
            });
        } catch (err) {
        }
    },

    onBack() {
        const pages = getCurrentPages();
        if (pages.length > 1) return wx.navigateBack();
        wx.reLaunch({ url: '/pages/index/index' });
    }
});
