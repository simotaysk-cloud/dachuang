const api = require('../../../utils/api');
const { guardFeatureAccess } = require('../../../utils/rbac');

Page({
    data: {
        info: {}
    },

    onLoad(options) {
        if (!guardFeatureAccess(api.role, 'BATCH')) return;
        if (options.data) {
            try {
                const info = JSON.parse(decodeURIComponent(options.data));
                this.setData({ info });
            } catch (e) {
                console.error("Failed to parse node info", e);
            }
        }
    }
});
