const DEFAULT_BASE_URL = 'http://localhost:8081'

Page({
  data: {
    baseUrl: DEFAULT_BASE_URL,
    healthStatus: '',
    loginCode: '',
    token: '',
    lastResult: '',

    batchForm: {
      id: '',
      batchNo: '',
      name: '',
      category: '',
      origin: '',
      status: '',
      description: ''
    },
    batchQueryNo: '',

    traceBatchNo: '',

    plantingForm: {
      id: '',
      batchNo: '',
      fieldName: '',
      operation: '',
      details: '',
      operator: ''
    },
    processingForm: {
      id: '',
      batchNo: '',
      processType: '',
      factory: '',
      details: '',
      operator: ''
    },
    logisticsForm: {
      id: '',
      batchNo: '',
      fromLocation: '',
      toLocation: '',
      status: '',
      trackingNo: ''
    },
    inspectionForm: {
      id: '',
      batchNo: '',
      result: '',
      reportUrl: '',
      inspector: ''
    },

    codeBatchNo: '',
    invisibleCode: '',

    blockchainBatchNo: '',
    blockchainData: ''
  },

  onLoad() {
    this.checkHealth()
  },

  setResult(data) {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    this.setData({ lastResult: text })
  },

  request(path, method = 'GET', data = undefined) {
    return new Promise((resolve, reject) => {
      const headers = { 'Content-Type': 'application/json' }
      if (this.data.token) {
        headers.Authorization = `Bearer ${this.data.token}`
      }
      wx.request({
        url: `${this.data.baseUrl}${path}`,
        method,
        data,
        header: headers,
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      })
    })
  },

  // Health
  async checkHealth() {
    try {
      const res = await this.request('/api/v1/health')
      this.setData({ healthStatus: res?.data?.status || 'UNKNOWN' })
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },

  // Auth
  onLoginCodeInput(e) {
    this.setData({ loginCode: e.detail.value })
  },
  async loginWithCode() {
    if (!this.data.loginCode) {
      wx.showToast({ title: '请输入 code', icon: 'none' })
      return
    }
    try {
      const res = await this.request('/api/v1/auth/wx-login', 'POST', { code: this.data.loginCode })
      this.setData({ token: res?.data?.token || '' })
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async loginWithWx() {
    wx.login({
      success: async (r) => {
        try {
          const res = await this.request('/api/v1/auth/wx-login', 'POST', { code: r.code })
          this.setData({ token: res?.data?.token || '' })
          this.setResult(res)
        } catch (err) {
          this.setResult(err)
        }
      }
    })
  },

  // Batch CRUD
  onBatchInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [`batchForm.${field}`]: e.detail.value })
  },
  onBatchQueryNoInput(e) {
    this.setData({ batchQueryNo: e.detail.value })
  },
  async createBatch() {
    try {
      const res = await this.request('/api/v1/batches', 'POST', this.data.batchForm)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async listBatches() {
    try {
      const res = await this.request('/api/v1/batches')
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async getBatchByNo() {
    if (!this.data.batchQueryNo) {
      wx.showToast({ title: '请输入 batchNo', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/batches/${this.data.batchQueryNo}`)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async updateBatch() {
    if (!this.data.batchForm.id) {
      wx.showToast({ title: '请输入批次ID', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/batches/${this.data.batchForm.id}`, 'PUT', this.data.batchForm)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async deleteBatch() {
    if (!this.data.batchForm.id) {
      wx.showToast({ title: '请输入批次ID', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/batches/${this.data.batchForm.id}`, 'DELETE')
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },

  // Trace
  onTraceBatchNoInput(e) {
    this.setData({ traceBatchNo: e.detail.value })
  },
  async queryTrace() {
    if (!this.data.traceBatchNo) {
      wx.showToast({ title: '请输入 batchNo', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/trace/${this.data.traceBatchNo}`)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },

  // Planting
  onPlantingInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [`plantingForm.${field}`]: e.detail.value })
  },
  async createPlanting() {
    try {
      const res = await this.request('/api/v1/planting', 'POST', this.data.plantingForm)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async listPlanting() {
    if (!this.data.plantingForm.batchNo) {
      wx.showToast({ title: '请输入 batchNo', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/planting?batchNo=${this.data.plantingForm.batchNo}`)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async updatePlanting() {
    if (!this.data.plantingForm.id) {
      wx.showToast({ title: '请输入记录ID', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/planting/${this.data.plantingForm.id}`, 'PUT', this.data.plantingForm)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async deletePlanting() {
    if (!this.data.plantingForm.id) {
      wx.showToast({ title: '请输入记录ID', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/planting/${this.data.plantingForm.id}`, 'DELETE')
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },

  // Processing
  onProcessingInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [`processingForm.${field}`]: e.detail.value })
  },
  async createProcessing() {
    try {
      const res = await this.request('/api/v1/processing', 'POST', this.data.processingForm)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async listProcessing() {
    if (!this.data.processingForm.batchNo) {
      wx.showToast({ title: '请输入 batchNo', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/processing?batchNo=${this.data.processingForm.batchNo}`)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async updateProcessing() {
    if (!this.data.processingForm.id) {
      wx.showToast({ title: '请输入记录ID', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/processing/${this.data.processingForm.id}`, 'PUT', this.data.processingForm)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async deleteProcessing() {
    if (!this.data.processingForm.id) {
      wx.showToast({ title: '请输入记录ID', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/processing/${this.data.processingForm.id}`, 'DELETE')
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },

  // Logistics
  onLogisticsInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [`logisticsForm.${field}`]: e.detail.value })
  },
  async createLogistics() {
    try {
      const res = await this.request('/api/v1/logistics', 'POST', this.data.logisticsForm)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async listLogistics() {
    if (!this.data.logisticsForm.batchNo) {
      wx.showToast({ title: '请输入 batchNo', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/logistics?batchNo=${this.data.logisticsForm.batchNo}`)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async updateLogistics() {
    if (!this.data.logisticsForm.id) {
      wx.showToast({ title: '请输入记录ID', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/logistics/${this.data.logisticsForm.id}`, 'PUT', this.data.logisticsForm)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async deleteLogistics() {
    if (!this.data.logisticsForm.id) {
      wx.showToast({ title: '请输入记录ID', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/logistics/${this.data.logisticsForm.id}`, 'DELETE')
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },

  // Inspection
  onInspectionInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [`inspectionForm.${field}`]: e.detail.value })
  },
  async createInspection() {
    try {
      const res = await this.request('/api/v1/inspection', 'POST', this.data.inspectionForm)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async listInspection() {
    if (!this.data.inspectionForm.batchNo) {
      wx.showToast({ title: '请输入 batchNo', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/inspection?batchNo=${this.data.inspectionForm.batchNo}`)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async updateInspection() {
    if (!this.data.inspectionForm.id) {
      wx.showToast({ title: '请输入记录ID', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/inspection/${this.data.inspectionForm.id}`, 'PUT', this.data.inspectionForm)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async deleteInspection() {
    if (!this.data.inspectionForm.id) {
      wx.showToast({ title: '请输入记录ID', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/inspection/${this.data.inspectionForm.id}`, 'DELETE')
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },

  // Code
  onCodeBatchNoInput(e) {
    this.setData({ codeBatchNo: e.detail.value })
  },
  onInvisibleCodeInput(e) {
    this.setData({ invisibleCode: e.detail.value })
  },
  async generateCode() {
    if (!this.data.codeBatchNo) {
      wx.showToast({ title: '请输入 batchNo', icon: 'none' })
      return
    }
    try {
      const res = await this.request('/api/v1/code/generate', 'POST', { batchNo: this.data.codeBatchNo })
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async verifyCode() {
    if (!this.data.invisibleCode) {
      wx.showToast({ title: '请输入隐形码', icon: 'none' })
      return
    }
    try {
      const res = await this.request('/api/v1/code/verify', 'POST', { invisibleCode: this.data.invisibleCode })
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },

  // Blockchain
  onBlockchainInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [field]: e.detail.value })
  },
  async recordBlockchain() {
    if (!this.data.blockchainBatchNo) {
      wx.showToast({ title: '请输入 batchNo', icon: 'none' })
      return
    }
    try {
      const res = await this.request('/api/v1/blockchain/record', 'POST', {
        batchNo: this.data.blockchainBatchNo,
        data: this.data.blockchainData || ''
      })
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  },
  async getBlockchain() {
    if (!this.data.blockchainBatchNo) {
      wx.showToast({ title: '请输入 batchNo', icon: 'none' })
      return
    }
    try {
      const res = await this.request(`/api/v1/blockchain/${this.data.blockchainBatchNo}`)
      this.setResult(res)
    } catch (err) {
      this.setResult(err)
    }
  }
})
