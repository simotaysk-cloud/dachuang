const api = require('../../utils/api')
const { getMenuAccess } = require('../../utils/rbac')

const EMPTY_STATS = {
  totalHerbTypes: 0,
  totalBatches: 0,
  totalRootBatches: 0,
  totalLeafBatches: 0,
  totalTerminalQrcodes: 0,
  totalProcessingRecords: 0,
  totalShipments: 0,
  totalShipmentEvents: 0,
  overallTraceabilityRate: 0,
  integrityStats: {},
  originDist: [],
  processTypeDist: []
}

const EMPTY_ADMIN_VIEW = {
  heroHighlights: []
}

const MODULE_DEFS = [
  { key: 'planting', label: '种植管理', short: '种', subtitle: '基地与田块', url: '/pages/planting/index', tone: 'jade' },
  { key: 'batch', label: '批次档案', short: '批', subtitle: '批次追踪', url: '/pages/batch/index', tone: 'gold' },
  { key: 'processing', label: '加工生产', short: '加', subtitle: '工序投料', url: '/pages/processing/index', tone: 'ink' },
  { key: 'logistics', label: '物流追踪', short: '运', subtitle: '运输签收', url: '/pages/logistics/index', tone: 'sage' },
  { key: 'inspection', label: '质量检测', short: '检', subtitle: '检验放行', url: '/pages/inspection/index', tone: 'gold' },
  { key: 'terminalQrcode', label: '终端溯源', short: '终', subtitle: '扫码验真', url: '/pages/terminal-qrcode/index', tone: 'jade' },
  { key: 'security', label: '防伪管理', short: '防', subtitle: '防伪校验', url: '/pages/security/index', tone: 'ink' },
  { key: 'dashboard', label: '数据看板', short: '看', subtitle: '经营指标', url: '/pages/web-dashboard/index', tone: 'sage' },
  { key: 'userMgmt', label: '系统权限', short: '权', subtitle: '角色权限', url: '/pages/user-mgmt/index', tone: 'jade' }
]

