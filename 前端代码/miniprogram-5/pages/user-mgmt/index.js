const api = require('../../utils/api')

Page({
    data: {
        users: [],
        form: {
            username: '',
            password: '',
            nickname: '',
            role: 'FARMER', // Default
            name: '',
            phone: ''
        },
        roles: ['ADMIN', 'FARMER', 'FACTORY', 'LOGISTICS', 'REGULATOR'],
        showModal: false,
        isEdit: false,
        editId: null
    },

    onLoad() {
        this.loadUsers()
    },

    async loadUsers() {
        try {
            const res = await api.request('/api/v1/users')
            this.setData({ users: res?.data || [] })
        } catch (error) {
            console.error(error)
        }
    },

    onInput(e) {
        const field = e.currentTarget.dataset.field
        this.setData({
            [`form.${field}`]: e.detail.value
        })
    },

    onRoleChange(e) {
        this.setData({
            'form.role': this.data.roles[e.detail.value]
        })
    },

    openCreate() {
        this.setData({
            showModal: true,
            isEdit: false,
            form: {
                username: '',
                password: '',
                nickname: '',
                role: 'FARMER',
                name: '',
                phone: ''
            }
        })
    },

    openEdit(e) {
        const user = e.currentTarget.dataset.user
        this.setData({
            showModal: true,
            isEdit: true,
            editId: user.id,
            form: {
                username: user.username,
                password: '', // Leave blank to keep unchanged
                nickname: user.nickname,
                role: user.role,
                name: user.name,
                phone: user.phone
            }
        })
    },

    closeModal() {
        this.setData({ showModal: false })
    },

    async submit() {
        const { isEdit, editId, form } = this.data
        if (!form.username) return wx.showToast({ title: '用户名必填', icon: 'none' })

        try {
            if (isEdit) {
                const payload = {
                    password: form.password,
                    nickname: form.nickname,
                    role: form.role,
                    name: form.name,
                    phone: form.phone
                }
                await api.request(`/api/v1/users/${editId}`, 'PUT', payload)
            } else {
                if (!form.password) return wx.showToast({ title: '密码必填', icon: 'none' })
                const payload = {
                    username: form.username,
                    password: form.password,
                    nickname: form.nickname,
                    role: form.role,
                    name: form.name,
                    phone: form.phone
                }
                await api.request('/api/v1/users', 'POST', payload)
            }
            wx.showToast({ title: isEdit ? '更新成功' : '创建成功' })
            this.closeModal()
            this.loadUsers()
        } catch (error) {
            console.error(error)
        }
    },

    async deleteUser(e) {
        const id = e.currentTarget.dataset.id
        const that = this
        wx.showModal({
            title: '确认删除',
            content: '确定要删除该用户吗？',
            success: async (res) => {
                if (res.confirm) {
                    try {
                        await api.request(`/api/v1/users/${id}`, 'DELETE')
                        wx.showToast({ title: '删除成功' })
                        that.loadUsers()
                    } catch (error) {
                        console.error(error)
                    }
                }
            }
        })
    }
})
