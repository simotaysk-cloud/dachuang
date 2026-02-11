const api = require('../../utils/api')

Page({
    data: {
        url: ''
    },
    onLoad() {
        // Construct the URL based on the current API baseUrl
        const baseUrl = api.baseUrl.endsWith('/') ? api.baseUrl : api.baseUrl + '/'
        const dashboardUrl = `${baseUrl}admin/index.html`

        this.setData({
            url: dashboardUrl
        })
    }
})
