// logs.js
const api = require('../../utils/api')
const util = require('../../utils/util.js')

Page({
  data: {
    logs: []
  },
  onLoad() {
    if (api.role === 'FARMER') {
      wx.showToast({ title: '无权限（农户仅可使用种植相关模块）', icon: 'none' })
      return wx.redirectTo({ url: '/pages/index/index' })
    }
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map(log => {
        return {
          date: util.formatTime(new Date(log)),
          timeStamp: log
        }
      })
    })
  }
})
