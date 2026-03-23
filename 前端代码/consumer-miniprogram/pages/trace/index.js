import { publicRequest } from '../../utils/api';

const MOCK_TCM = {
  nature: '微温', taste: '甘、微苦', meridian: '脾、肺、心、肾经',
  ingredients: [ { name: '小檗碱', val: '7.8%' }, { name: '黄连碱', val: '2.3%' } ],
  combinations: ['配黄芩：清热燥湿', '配木香：理气止痛'],
  env: { altitude: 2000, daylight: '2380h', pH: '6.2', rain: '720mm' }
};

const dictMap = {
  'batchNo': '批次号', 'name': '药材名称', 'quantity': '数量', 'unit': '单位', 'origin': '原产区', 
  'productionDate': '生产日期', 'operation': '农事操作', 'operator': '操作员', 'details': '操作详情', 
  'latitude': '纬度', 'longitude': '经度', 'operationTime': '操作时间', 'processType': '加工类型', 
  'lineName': '数字产线', 'factory': '加工厂区', 'outputQuantity': '产出数量', 'outputUnit': '产出单位',
  'checkItem': '受检项目', 'result': '检测结论', 'inspector': '质检专员', 'status': '运务状态', 
  'location': '当前位置', 'trackingNo': '物流单号', 'updateTime': '位置更新时间', 'createdAt': '链上记录时间', 
  'id': '上链流水号', 'updatedAt': '数据更新时间', 'fieldName': '关联地块', 'imageUrl': '现场图片', 
  'temperature': '环境温度', 'humidity': '环境湿度', 'soilMoisture': '土壤含水', 'soilPh': '土壤pH', 
  'lightIntensity': '光照强度', 'ownerUserId': '负责专员', 'minCode': '最小溯源码', 'category': '品类', 
  'description': '详细说明', 'usageAdvice': '医疗指南', 'contraindications': '特殊禁忌', 
  'commonPairings': '国鉴标准配伍', 'remainingQuantity': '剩余库存', 'gs1LotNo': 'GS1批号', 
  'gs1Code': 'GS1商品追踪码', 'gs1Locked': 'GS1锁定状态', 'reportUrl': '质检报告存证', 
  'eventTime': '流转报到时间', 'remarks': '备注', 'distributorName': '下级经销商', 'carrier': '承运供应商'
};

const orderedKeys = ['batchNo','name','category','fieldName','operation','processType','result','status','trackingNo','location','factory','operator','inspector','details','description','usageAdvice','contraindications','commonPairings','productionDate','operationTime','updateTime','updatedAt','createdAt','imageUrl','reportUrl'];

Page({
  data: {
    batchNo: '',
    errorMsg: '',
    
    // Decryption Anim
    isDecrypting: true,
    decryptText: 'INITIATING DECRYPTION PROTOCOL...',
    decryptProgress: 0,
    showUI: false,
    
    // UI Data
    baseBatch: {},
    tcmData: MOCK_TCM,
    txCount: 0,
    timeline: [],
    
    // Modal
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
        { t: 'CONNECTING SECURE NODE...', w: 20 },
        { t: 'VALIDATING SHA-256 SIGNATURE...', w: 60 },
        { t: 'DECODING CHAIN PAYLOAD...', w: 85 },
        { t: 'ACCESS GRANTED.', w: 100 }
    ];
    let i = 0;
    const next = () => {
      if(i >= steps.length) {
        this.fetchRealTraceData(); // trigger fetch once fake anim ends
        return;
      }
      this.setData({ decryptText: steps[i].t, decryptProgress: steps[i].w });
      i++;
      setTimeout(next, 400 + Math.random() * 300);
    };
    next();
  },

  fetchRealTraceData() {
    const bno = this.data.batchNo;
    publicRequest(`/api/v1/trace/${encodeURIComponent(bno)}`, 'GET')
      .then(res => {
        if (res.code === 200 && res.data && res.data.batch) {
          this.formatRealData(res.data);
        } else {
          this.setData({ isDecrypting: false, errorMsg: '未查询到溯源档案' });
        }
      })
      .catch(err => {
        console.error(err);
        this.setData({ isDecrypting: false, errorMsg: '网络或区块链服务器校验异常' });
      });
  },

  formatTime(v) { return v ? String(v).replace('T', ' ') : '-'; },

  formatRealData(data) {
    const b = data.batch || {};
    let txCount = 0;
    let tl = [];

    if(b.batchNo) {
      tl.push({ title: '批次初始化', badge: '源头信息', date: this.formatTime(b.createdAt), body: `批次编号: ${b.batchNo}\n品种: ${b.name||'-'}\n数量: ${b.quantity} ${b.unit||'-'}`, icon: '📦', raw: b });
      txCount++;
    }

    const pList = data.plantingRecords || [];
    pList.forEach(r => { tl.push({ title: '地块农事录入', badge: r.operation, date: this.formatTime(r.operationTime), body: `执行操作员: ${r.operator||'-'}\n细节: ${r.details||'-'}`, icon: '🌱', raw: r }); txCount++; });

    const procList = data.processingRecords || [];
    procList.forEach(r => { tl.push({ title: '工业化加工', badge: r.processType, date: this.formatTime(r.createdAt), body: `数字产线: ${r.lineName||'-'}\n加工厂: ${r.factory||'-'}`, icon: '🏭', raw: r }); txCount++; });

    const inspList = data.inspectionRecords || [];
    inspList.forEach(r => { tl.push({ title: '质量安检核定', badge: r.result, date: this.formatTime(r.createdAt), body: `检验员: ${r.inspector||'-'}\n项目核定完毕`, icon: '🔬', raw: r }); txCount++; });

    const logList = data.logisticsRecords || [];
    logList.forEach(r => { tl.push({ title: '物流分发', badge: r.status, date: this.formatTime(r.updateTime), body: `中转站: ${r.location||'-'}\n凭证号: ${r.trackingNo||'-'}`, icon: '🚚', raw: r }); txCount++; });

    this.setData({
      isDecrypting: false,
      showUI: true,
      baseBatch: b,
      txCount,
      timeline: tl
    });
  },

  openDetailModal(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.timeline[idx];
    if(!item || !item.raw) return;

    const raw = item.raw;
    let kvs = [];
    let _rendered = new Set(['batchId', 'txHash']);

    const pushKey = (k) => {
      if(_rendered.has(k) || raw[k] === null || raw[k] === undefined || raw[k] === '') return;
      _rendered.add(k);
      let val = raw[k];
      let type = 'text';
      if(k.toLowerCase().includes('time') || k.toLowerCase().includes('date') || k==='createdAt' || k==='updatedAt') {
        val = this.formatTime(val);
      }
      if(String(val).startsWith('http') && (k.toLowerCase().includes('image') || k.toLowerCase().includes('pic'))) type = 'img';
      if(String(val).startsWith('http') && k.toLowerCase().includes('url') && type === 'text') type = 'link';
      kvs.push({ label: dictMap[k] || k, val: String(val), type });
    };

    orderedKeys.forEach(k => { if(raw[k] !== undefined) pushKey(k); });
    for(let k in raw) pushKey(k);

    this.setData({
      modalTitle: item.title,
      modalIcon: item.icon,
      modalKVs: kvs,
      showModal: true
    });
  },

  closeModal() {
    this.setData({ showModal: false });
  },

  goBack() {
    wx.navigateBack({ fail() { wx.switchTab({ url: '/pages/index/index' }); } });
  }
});