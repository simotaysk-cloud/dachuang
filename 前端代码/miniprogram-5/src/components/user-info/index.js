const api = require('../../utils/api')

Component({
    options: {
        addGlobalClass: true
    },
    data: {
        username: '',
        roleName: '',
        token: ''
    },
    lifetimes: {
        attached() {
            this.refresh()
        }
    },
    pageLifetimes: {
        show() {
            this.refresh()
        }
    },
    methods: {
        refresh() {
            this.setData({
                username: api.username,
                roleName: api.getRoleName(),
                token: api.token
            })
        }
    }
})
