const api = require('../../utils/api')
const { guardFeatureAccess } = require('../../utils/rbac')

const FILTER_OPTIONS = ['全部', '批次', '种植', '加工', '质检', '物流']

function toMillis(value) {
  if (!value) return 0
  if (Array.isArray(value)) {
    const [y, m, d, hh, mm, ss] = value
    const dt = new Date(y || 1970, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0)
    return dt.getTime()
  }
  if (typeof value === 'number') return value
  const str = String(value).replace(' ', 'T')
  const t = Date.parse(str)
  return Number.isNaN(t) ? 0 : t
}

function formatTime(value) {
  const ms = toMillis(value)
  if (!ms) return '-'
  const d = new Date(ms)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

Page({
  data: {
    loading: false,
    refreshing: false,
    allLogs: [],
    logs: [],
    keyword: '',
    filterIndex: 0,
    filterOptions: FILTER_OPTIONS,
    stats: {
      total: 0,
      batch: 0,
      planting: 0,
      processing: 0,
      inspection: 0,
      logistics: 0
    },
    lastSyncAt: '-',
    detailVisible: false,
    detailText: ''
  },

  onLoad() {
    if (!guardFeatureAccess(api.role, 'LOGS')) return
    this.reload()
  },

  onPullDownRefresh() {
    this.reload({ pullDown: true })
  },

  async fetchList(path) {
    try {
      const res = await api.request(path, 'GET', undefined, { quiet: true })
      return Array.isArray(res?.data) ? res.data : []
    } catch (e) {
      return []
    }
  },

  buildBatchLogs(rows) {
    return rows.map((item) => {
      const created = toMillis(item.createdAt)
      const updated = toMillis(item.updatedAt)
      const isCreate = created && updated && created === updated
      const action = isCreate ? '创建批次' : '更新批次'
      const title = `${action} ${item.batchNo || ''}`.trim()
      return {
        id: `batch-${item.id || Math.random()}`,
        module: 'BATCH',
        moduleLabel: '批次',
        action,
        title,
        batchNo: item.batchNo || '-',
        operator: '-',
        time: item.updatedAt || item.createdAt,
        timeText: formatTime(item.updatedAt || item.createdAt),
        detail: `名称：${item.name || '-'}\n状态：${item.status || '-'}\n产地：${item.origin || '-'}\n数量：${item.quantity || '-'} ${item.unit || ''}`.trim(),
        keywords: `${item.batchNo || ''} ${item.name || ''} ${item.origin || ''} ${item.status || ''}`.toLowerCase()
      }
    })
  },

  buildPlantingLogs(rows) {
    return rows.map((item) => ({
      id: `planting-${item.id || Math.random()}`,
      module: 'PLANTING',
      moduleLabel: '种植',
      action: item.operation || '农事操作',
      title: `${item.operation || '农事操作'} ${item.batchNo || ''}`.trim(),
      batchNo: item.batchNo || '-',
      operator: item.operator || '-',
      time: item.operationTime || item.updatedAt || item.createdAt,
      timeText: formatTime(item.operationTime || item.updatedAt || item.createdAt),
      detail: `地块：${item.fieldName || '-'}\n详情：${item.details || '-'}\n坐标：${item.latitude || '-'}, ${item.longitude || '-'}`,
      keywords: `${item.batchNo || ''} ${item.operation || ''} ${item.operator || ''} ${item.fieldName || ''} ${item.details || ''}`.toLowerCase()
    }))
  },

  buildProcessingLogs(rows) {
    return rows.map((item) => ({
      id: `processing-${item.id || Math.random()}`,
      module: 'PROCESSING',
      moduleLabel: '加工',
      action: item.processType || '加工处理',
      title: `${item.processType || '加工处理'} ${item.batchNo || ''}`.trim(),
      batchNo: item.batchNo || '-',
      operator: item.operator || '-',
      time: item.updatedAt || item.createdAt,
      timeText: formatTime(item.updatedAt || item.createdAt),
      detail: `上游批次：${item.parentBatchNo || '-'}\n生产线：${item.lineName || '-'}\n工厂：${item.factory || '-'}\n详情：${item.details || '-'}`,
      keywords: `${item.batchNo || ''} ${item.parentBatchNo || ''} ${item.processType || ''} ${item.operator || ''} ${item.lineName || ''} ${item.factory || ''}`.toLowerCase()
    }))
  },

  buildInspectionLogs(rows) {
    return rows.map((item) => ({
      id: `inspection-${item.id || Math.random()}`,
      module: 'INSPECTION',
      moduleLabel: '质检',
      action: '质检记录',
      title: `质检 ${item.batchNo || ''}`.trim(),
      batchNo: item.batchNo || '-',
      operator: item.inspector || '-',
      time: item.updatedAt || item.createdAt,
      timeText: formatTime(item.updatedAt || item.createdAt),
      detail: `结果：${item.result || '-'}\n质检员：${item.inspector || '-'}\n报告：${item.reportUrl || '-'}`,
      keywords: `${item.batchNo || ''} ${item.result || ''} ${item.inspector || ''}`.toLowerCase()
    }))
  },

  buildShipmentLogs(shipments) {
    return shipments.map((item) => ({
      id: `shipment-${item.id || Math.random()}`,
      module: 'LOGISTICS',
      moduleLabel: '物流',
      action: '创建物流单',
      title: `物流单 ${item.shipmentNo || ''}`.trim(),
      batchNo: '-',
      operator: '-',
      time: item.updatedAt || item.createdAt,
      timeText: formatTime(item.updatedAt || item.createdAt),
      detail: `单号：${item.shipmentNo || '-'}\n承运商：${item.carrier || '-'}\n收货方：${item.distributorName || '-'}\n状态：${item.status || '-'}\n追踪号：${item.trackingNo || '-'}`,
      keywords: `${item.shipmentNo || ''} ${item.carrier || ''} ${item.distributorName || ''} ${item.status || ''} ${item.trackingNo || ''}`.toLowerCase()
    }))
  },

  buildShipmentEventLogs(eventsByShipment) {
    const rows = []
    Object.keys(eventsByShipment).forEach((shipmentNo) => {
      const events = eventsByShipment[shipmentNo] || []
      events.forEach((item) => {
        rows.push({
          id: `shipment-event-${shipmentNo}-${item.id || Math.random()}`,
          module: 'LOGISTICS',
          moduleLabel: '物流',
          action: item.status || '物流更新',
          title: `轨迹 ${shipmentNo}`,
          batchNo: '-',
          operator: '-',
          time: item.eventTime || item.updatedAt || item.createdAt,
          timeText: formatTime(item.eventTime || item.updatedAt || item.createdAt),
          detail: `物流单：${shipmentNo}\n位置：${item.location || '-'}\n状态：${item.status || '-'}\n详情：${item.details || '-'}`,
          keywords: `${shipmentNo} ${item.location || ''} ${item.status || ''} ${item.details || ''}`.toLowerCase()
        })
      })
    })
    return rows
  },

  buildStats(list) {
    const stats = {
      total: list.length,
      batch: 0,
      planting: 0,
      processing: 0,
      inspection: 0,
      logistics: 0
    }
    list.forEach((item) => {
      if (item.module === 'BATCH') stats.batch += 1
      if (item.module === 'PLANTING') stats.planting += 1
      if (item.module === 'PROCESSING') stats.processing += 1
      if (item.module === 'INSPECTION') stats.inspection += 1
      if (item.module === 'LOGISTICS') stats.logistics += 1
    })
    return stats
  },

  applyFilters() {
    const keyword = String(this.data.keyword || '').trim().toLowerCase()
    const filter = this.data.filterOptions[this.data.filterIndex] || '全部'

    const next = (this.data.allLogs || []).filter((item) => {
      const moduleOk = filter === '全部' || item.moduleLabel === filter
      const keywordOk = !keyword || (item.keywords || '').includes(keyword) || String(item.batchNo || '').toLowerCase().includes(keyword)
      return moduleOk && keywordOk
    })

    this.setData({ logs: next })
  },

  async reload(options = {}) {
    const isPullDown = !!options.pullDown
    this.setData({ loading: !isPullDown, refreshing: isPullDown })

    try {
      const [batches, planting, processing, inspection, shipments] = await Promise.all([
        this.fetchList('/api/v1/batches?rootOnly=false'),
        this.fetchList('/api/v1/planting'),
        this.fetchList('/api/v1/processing'),
        this.fetchList('/api/v1/inspection'),
        this.fetchList('/api/v1/shipments')
      ])

      const shipmentNos = shipments.map((s) => s && s.shipmentNo).filter(Boolean)
      const eventResponses = await Promise.all(
        shipmentNos.map((shipmentNo) => this.fetchList(`/api/v1/shipments/${encodeURIComponent(shipmentNo)}/events`))
      )
      const eventsByShipment = {}
      shipmentNos.forEach((shipmentNo, idx) => {
        eventsByShipment[shipmentNo] = eventResponses[idx] || []
      })

      const all = []
      all.push(...this.buildBatchLogs(batches))
      all.push(...this.buildPlantingLogs(planting))
      all.push(...this.buildProcessingLogs(processing))
      all.push(...this.buildInspectionLogs(inspection))
      all.push(...this.buildShipmentLogs(shipments))
      all.push(...this.buildShipmentEventLogs(eventsByShipment))

      all.sort((a, b) => toMillis(b.time) - toMillis(a.time))

      this.setData({
        allLogs: all,
        stats: this.buildStats(all),
        lastSyncAt: formatTime(new Date())
      })
      this.applyFilters()
    } finally {
      this.setData({ loading: false, refreshing: false })
      if (isPullDown) wx.stopPullDownRefresh()
    }
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value || '' })
  },

  search() {
    this.applyFilters()
  },

  clearSearch() {
    this.setData({ keyword: '' })
    this.applyFilters()
  },

  onFilterChange(e) {
    const idx = Number(e.detail.value || 0)
    this.setData({ filterIndex: Number.isNaN(idx) ? 0 : idx })
    this.applyFilters()
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id
    const item = (this.data.logs || []).find((x) => x.id === id)
    if (!item) return
    const text = [
      `模块：${item.moduleLabel || '-'}`,
      `动作：${item.action || '-'}`,
      `时间：${item.timeText || '-'}`,
      `批次：${item.batchNo || '-'}`,
      `操作人：${item.operator || '-'}`,
      '',
      item.detail || '-'
    ].join('\n')
    this.setData({ detailVisible: true, detailText: text })
  },

  noop() {},

  closeDetail() {
    this.setData({ detailVisible: false, detailText: '' })
  }
})