Page({
  data: {
    healthStatus: '检测中',
    healthTone: 'idle',
    heroPanelTone: 'normal',
    baseUrl: api.baseUrl,
    token: api.token,
    role: api.role,
    usernameRaw: api.username || '待登录',
    roleLabel: api.getRoleName(api.role),
    menuAccess: getMenuAccess(api.role),
    heroSubtitle: '聚合环节状态与关键运营指标，作为管理端统一入口。',
    isFarmerWorkbench: false,
    flowNodes: [],
    logisticsActive: false,
    configExpanded: false,
    featuredModules: [],
    moreModules: [],
    primaryAction: MODULE_DEFS[1],
    consoleAction: { label: '控制台', url: '/pages/web-dashboard/index' },
    dashboardLoading: false,
    heroHighlights: [],
    stats: EMPTY_STATS
  },

  onLoad() {
    this.syncPageState()
    this.checkHealth()
    this.loadDashboardStats()
  },

  onShow() {
    this.syncPageState()
  },

  onBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }
    wx.reLaunch({ url: '/pages/login/index' })
  },

  syncPageState() {
    const role = api.role
    const menuAccess = getMenuAccess(role)
    const flowNodes = this.decorateFlowNodes(this.getFlowNodes(role))
    const logisticsActive = this.isLogisticsVisible(role)
    const { featuredModules, moreModules, primaryAction } = this.buildModules(menuAccess)
    const isFarmerWorkbench = String(role || '').toUpperCase() === 'FARMER'
    const isAdmin = String(role || '').toUpperCase() === 'ADMIN'
    const consoleAction = isFarmerWorkbench
      ? { label: '控制台', url: '/pages/planting-dashboard/index' }
      : { label: '控制台', url: menuAccess.dashboard ? '/pages/web-dashboard/index' : (primaryAction?.url || '/pages/index/index') }

    this.setData(
      {
        baseUrl: api.baseUrl,
        token: api.token,
        role,
        usernameRaw: api.username || '待登录',
        roleLabel: api.getRoleName(role),
        menuAccess,
        heroSubtitle: isFarmerWorkbench
          ? '查看种植批次、录入农事记录，并跟踪当前链路接入状态。'
          : (isAdmin
            ? '聚合批次档案、环节状态与关键运营指标，作为管理端统一入口。'
            : '聚合环节状态与关键运营指标，作为业务端统一入口。'),
        isFarmerWorkbench,
        flowNodes,
        logisticsActive,
        featuredModules,
        moreModules,
        primaryAction,
        consoleAction
      },
      () => this.refreshDerivedData()
    )
  },

  isLogisticsVisible(role) {
    const current = String(role || '').toUpperCase()
    return current === 'LOGISTICS' || current === 'ADMIN' || current === 'REGULATOR'
  },

  decorateFlowNodes(nodes) {
    return nodes.map((item, index) => ({
      ...item,
      statusText: item.active ? '已接入' : '待接入',
      statusTone: item.active ? 'active' : 'idle',
      isLast: index === nodes.length - 1
    }))
  },

  getFlowNodes(role) {
    const current = String(role || '').toUpperCase()
    const isAdmin = current === 'ADMIN' || current === 'REGULATOR'
    return [
      { id: 'origin', name: '资源产地', detail: '道地药材基地', active: isAdmin || current === 'FARMER' },
      { id: 'inspect1', name: '原料质检', detail: '原料入库检测', active: isAdmin || current === 'QUALITY' },
      { id: 'process', name: '加工生产', detail: '工艺投料与加工', active: isAdmin || current === 'MANUFACTURER' || current === 'FACTORY' },
      { id: 'inspect2', name: '成品检验', detail: '批次检验放行', active: isAdmin || current === 'QUALITY' },
      { id: 'logistics', name: '物流流转', detail: '运输签收流转', active: isAdmin || current === 'LOGISTICS' }
    ]
  },

  buildModules(menuAccess) {
    const available = MODULE_DEFS.filter((item) => !!menuAccess[item.key])
    return {
      featuredModules: available.slice(0, 2),
      moreModules: available.slice(2),
      primaryAction: available[0] || MODULE_DEFS[1]
    }
  },

  refreshDerivedData() {},

  async loadDashboardStats() {
    this.setData({ dashboardLoading: true })
    try {
      let dashboardView = {}
      let stats = EMPTY_STATS
      if (this.data.isFarmerWorkbench) {
        const res = await api.request('/api/v1/batches?rootOnly=true', 'GET', undefined, { quiet: true })
        const batches = Array.isArray(res?.data) ? res.data : []
        dashboardView = this.buildFarmerHeroHighlights(batches)
      } else {
        const res = await api.request('/api/v1/dashboard/stats', 'GET', undefined, { quiet: true })
        stats = res && res.data ? res.data : EMPTY_STATS
        dashboardView = this.buildDashboardView(stats)
      }
      this.setData({
        stats,
        dashboardLoading: false,
        ...dashboardView
      })
    } catch (err) {
      this.setData({
        dashboardLoading: false,
        stats: EMPTY_STATS,
        ...(this.data.isFarmerWorkbench ? this.buildFarmerHeroHighlights([]) : this.buildDashboardView(EMPTY_STATS))
      })
    }
  },

  buildDashboardView(stats) {
    const currentRole = String(this.data.role || '').toUpperCase()
    const isAdmin = currentRole === 'ADMIN'
    const safeStats = {
      ...EMPTY_STATS,
      ...(stats || {}),
      integrityStats: stats?.integrityStats || {},
      originDist: this.normalizeDistByProvince(Array.isArray(stats?.originDist) ? stats.originDist : []),
      processTypeDist: Array.isArray(stats?.processTypeDist) ? stats.processTypeDist : []
    }
    const overviewItems = [
      { key: 'batch', label: isAdmin ? '批次档案' : '源头批次', value: safeStats.totalBatches, note: `${safeStats.totalRootBatches} 个源头批次` },
      { key: 'leaf', label: '终端成品', value: safeStats.totalLeafBatches, note: `${safeStats.totalTerminalQrcodes} 个终端码` },
      { key: 'processing', label: '加工记录', value: safeStats.totalProcessingRecords, note: `${safeStats.totalHerbTypes} 类药材` },
      { key: 'shipment', label: '物流发运', value: safeStats.totalShipments, note: `${safeStats.totalShipmentEvents} 条事件` }
    ].map((item) => ({
      ...item,
      value: this.formatStatValue(item.value)
    }))
    const heroHighlights = overviewItems

    return {
      heroHighlights
    }
  },

  buildFarmerHeroHighlights(batches) {
    const list = Array.isArray(batches) ? batches : []
    const herbMap = this.countBy(list, (item) => item?.name || item?.category || '未命名药材')
    const originMap = this.countBy(list, (item) => this.normalizeProvince(item?.origin) || '未标注产地')
    const originEntries = this.toSortedEntries(originMap)
    const dominantOrigin = originEntries[0]?.name || '暂无'

    return {
      heroHighlights: [
        { key: 'batch', label: '种植批次', value: String(list.length), note: '已建立的源头批次' },
        { key: 'herb', label: '药材种类', value: String(Object.keys(herbMap).length), note: '当前在管药材品类' },
        { key: 'origin', label: '产地来源', value: String(Object.keys(originMap).length), note: `主要产地 ${dominantOrigin}` }
      ]
    }
  },

  countBy(list, getKey) {
    return (Array.isArray(list) ? list : []).reduce((acc, item) => {
      const raw = String(getKey(item) || '').trim() || '未分类'
      acc[raw] = (acc[raw] || 0) + 1
      return acc
    }, {})
  },

  toSortedEntries(counter) {
    return Object.entries(counter || {})
      .map(([name, value]) => ({ name, value: Number(value || 0) }))
      .sort((a, b) => b.value - a.value)
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
      ['四川省', '四川'], ['贵州省', '贵州'], ['云南省', '云南'],
      ['台湾省', '台湾']
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
  },

  normalizeDistByProvince(list) {
    const counter = (Array.isArray(list) ? list : []).reduce((acc, item) => {
      const name = this.normalizeProvince(item?.name) || '未标注'
      acc[name] = (acc[name] || 0) + Number(item?.value || 0)
      return acc
    }, {})
    return this.toSortedEntries(counter)
  },

  formatStatValue(value) {
    const num = Number(value || 0)
    if (!Number.isFinite(num)) return '0'
    return String(num)
  },

  onBaseUrlInput(e) {
    this.setData({ baseUrl: e.detail.value })
  },

  toggleConfig() {
    this.setData({ configExpanded: !this.data.configExpanded })
  },

  stopBubble() {},

  async saveBaseUrlAndCheck() {
    const next = String(this.data.baseUrl || '').trim()
    if (!next) {
      wx.showToast({ title: '请输入后端URL', icon: 'none' })
      return
    }

    api.setBaseUrl(next)
    this.setData({ baseUrl: api.baseUrl })
    await this.checkHealth()

    const tip = String(api.baseUrl || '').toLowerCase().startsWith('http://')
      ? '已保存，正式版请用HTTPS'
      : '已保存'
    wx.showToast({ title: tip, icon: 'none' })
  },

  async checkHealth() {
    let healthStatus = '异常'
    let healthTone = 'error'
    let heroPanelTone = 'warning'
    try {
      const res = await api.checkHealth()
      const raw = String(res?.data?.status || '').trim().toUpperCase()
      const ok = raw === 'UP' || raw === 'OK' || raw === 'HEALTHY' || raw === 'NORMAL'
      healthStatus = ok ? '正常' : '异常'
      healthTone = ok ? 'active' : 'error'
      heroPanelTone = ok ? 'normal' : 'warning'
    } catch (err) {
      healthStatus = '异常'
      healthTone = 'error'
      heroPanelTone = 'warning'
    }

    this.setData({ healthStatus, healthTone, heroPanelTone }, () => this.refreshDerivedData())
  },

  onNodeClick(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return

    const role = String(this.data.role || '').toUpperCase()
    const isAdmin = role === 'ADMIN' || role === 'REGULATOR'

    switch (id) {
      case 'origin':
        if (isAdmin || role === 'FARMER') {
          wx.navigateTo({ url: '/pages/planting/index' })
        } else {
          wx.showToast({ title: '请使用农户账号登录', icon: 'none' })
        }
        break
      case 'inspect1':
        if (isAdmin || role === 'QUALITY') {
          wx.navigateTo({ url: '/pages/inspection/index?type=RAW' })
        } else {
          wx.showToast({ title: '请使用质检员账号登录', icon: 'none' })
        }
        break
      case 'process':
        if (isAdmin || role === 'MANUFACTURER' || role === 'FACTORY') {
          wx.navigateTo({ url: '/pages/processing/index' })
        } else {
          wx.showToast({ title: '请使用加工商账号登录', icon: 'none' })
        }
        break
      case 'inspect2':
        if (isAdmin || role === 'QUALITY') {
          wx.navigateTo({ url: '/pages/inspection/index?type=FINISHED' })
        } else {
          wx.showToast({ title: '请使用质检员账号登录', icon: 'none' })
        }
        break
      case 'logistics':
        if (isAdmin || role === 'LOGISTICS' || role === 'MANUFACTURER') {
          wx.navigateTo({ url: '/pages/logistics/index' })
        } else {
          wx.showToast({ title: '无物流权限', icon: 'none' })
        }
        break
    }
  },

  navTo(e) {
    const { url } = e.currentTarget.dataset
    if (!url) {
      return
    }
    wx.navigateTo({ url })
  },

  onProfileClick() {
    wx.showActionSheet({
      itemList: ['切换账号', '取消'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 彻底清除登录态
          api.setToken('')
          api.setRole('')
          api.setUsername('')
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 800
          })
          
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/login/index'
            })
          }, 800)
        }
      }
    })
  }
})
