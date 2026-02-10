const api = require('../../utils/api')

Page({
    data: {
        url: ''
    },
    onLoad() {
        // Construct the URL based on the current API baseUrl
        const baseUrl = api.baseUrl.endsWith('/') ? api.baseUrl : api.baseUrl + '/'
        this.setData({
            url: `${baseUrl}admin/index.html`
        })
    }
})
