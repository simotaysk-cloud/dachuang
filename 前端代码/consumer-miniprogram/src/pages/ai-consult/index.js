import { publicRequest } from '../../utils/api';

Page({
  data: {
    messages: [],
    inputValue: '',
    scrollToId: '',
    isTyping: false,
    msgCounter: 0,
    traceContext: null,
    quickPrompts: [
      { text: '最近熬夜多，口干上火怎么调理？' },
      { text: '春季适合看哪些本草推荐？' },
      { text: '黄连和麦冬能一起看吗？' }
    ]
  },

  formatMessageText(text, role = 'ai') {
    if (!text) return '';
    if (role !== 'ai') return text;

    return text
      .replace(/\r\n/g, '\n')
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^\s*[-*]\s+/gm, '• ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.hydrateTraceContext();
  },

  hydrateTraceContext() {
    const app = getApp();
    const context = app.globalData.aiConsultContext;
    if (!context || !context.batchNo) return;

    if (this.data.traceContext && this.data.traceContext.batchNo === context.batchNo) {
      return;
    }

    this.setData({
      traceContext: context,
      quickPrompts: [
        { text: `这味${context.name || '药材'}适合什么体质？` },
        { text: `${context.name || '这味药'}和什么搭配更合适？` },
        { text: `基于批次${context.batchNo}，有哪些食养建议？` }
      ]
    });

    publicRequest(`/api/v1/trace/${encodeURIComponent(context.batchNo)}`, 'GET')
      .then((res) => {
        if (!(res.code === 200 && res.data && res.data.batch)) return;
        const batch = res.data.batch || {};
        const latestLogistics = (res.data.logisticsRecords || []).slice(-1)[0] || {};
        const merged = {
          ...context,
          name: batch.name || context.name || '',
          origin: batch.origin || context.origin || '',
          category: batch.category || context.category || '',
          productionDate: batch.productionDate || context.productionDate || '',
          currentStatus: latestLogistics.status || context.currentStatus || '',
          latestNodeTitle: latestLogistics.location || context.latestNodeTitle || ''
        };
        this.setData({ traceContext: merged });
        app.globalData.aiConsultContext = merged;
      })
      .catch(() => {});
  },

  handleInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  applyPrompt(e) {
    this.setData({ inputValue: e.currentTarget.dataset.text });
  },

  sendMessage() {
    const app = getApp();
    if (!app.globalData.userInfo) {
      wx.showModal({
        title: '需要安全登录',
        content: '智问功能仅对实名认证用户开放，是否前往“我的”页面进行演示登录？',
        confirmText: '前往登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/user/index' });
          }
        }
      });
      return;
    }

    const text = this.data.inputValue.trim();
    if (!text) return;

    const userMsg = {
      id: this.data.msgCounter + 1,
      role: 'user',
      text,
      displayText: this.formatMessageText(text, 'user')
    };
    const aiMsgId = this.data.msgCounter + 2;
    const nextMessages = this.data.messages.concat(userMsg, {
      id: aiMsgId,
      role: 'ai',
      text: '',
      displayText: '',
      showProduct: false
    });

    this.setData({
      messages: nextMessages,
      inputValue: '',
      scrollToId: 'chat-bottom-anchor',
      isTyping: true,
      msgCounter: aiMsgId
    });

    const requestTask = wx.request({
      url: 'https://cpuzhbc.cn/api/v1/ai/chat/stream',
      method: 'POST',
      enableChunked: true,
      header: {
        'Authorization': `Bearer ${app.globalData.authToken || ''}`,
        'Content-Type': 'application/json'
      },
      data: {
        sessionSource: this.data.traceContext ? 'trace' : 'general',
        traceContext: this.data.traceContext,
        messages: nextMessages
          .filter(item => !(item.role === 'ai' && item.id === aiMsgId))
          .map(item => ({ role: item.role, content: item.text }))
      },
      success: (res) => {
        this.setData({ isTyping: false });
        console.log('Request complete', res);
      },
      fail: (err) => {
        this.setData({ isTyping: false });
        console.error('Request failed', err);
        wx.showToast({ title: 'AI连通失败', icon: 'none' });
      }
    });

    requestTask.onChunkReceived((response) => {
      try {
        // 小程序中没有 TextDecoder，使用以下方式兼容并尝试解析
        const uint8Array = new Uint8Array(response.data);
        // 尝试用 decodeURIComponent(escape()) 进行快速 UTF8 转换，如果失败则回退
        let textChunk = '';
        try {
          textChunk = decodeURIComponent(escape(String.fromCharCode.apply(null, uint8Array)));
        } catch (e) {
          // 对二进制分卷不完整的情况做基础容错，后续通过 chunk 拼接逐步解析
          textChunk = String.fromCharCode.apply(null, uint8Array);
        }

        if (!textChunk) return;

        const lines = textChunk.split('\n');
        let appended = '';

        lines.forEach((line) => {
          const safeLine = line.trim();
          if (!safeLine.startsWith('data:')) return;
          const payload = safeLine.substring(5).trim();
          if (payload === '[DONE]') {
            this.setData({ isTyping: false });
            return;
          }
          try {
            const obj = JSON.parse(payload);
            if (obj.content) appended += obj.content;
          } catch (error) {
            // 忽略非 JSON 或者是分卷导致的 JSON 截断
          }
        });

        if (!appended) return;

        const messages = this.data.messages.slice();
        const target = messages[messages.length - 1];
        target.text += appended;
        target.displayText = this.formatMessageText(target.text, target.role);

        const keywords = ['黄连', '党参', '葛根', '配伍', '食疗', '镇坪', '调理', '建议'];
        if (keywords.some(keyword => target.text.indexOf(keyword) > -1)) {
          target.showProduct = true;
        }

        this.setData({
          messages,
          scrollToId: 'chat-bottom-anchor'
        });
      } catch (error) {
        console.error('SSE Stream Error', error);
      }
    });
  },

  clearConversation() {
    this.setData({
      messages: [],
      msgCounter: 0,
      isTyping: false,
      scrollToId: 'msg-intro'
    });
  },

  mockPurchase() {
    wx.showToast({
      title: '已打开问药清单',
      icon: 'success'
    });
  }
});
