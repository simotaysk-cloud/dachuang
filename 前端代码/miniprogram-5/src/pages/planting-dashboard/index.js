const api = require('../../utils/api')
const { guardFeatureAccess } = require('../../utils/rbac')

Page({
  data: {
    loading: false,
    usernameRaw: api.username || 'farmer',
    roleLabel: api.getRoleName(api.role),
    summaryCards: [],
    herbBars: [],
    originBars: [],
    categoryTags: []
  },

  onLoad() {
    if (!guardFeatureAccess(api.role, 'PLANTING')) return
    this.setData({
      usernameRaw: api.username || 'farmer',
      roleLabel: api.getRoleName(api.role)
    })
    this.loadStats()
  },

  onBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }
    wx.reLaunch({ url: '/pages/index/index' })
  },

  async loadStats() {
    this.setData({ loading: true })
    try {
      const res = await api.request('/api/v1/batches?rootOnly=true', 'GET', undefined, { quiet: true })
      const batches = Array.isArray(res?.data) ? res.data : []
      this.setData({
        loading: false,
        ...this.buildViewModel(batches)
      })
    } catch (err) {
      this.setData({
        loading: false,
        ...this.buildViewModel([])
      })
      wx.showToast({ title: '统计加载失败', icon: 'none' })
    }
  },

  buildViewModel(batches) {
    const list = Array.isArray(batches) ? batches : []
    const herbMap = this.countBy(list, (item) => item?.name || item?.category || '未命名药材')
    const originMap = this.countBy(list, (item) => this.normalizeProvince(item?.origin) || '未标注产地')
    const categoryMap = this.countBy(list, (item) => item?.category || '未分类')

    const herbBars = this.toBars(herbMap, 6)
    const originBars = this.toBars(originMap, 6)
    const categoryTags = this.toTags(categoryMap, 6)

    const dominantOrigin = originBars[0]?.name || '暂无'
    const summaryCards = [
      { key: 'batch', label: '种植批次', value: String(list.length), note: '已建立的源头批次' },
      { key: 'herb', label: '药材种类', value: String(Object.keys(herbMap).length), note: '当前在管药材品类' },
      { key: 'origin', label: '产地来源', value: String(Object.keys(originMap).length), note: `主要产地 ${dominantOrigin}` }
    ]

    return {
      summaryCards,
      herbBars,
      originBars,
      categoryTags
    }
  },

  countBy(list, getKey) {
    return list.reduce((acc, item) => {
      const raw = String(getKey(item) || '').trim() || '未分类'
      acc[raw] = (acc[raw] || 0) + 1
      return acc
    }, {})
  },

  toBars(counter, limit) {
    const entries = Object.entries(counter)
      .map(([name, value]) => ({ name, value: Number(value || 0) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)

    const max = Math.max(1, ...entries.map((item) => item.value))
    return entries.map((item) => ({
      ...item,
      percent: Math.max(12, Math.round((item.value / max) * 100))
    }))
  },

  toTags(counter, limit) {
    return Object.entries(counter)
      .map(([name, value]) => ({ name, value: Number(value || 0) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
  },

  normalizeProvince(raw) {
    const text = String(raw || '').trim()
    if (!text) return ''
    const aliases = [
      ['北京市', '北京'], ['天津市', '天津'], ['上海市', '上海'], ['重庆市', '重庆'],
      ['内蒙古自治区', '内蒙古'], ['广西壮族自治区', '广西'], ['西藏自治区', '西藏'],
      ['宁夏回族自治区', '宁夏'], ['新疆维吾尔自治区', '新疆'],
      ['香港特别行政区', '香港'], ['澳门特别行政区', '澳门'],
      ['黑龙江省', '黑龙江'], ['吉林省', '吉林'], ['辽宁省', '辽宁'],
      ['河北省', '河北'], ['山西省', '山西'], ['陕西省', '陕西'], ['甘肃省', '甘肃'],
      ['青海省', '青海'], ['山东省', '山东'], ['江苏省', '江苏'], ['浙江省', '浙江'],
      ['安徽省', '安徽'], ['福建省', '福建'], ['江西省', '江西'], ['河南省', '河南'],
      ['湖北省', '湖北'], ['湖南省', '湖南'], ['广东省', '广东'], ['海南省', '海南'],
      ['四川省', '四川'], ['贵州省', '贵州'], ['云南省', '云南'], ['台湾省', '台湾']
    ]
    for (let i = 0; i < aliases.length; i += 1) {
      const [full, short] = aliases[i]
      if (text.includes(full) || text.startsWith(short)) return short
    }
    const match = text.match(/^(.*?(省|市|自治区|特别行政区))/)
    if (match && match[1]) {
      return match[1]
        .replace('壮族自治区', '')
        .replace('回族自治区', '')
        .replace('维吾尔自治区', '')
        .replace('自治区', '')
        .replace('特别行政区', '')
        .replace('省', '')
        .replace('市', '')
    }
    return text.slice(0, 4)
  }
})
