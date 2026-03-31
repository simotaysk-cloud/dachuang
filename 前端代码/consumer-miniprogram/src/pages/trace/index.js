import { publicRequest } from '../../utils/api';

const MOCK_TCM = {
  nature: '微温',
  taste: '甘、微苦',
  meridian: '脾、肺、心、肾经',
  ingredients: [
    { name: '小檗碱', val: '7.8%' },
    { name: '黄连碱', val: '2.3%' }
  ],
  combinations: ['配黄芩：清热燥湿', '配木香：理气止痛'],
  env: { altitude: 2000, daylight: '2380h', pH: '6.2', rain: '720mm' }
};

const dictMap = {
  batchNo: '批次号',
  name: '药材名称',
  quantity: '数量',
  unit: '单位',
  origin: '原产区',
  productionDate: '生产日期',
  operation: '农事操作',
  operator: '操作员',
  details: '操作详情',
  latitude: '纬度',
  longitude: '经度',
  operationTime: '操作时间',
  processType: '加工类型',
  lineName: '数字产线',
  factory: '加工厂区',
  outputQuantity: '产出数量',
  outputUnit: '产出单位',
  checkItem: '受检项目',
  result: '检测结论',
  inspector: '质检专员',
  status: '运务状态',
  location: '当前位置',
  trackingNo: '物流单号',
  updateTime: '位置更新时间',
  createdAt: '链上记录时间',
  id: '上链流水号',
  updatedAt: '数据更新时间',
  fieldName: '关联地块',
  imageUrl: '现场图片',
  temperature: '环境温度',
  humidity: '环境湿度',
  soilMoisture: '土壤含水',
  soilPh: '土壤pH',
  lightIntensity: '光照强度',
  ownerUserId: '负责专员',
  minCode: '最小溯源码',
  category: '品类',
  description: '详细说明',
  usageAdvice: '医疗指南',
  contraindications: '特殊禁忌',
  commonPairings: '国鉴标准配伍',
  remainingQuantity: '剩余库存',
  gs1LotNo: 'GS1批号',
  gs1Code: 'GS1商品追踪码',
  gs1Locked: 'GS1锁定状态',
  reportUrl: '质检报告存证',
  eventTime: '流转报到时间',
  remarks: '备注',
  distributorName: '下级经销商',
  carrier: '承运供应商'
};

const orderedKeys = [
  'batchNo',
  'name',
  'category',
  'fieldName',
  'operation',
  'processType',
  'result',
  'status',
  'trackingNo',
  'location',
  'factory',
  'operator',
  'inspector',
  'details',
  'description',
  'usageAdvice',
  'contraindications',
  'commonPairings',
  'productionDate',
  'operationTime',
  'updateTime',
  'updatedAt',
  'createdAt',
  'imageUrl',
  'reportUrl'
];

