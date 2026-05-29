const api = require('../../utils/api')
const { guardFeatureAccess, normalizeRole } = require('../../utils/rbac')

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
  originDist: [],
  processTypeDist: [],
  integrityStats: {},
  recentBlockchainRecords: []
}

Page({
  data: {
    loading: false,
    forecast: {},
    usernameRaw: api.username || 'user',
    roleLabel: api.getRoleName(api.role),
    roleCode: normalizeRole(api.role),
    dashboardTitle: '数据看板',
    dashboardDesc: '集中查看批次、加工、物流和链上存证的核心指标。',
    summaryCards: [],
    insightTitle: '统计速览',
    insightCaption: '查看关键经营指标和环节覆盖情况。',
    insightCards: [],
    distSections: [],
    tagSectionTitle: '环节标签',
    tagSectionCaption: '查看当前链路覆盖与关键指标标签。',
    tagItems: [],
    chainSectionTitle: '链上存证',
    chainSectionCaption: '查看最近一次同步到链上的批次记录。',
    chainRecords: [],
    chainEmptyText: '暂无链上存证记录',

    herbOptions: ['中药材 (全品种)'],
    herbIndex: 0,
    herbLoading: false,
    macroForecast: null,
    herbForecast: null
  },

  onLoad() {
    if (!guardFeatureAccess(api.role, 'DASHBOARD')) return
    this.setData({
      roleCode: normalizeRole(api.role),
      usernameRaw: api.username || 'user',
      roleLabel: api.getRoleName(api.role)
    })
    this.loadStats()
    this.loadHerbs()
    this.loadMacroForecast()
    this.loadHerbForecast()
  },

  onPullDownRefresh() {
    this.setData({ loading: true })
    Promise.all([
      this.loadStats(),
      this.loadHerbs(),
      this.loadMacroForecast(),
      this.loadHerbForecast()
    ]).finally(() => {
      wx.stopPullDownRefresh()
      this.setData({ loading: false })
    })
  },

  onBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }
    wx.reLaunch({ url: '/pages/index/index' })
  },

  normalizeHerbName(name) {
    if (!name) return ''
    let n = name.trim()

    const forms = [
      '配方颗粒', '颗粒剂', '颗粒', '中药饮片', '饮片', '中药材', '原药材', '药材',
      '提取物', '打粉', '粉末', '粉', '切段', '原木', '干货', '鲜货', '成品', '原料'
    ]
    forms.forEach(f => {

      const reg = new RegExp(f, 'g')
      n = n.replace(reg, '')
    })


    const markers = [
      '特级', '一级', '二级', '三级', '一等', '二等', '三等',
      '分拣', '精选', '优质', '道地', '原生', '出口', '内销',
      '统货', '选货', '机制', '手工', '头'
    ]
    markers.forEach(m => {
      const reg = new RegExp(m, 'g')
      n = n.replace(reg, '')
    })


    n = n.replace(/\(.*\)|（.*）|\[.*\]|【.*】/g, '')


    n = n.replace(/\d+/g, '')


    return n.trim().replace(/^[-\s·/、,，。]+|[-\s·/、,，。]+$/g, '')
  },

  async loadHerbs() {
    try {
      let discoveredNames = []


      try {
        const resBatches = await api.request('/api/v1/batches', 'GET', null, { quiet: true })
        if (resBatches?.data && Array.isArray(resBatches.data)) {
          const names = [...new Set(resBatches.data.map(b => b.name).filter(n => !!n))]
          if (names.length > 0) discoveredNames = names
        }
      } catch (e) { console.log('Batches discovery skip', e) }


      if (discoveredNames.length === 0) {
        try {
          const resHerbs = await api.request('/api/v1/dashboard/herbs', 'GET', null, { quiet: true })
          if (resHerbs?.data && Array.isArray(resHerbs.data)) discoveredNames = resHerbs.data
        } catch (e) {}
      }


      if (discoveredNames.length === 0) {
        try {
          const resPublic = await api.request('/api/v1/public/herbs', 'GET', null, { quiet: true })
          if (resPublic?.data && Array.isArray(resPublic.data)) discoveredNames = resPublic.data
        } catch (e) {}
      }

      if (discoveredNames.length > 0) {

        const coreNames = discoveredNames.map(name => this.normalizeHerbName(name)).filter(n => !!n)
        const cleanNames = [...new Set(coreNames)].sort()

        console.log('Final Species Aggregation:', cleanNames.length)
        this.setData({
          herbOptions: ['中药材 (全品种)', ...cleanNames]
        })
      } else {
        console.warn('Still no herbs discovered after deep scan.')
      }
    } catch (e) {
      console.error('Deep herb discovery critical failure', e)
    }
  },

  async loadMacroForecast() {
    try {
      const res = await api.request('/api/v1/dashboard/forecast')
      if (res && res.data) {
        this.setData({ macroForecast: res.data }, () => {
          this.redrawAllCharts()
        })
      }
    } catch (e) { console.error(e) }
  },

  async loadHerbForecast(herbName = '') {
    this.setData({ herbLoading: true })
    try {
      const url = herbName ? `/api/v1/dashboard/forecast?herb=${encodeURIComponent(herbName)}` : '/api/v1/dashboard/forecast'
      const res = await api.request(url)
      if (res && res.data) {
        this.setData({ herbForecast: res.data }, () => {
          this.redrawAllCharts()
        })
      }
    } catch (e) { console.error(e) }
    finally { this.setData({ herbLoading: false }) }
  },

  redrawAllCharts() {
    // 增加延迟确保 WXML 完全渲染完毕 (wx:if 挂载完成)
    setTimeout(() => {
      if (this.data.macroForecast) {
        this.drawForecastChart('fc_v6_macro_legacy', this.data.macroForecast, '#FFCA28')
      }
    }, 500)

    setTimeout(() => {
      if (this.data.herbForecast) {
        this.drawForecastChart('fc_v6_herb_legacy', this.data.herbForecast, '#4DB6AC')
      }
    }, 1000)
  },

  onHerbChange(e) {
    const idx = parseInt(e.detail.value)
    const herbName = idx === 0 ? '' : this.data.herbOptions[idx]
    this.setData({ herbIndex: idx })
    this.loadHerbForecast(herbName)
  },

  drawForecastChart(canvasId, data, themeColor) {
    if (!data || !data.dates || data.dates.length === 0) {
      console.warn('drawForecastChart: No data to draw', canvasId)
      return
    }

    const ctx = wx.createCanvasContext(canvasId, this)
    const width = 340 // 默认宽度，稍后通过 query 优化
    const height = 200 // 默认高度

    this.createSelectorQuery().in(this)
      .select('[canvas-id="' + canvasId + '"]')
      .fields({ size: true })
      .exec((res) => {
        const w = (res && res[0]) ? res[0].width : width
        const h = (res && res[0]) ? res[0].height : height

        const padding = { top: 20, right: 30, bottom: 30, left: 40 }
        const dates = data.dates || []
        const actual = data.actualValues || []
        const predicted = data.predictedValues || []
        const lower = data.lowerConfidenceBounds || []
        const upper = data.upperConfidenceBounds || []

        const allValues = [...actual, ...predicted, ...lower, ...upper].filter(v => v !== null)
        const maxVal = Math.max(...allValues) * 1.1
        const minVal = Math.max(0, Math.min(...allValues) * 0.9)

        const getX = (index) => padding.left + (w - padding.left - padding.right) * (index / (dates.length - 1))
        const getY = (val) => h - padding.bottom - (h - padding.top - padding.bottom) * ((val - minVal) / (maxVal - minVal))

        // 1. 网格 (Legacy API: setStrokeStyle instead of strokeStyle)
        ctx.setStrokeStyle('#e0e0e0')
        ctx.setLineWidth(0.5)
        ctx.setFontSize(10)
        ctx.setFillStyle('#888888')

        for (let i = 0; i <= 4; i++) {
          const yVal = minVal + (maxVal - minVal) * (i / 4)
          const yPos = getY(yVal)
          ctx.beginPath()
          ctx.moveTo(padding.left, yPos)
          ctx.lineTo(w - padding.right, yPos)
          ctx.stroke()
          ctx.fillText(Math.floor(yVal).toString(), 5, yPos - 5)
        }

        // 2. X轴
        for (let i = 0; i < dates.length; i++) {
          if (i % 2 === 0 || i === dates.length - 1) {
            const xPos = getX(i)
            const parts = String(dates[i]).split('-')
            if (parts.length > 1) {
              ctx.fillText(parts[1] + '月', xPos - 10, h - 10)
            }
          }
        }

        // 3. 实际销量 (实线)
        ctx.beginPath()
        ctx.setStrokeStyle('#4DB6AC')
        ctx.setLineWidth(2)
        let hasActual = false
        for (let i = 0; i < dates.length; i++) {
          if (actual[i] !== null) {
            if (!hasActual) {
              ctx.moveTo(getX(i), getY(actual[i]))
              hasActual = true
            } else {
              ctx.lineTo(getX(i), getY(actual[i]))
            }
          }
        }
        ctx.stroke()

        // 4. 预测曲线 (虚划线)
        ctx.beginPath()
        ctx.setStrokeStyle('#FFCA28')
        ctx.setLineWidth(2)
        if (ctx.setLineDash) ctx.setLineDash([4, 4], 0)
        let hasPred = false
        for (let i = 0; i < dates.length; i++) {
          if (predicted[i] !== null) {
            if (!hasPred) {
              ctx.moveTo(getX(i), getY(predicted[i]))
              hasPred = true
            } else {
              ctx.lineTo(getX(i), getY(predicted[i]))
            }
          }
        }
        ctx.stroke()
        if (ctx.setLineDash) ctx.setLineDash([], 0)

        ctx.draw()
      })
  },

  async loadStats() {
    this.setData({ loading: true })
    try {
      const res = await api.request('/api/v1/dashboard/stats')
      const stats = this.normalizeStats(res?.data || {})
      this.setData({
        loading: false,
        ...this.buildDashboardView(this.data.roleCode, stats)
      })
    } catch (err) {
      this.setData({
        loading: false,
        ...this.buildDashboardView(this.data.roleCode, EMPTY_STATS)
      })
      wx.showToast({ title: '加载看板失败', icon: 'none' })
    }
  },

  normalizeStats(stats) {
    return {
      ...EMPTY_STATS,
      ...(stats || {}),
      integrityStats: stats?.integrityStats || {},
      originDist: this.normalizeDistByProvince(stats?.originDist),
      processTypeDist: Array.isArray(stats?.processTypeDist) ? stats.processTypeDist : [],
      recentBlockchainRecords: Array.isArray(stats?.recentBlockchainRecords)
        ? stats.recentBlockchainRecords.map((item) => ({
          ...item,
          txShort: this.shortTx(item.txHash)
        }))
        : []
    }
  },

  buildDashboardView(role, stats) {
    switch (role) {
      case 'MANUFACTURER':
      case 'FACTORY':
        return {
          dashboardTitle: '加工统计',
          dashboardDesc: '查看原料批次、加工工艺、成品派生与发运准备情况。',
          summaryCards: [
            this.card('root', '源头批次', stats.totalRootBatches, '可投料原料池'),
            this.card('processing', '加工记录', stats.totalProcessingRecords, '当前工序入账'),
            this.card('leaf', '终端批次', stats.totalLeafBatches, '已形成成品批次')
          ],
          insightTitle: '加工速览',
          insightCaption: '围绕加工、送检、发运和验真码数量独立统计。',
          insightCards: [
            this.card('herb', '药材种类', stats.totalHerbTypes, '当前加工药材品类'),
            this.card('inspection', '质检记录', stats.integrityStats.inspection || 0, '加工后送检次数'),
            this.card('shipment', '物流运单', stats.totalShipments, '待发运批次数'),
            this.card('event', '物流事件', stats.totalShipmentEvents, '发运流转节点数')
          ],
          distSections: [
            this.distSection('加工工艺分布', '按工艺类型统计当前加工记录。', stats.processTypeDist, 'warm', '暂无加工数据'),
            this.distSection('产地分布', '按批次来源统计主要产地省份。', stats.originDist, 'green', '暂无产地数据')
          ],
          tagSectionTitle: '链路标签',
          tagSectionCaption: '加工链路当前的关键覆盖情况。',
          tagItems: this.integrityTags(stats, [
            ['原料建档', 'planting'],
            ['加工记录', 'processing'],
            ['质检放行', 'inspection'],
            ['终端码', 'terminalQr']
          ]),
          chainSectionTitle: '近期链上记录',
          chainSectionCaption: '查看最近完成上链的加工批次。',
          chainRecords: this.chainRecords(stats.recentBlockchainRecords),
          chainEmptyText: '暂无加工链上记录'
        }
      case 'QUALITY':
        return {
          dashboardTitle: '质检统计',
          dashboardDesc: '查看送检批次、检验覆盖、验真二维码与链上存证情况。',
          summaryCards: [
            this.card('inspection', '质检记录', stats.integrityStats.inspection || 0, '已录入质检结果'),
            this.card('leaf', '终端批次', stats.totalLeafBatches, '可验真成品批次'),
            this.card('block', '区块存证', stats.integrityStats.blockchain || 0, '已完成链上存证')
          ],
          insightTitle: '质检速览',
          insightCaption: '围绕批次来源、前序加工和验真结果独立统计。',
          insightCards: [
            this.card('batch', '档案总批次', stats.totalBatches, '全链路批次规模'),
            this.card('root', '源头批次', stats.totalRootBatches, '种植起点档案'),
            this.card('processing', '加工记录', stats.totalProcessingRecords, '待送检前工序'),
            this.card('qrcode', '防伪二维码', stats.totalTerminalQrcodes, '终端验真码数量')
          ],
          distSections: [
            this.distSection('产地分布', '按批次来源统计送检样本的主要产地省份。', stats.originDist, 'green', '暂无产地数据')
          ],
          tagSectionTitle: '质检标签',
          tagSectionCaption: '查看质检链路的关键覆盖情况。',
          tagItems: this.integrityTags(stats, [
            ['原料建档', 'planting'],
            ['加工记录', 'processing'],
            ['质检放行', 'inspection'],
            ['链上验真', 'blockchain']
          ]),
          chainSectionTitle: '近期验真记录',
          chainSectionCaption: '查看最近一次完成验真的链上交易。',
          chainRecords: this.chainRecords(stats.recentBlockchainRecords),
          chainEmptyText: '暂无链上验真记录'
        }
      case 'LOGISTICS':
        return {
          dashboardTitle: '物流统计',
          dashboardDesc: '查看发运批次、运输事件、终端验真码与主要产地来源。',
          summaryCards: [
            this.card('shipment', '物流运单', stats.totalShipments, '已建立发运单'),
            this.card('event', '物流事件', stats.totalShipmentEvents, '运输流转节点数'),
            this.card('leaf', '终端批次', stats.totalLeafBatches, '末端流转成品')
          ],
          insightTitle: '物流速览',
          insightCaption: '围绕在途记录、质检放行和终端验真独立统计。',
          insightCards: [
            this.card('inspection', '质检记录', stats.integrityStats.inspection || 0, '已检验放行批次'),
            this.card('processing', '加工记录', stats.totalProcessingRecords, '进入发运前工序'),
            this.card('herb', '药材种类', stats.totalHerbTypes, '当前发运药材品类'),
            this.card('qrcode', '防伪二维码', stats.totalTerminalQrcodes, '终端验真码数量')
          ],
          distSections: [
            this.distSection('产地分布', '按批次来源统计当前发运药材产地省份。', stats.originDist, 'green', '暂无产地数据')
          ],
          tagSectionTitle: '物流标签',
          tagSectionCaption: '查看物流链路当前的关键覆盖情况。',
          tagItems: this.integrityTags(stats, [
            ['终端成品', 'terminalQr'],
            ['质检放行', 'inspection'],
            ['链上验真', 'blockchain'],
            ['物流事件', 'shipmentEvents']
          ]),
          chainSectionTitle: '近期终端记录',
          chainSectionCaption: '查看最近完成验真的末端交易。',
          chainRecords: this.chainRecords(stats.recentBlockchainRecords),
          chainEmptyText: '暂无终端链上记录'
        }
      case 'REGULATOR':
        return {
          dashboardTitle: '监管统计',
          dashboardDesc: '查看全链路接入、批次流转、工艺分布与链上交易情况。',
          summaryCards: [
            this.card('batch', '档案总批次', stats.totalBatches, '全链路批次总量'),
            this.card('inspection', '质检记录', stats.integrityStats.inspection || 0, '已录入检验结果'),
            this.card('block', '区块存证', stats.integrityStats.blockchain || 0, '链上交易数量')
          ],
          insightTitle: '监管速览',
          insightCaption: '围绕药材、源头、终端与流转事件独立统计。',
          insightCards: [
            this.card('herb', '药材种类', stats.totalHerbTypes, '监管范围内药材品类'),
            this.card('root', '源头批次', stats.totalRootBatches, '源头起点批次'),
            this.card('leaf', '终端批次', stats.totalLeafBatches, '末端可验真批次'),
            this.card('event', '物流事件', stats.totalShipmentEvents, '运输流转事件数')
          ],
          distSections: [
            this.distSection('产地分布', '按省份统计链路内所有批次的来源分布。', stats.originDist, 'green', '暂无产地数据'),
            this.distSection('工艺分布', '按工艺类型统计当前加工接入情况。', stats.processTypeDist, 'warm', '暂无加工数据')
          ],
          tagSectionTitle: '监管标签',
          tagSectionCaption: '查看监管维度下的链路接入覆盖情况。',
          tagItems: this.integrityTags(stats, [
            ['原料建档', 'planting'],
            ['加工记录', 'processing'],
            ['质检放行', 'inspection'],
            ['链上存证', 'blockchain']
          ]),
          chainSectionTitle: '近期监管记录',
          chainSectionCaption: '查看最近一次完成存证的批次交易。',
          chainRecords: this.chainRecords(stats.recentBlockchainRecords),
          chainEmptyText: '暂无监管链上记录'
        }
      case 'ADMIN':
      default:
        return {
          dashboardTitle: '数据统计',
          dashboardDesc: '集中查看批次规模、环节分布、链路接入与链上存证情况。',
          summaryCards: [
            this.card('batch', '档案总批次', stats.totalBatches, '平台内全部批次'),
            this.card('qrcode', '防伪二维码', stats.totalTerminalQrcodes, '终端验真码数量'),
            this.card('processing', '加工记录', stats.totalProcessingRecords, '当前工序记录数')
          ],
          insightTitle: '全域速览',
          insightCaption: '围绕药材、源头、终端和物流运单独立统计。',
          insightCards: [
            this.card('herb', '药材种类', stats.totalHerbTypes, '当前药材品类数'),
            this.card('root', '源头批次', stats.totalRootBatches, '种植起点批次'),
            this.card('leaf', '终端批次', stats.totalLeafBatches, '末端流转成品'),
            this.card('shipment', '物流运单', stats.totalShipments, '平台发运单数量')
          ],
          distSections: [
            this.distSection('产地分布', '按省份统计平台批次的主要来源分布。', stats.originDist, 'green', '暂无产地数据'),
            this.distSection('工艺分布', '按工艺类型统计当前加工记录分布。', stats.processTypeDist, 'warm', '暂无加工数据')
          ],
          tagSectionTitle: '平台标签',
          tagSectionCaption: '查看平台各环节的当前接入覆盖情况。',
          tagItems: this.integrityTags(stats, [
            ['种植基地', 'planting'],
            ['生产加工', 'processing'],
            ['质量检测', 'inspection'],
            ['区块存证', 'blockchain']
          ]),
          chainSectionTitle: '近期链上记录',
          chainSectionCaption: '查看最近一次同步到链上的批次交易。',
          chainRecords: this.chainRecords(stats.recentBlockchainRecords),
          chainEmptyText: '暂无链上存证记录'
        }
    }
  },

  card(key, label, value, note) {
    return {
      key,
      label,
      value: String(Number(value || 0)),
      note
    }
  },

  distSection(title, caption, list, tone, emptyText) {
    return {
      title,
      caption,
      tone,
      emptyText,
      items: this.toPreviewBars(list, 6)
    }
  },

  integrityTags(stats, defs) {
    return defs.map(([name, key]) => ({
      name,
      value: String(this.resolveIntegrityValue(stats, key))
    }))
  },

  resolveIntegrityValue(stats, key) {
    if (key === 'shipmentEvents') return Number(stats.totalShipmentEvents || 0)
    if (key === 'terminalQr') return Number(stats.totalTerminalQrcodes || 0)
    return Number(stats.integrityStats?.[key] || 0)
  },

  chainRecords(list) {
    return (Array.isArray(list) ? list : []).slice(0, 6).map((item) => ({
      txHash: item.txHash,
      title: `批次 ${item.batchNo || '-'}`,
      note: `哈希 ${item.txShort || this.shortTx(item.txHash)}`,
      side: '已上链'
    }))
  },

  shortTx(tx) {
    const s = String(tx || '')
    if (!s) return '-'
    if (s.length <= 20) return s
    return `${s.slice(0, 10)}...${s.slice(-8)}`
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
  },

  normalizeDistByProvince(list) {
    const counter = (Array.isArray(list) ? list : []).reduce((acc, item) => {
      const name = this.normalizeProvince(item?.name) || '未标注'
      acc[name] = (acc[name] || 0) + Number(item?.value || 0)
      return acc
    }, {})
    return Object.entries(counter)
      .map(([name, value]) => ({ name, value: Number(value || 0) }))
      .sort((a, b) => b.value - a.value)
  },

  toPreviewBars(list, limit) {
    const items = (Array.isArray(list) ? list : []).slice(0, limit)
    const max = Math.max(1, ...items.map((item) => Number(item?.value || 0)))
    return items.map((item) => ({
      name: item.name,
      value: Number(item.value || 0),
      percent: Math.max(12, Math.round((Number(item.value || 0) / max) * 100))
    }))
  },

  onProfileClick() {
    wx.showActionSheet({
      itemList: ['切换账号', '取消'],
      success: (res) => {
        if (res.tapIndex === 0) {
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