Page({
  data: {
    batchNo: '',
    errorMsg: '',
    isDecrypting: true,
    decryptText: '正在建立可信连接...',
    decryptProgress: 0,
    showUI: false,
    baseBatch: {},
    tcmData: MOCK_TCM,
    txCount: 0,
    timeline: [],
    heroMetrics: [],
    batchFacts: [],
    ecoMetrics: [],
    showModal: false,
    modalTitle: '',
    modalIcon: '',
    modalKVs: []
  },

  onLoad(options) {
    this.setData({ batchNo: options.batchNo || 'HT20250815-ZJ001' });
    this.runDecryptionAnim();
  },

  runDecryptionAnim() {
    const steps = [
      { t: '正在连接可信节点...', w: 22 },
      { t: '正在校验批次签名...', w: 56 },
      { t: '正在解码链上档案...', w: 82 },
      { t: '档案已准备完成', w: 100 }
    ];
    let index = 0;
    const next = () => {
      if (index >= steps.length) {
        this.fetchRealTraceData();
        return;
      }
      this.setData({
        decryptText: steps[index].t,
        decryptProgress: steps[index].w
      });
      index += 1;
      setTimeout(next, 420 + Math.random() * 260);
    };
    next();
  },

  fetchRealTraceData() {
    const { batchNo } = this.data;
    publicRequest(`/api/v1/trace/${encodeURIComponent(batchNo)}`, 'GET')
      .then((res) => {
        if (res.code === 200 && res.data && res.data.batch) {
          this.formatRealData(res.data);
          return;
        }
        this.setData({ isDecrypting: false, errorMsg: '未查询到溯源档案' });
      })
      .catch((error) => {
        console.error(error);
        this.setData({ isDecrypting: false, errorMsg: '网络或区块链服务器校验异常' });
      });
  },

  formatTime(value) {
    return value ? String(value).replace('T', ' ') : '-';
  },

  buildHeroMetrics(batch, timeline, txCount) {
    const latestNode = timeline[timeline.length - 1] || {};
    return [
      {
        label: '链上记录',
        value: `${txCount} 条`,
        note: '已覆盖建档、加工、质检与物流'
      },
      {
        label: '最近更新',
        value: latestNode.date || this.formatTime(batch.updatedAt || batch.createdAt),
        note: latestNode.title || '暂无最新节点摘要'
      }
    ];
  },

  buildBatchFacts(batch) {
    return [
      { label: '品类', value: batch.category || '道地药材' },
      { label: '原产区', value: batch.origin || '-' },
      { label: '数量规格', value: batch.quantity ? `${batch.quantity} ${batch.unit || ''}` : '-' },
      { label: '生产日期', value: this.formatTime(batch.productionDate) },
      { label: '关联地块', value: batch.fieldName || '-' },
      { label: '建档时间', value: this.formatTime(batch.createdAt) }
    ];
  },

  buildEcoMetrics(tcmData) {
    return [
      { label: '山地海拔', value: `${tcmData.env.altitude} m` },
      { label: '年日照量', value: tcmData.env.daylight },
      { label: '土壤 pH', value: tcmData.env.pH },
      { label: '年降水量', value: tcmData.env.rain }
    ];
  },

  formatRealData(data) {
    const batch = data.batch || {};
    const viewBatch = {
      ...batch,
      productionDateText: batch.productionDate ? this.formatTime(batch.productionDate) : ''
    };
    const timeline = [];
    let txCount = 0;

    if (batch.batchNo) {
      timeline.push({
        title: '批次初始化',
        badge: '源头信息',
        date: this.formatTime(batch.createdAt),
        body: `批次编号: ${batch.batchNo}\n品种: ${batch.name || '-'}\n数量: ${batch.quantity || '-'} ${batch.unit || ''}`.trim(),
        icon: 'batch',
        raw: batch
      });
      txCount += 1;
    }

    (data.plantingRecords || []).forEach((record) => {
      timeline.push({
        title: '地块农事录入',
        badge: record.operation || '种植记录',
        date: this.formatTime(record.operationTime),
        body: `执行操作员: ${record.operator || '-'}\n细节: ${record.details || '-'}`,
        icon: 'planting',
        raw: record
      });
      txCount += 1;
    });

    (data.processingRecords || []).forEach((record) => {
      timeline.push({
        title: '工业化加工',
        badge: record.processType || '加工记录',
        date: this.formatTime(record.createdAt),
        body: `数字产线: ${record.lineName || '-'}\n加工厂: ${record.factory || '-'}`,
        icon: 'processing',
        raw: record
      });
      txCount += 1;
    });

    (data.inspectionRecords || []).forEach((record) => {
      timeline.push({
        title: '质量安检核定',
        badge: record.result || '检测完成',
        date: this.formatTime(record.createdAt),
        body: `检验员: ${record.inspector || '-'}\n项目核定完毕`,
        icon: 'inspection',
        raw: record
      });
      txCount += 1;
    });

    (data.logisticsRecords || []).forEach((record) => {
      timeline.push({
        title: '物流分发',
        badge: record.status || '物流更新',
        date: this.formatTime(record.updateTime),
        body: `中转站: ${record.location || '-'}\n凭证号: ${record.trackingNo || '-'}`,
        icon: 'logistics',
        raw: record
      });
      txCount += 1;
    });

    this.setData({
      isDecrypting: false,
      showUI: true,
      baseBatch: viewBatch,
      txCount,
      timeline,
      heroMetrics: this.buildHeroMetrics(viewBatch, timeline, txCount),
      batchFacts: this.buildBatchFacts(viewBatch),
      ecoMetrics: this.buildEcoMetrics(this.data.tcmData)
    });
  },

  openDetailModal(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.timeline[index];
    if (!item || !item.raw) return;

    const raw = item.raw;
    const rendered = new Set(['batchId', 'txHash']);
    const keyValues = [];

    const pushKey = (key) => {
      if (rendered.has(key) || raw[key] === null || raw[key] === undefined || raw[key] === '') return;
      rendered.add(key);

      let value = raw[key];
      let type = 'text';

      if (key.toLowerCase().includes('time') || key.toLowerCase().includes('date') || key === 'createdAt' || key === 'updatedAt') {
        value = this.formatTime(value);
      }

      if (String(value).startsWith('http') && (key.toLowerCase().includes('image') || key.toLowerCase().includes('pic'))) {
        type = 'img';
      } else if (String(value).startsWith('http') && key.toLowerCase().includes('url')) {
        type = 'link';
      }

      keyValues.push({
        label: dictMap[key] || key,
        val: String(value),
        type
      });
    };

    orderedKeys.forEach((key) => {
      if (raw[key] !== undefined) pushKey(key);
    });

    Object.keys(raw).forEach((key) => pushKey(key));

    this.setData({
      modalTitle: item.title,
      modalIcon: item.icon,
      modalKVs: keyValues,
      showModal: true
    });
  },

  closeModal() {
    this.setData({ showModal: false });
  },

  goConsult() {
    const app = getApp();
    const { batchNo, baseBatch, txCount, timeline } = this.data;
    const latestNode = timeline[timeline.length - 1] || {};
    app.globalData.aiConsultContext = {
      source: 'trace',
      batchNo,
      name: baseBatch.name || '',
      origin: baseBatch.origin || '',
      category: baseBatch.category || '',
      productionDate: baseBatch.productionDateText || '',
      recordCount: txCount,
      currentStatus: latestNode.badge || '',
      latestNodeTitle: latestNode.title || ''
    };

    wx.switchTab({
      url: '/pages/ai-consult/index'
    });
  },

  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    if (!url) return;
    wx.previewImage({
      urls: [url],
      current: url
    });
  },

  copyValue(e) {
    const { value } = e.currentTarget.dataset;
    if (!value) return;
    wx.setClipboardData({
      data: value,
      success: () => {
        wx.showToast({ title: '已复制链接', icon: 'success' });
      }
    });
  },

  noop() {},

  goBack() {
    wx.navigateBack({
      fail() {
        wx.switchTab({ url: '/pages/index/index' });
      }
    });
  }
});
