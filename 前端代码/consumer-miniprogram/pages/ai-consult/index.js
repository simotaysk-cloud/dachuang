Page({
  data: {
    messages: [],
    inputValue: '',
    scrollToId: '',
    isTyping: false,
    msgCounter: 0
  },

  sendMessage() {
    const text = this.data.inputValue.trim();
    if (!text) return;

    const newMsg = { id: ++this.data.msgCounter, role: 'user', text };
    this.setData({
      messages: this.data.messages.concat(newMsg),
      inputValue: '',
      scrollToId: `msg-${newMsg.id}`
    });

    this.setData({ isTyping: true });
    
    // Prepare the empty chat bubble placeholder for the AI's upcoming stream chunks
    const aiMsgId = ++this.data.msgCounter;
    this.setData({
      messages: this.data.messages.concat({ id: aiMsgId, role: 'ai', text: '', showProduct: false }),
      scrollToId: `msg-${aiMsgId}`
    });

    const that = this;
    const requestTask = wx.request({
      url: 'https://cpuzhbc.cn/api/v1/ai/chat/stream',
      method: 'POST',
      enableChunked: true,
      data: {
        messages: this.data.messages.map(m => ({ role: m.role, content: m.text })).slice(0, -1)
      },
      success(res) {
        that.setData({ isTyping: false });
      },
      fail(err) {
        that.setData({ isTyping: false });
        wx.showToast({ title: '服务连通性异常', icon: 'error' });
      }
    });

    // Create persistent decoder to handle multi-byte characters split between chunks
    const decoder = new TextDecoder('utf-8');

    requestTask.onChunkReceived((response) => {
      try {
        const textChunk = decoder.decode(response.data, { stream: true });
        if (!textChunk) return;

        const lines = textChunk.split('\n');
        let appended = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data:')) {
            const str = line.substring(5).trim();
            if (str === '[DONE]') continue;
            try {
              const obj = JSON.parse(str);
              if (obj.content) appended += obj.content;
            } catch (e) {
              // Partial JSON might happen if chunks are split inside the 'data: {...}' string
              console.warn('Partial JSON chunk ignored:', str);
            }
          }
        }

        if (appended) {
          const msgs = that.data.messages;
          const currentAiMsg = msgs[msgs.length - 1];
          currentAiMsg.text += appended;
          
          // Enhanced product card logic: trigger on more meaningful "business" keywords
          const keywords = ['黄连', '党参', '葛根', '配伍', '食疗', '镇坪', '道地', '失眠', '调理'];
          if (keywords.some(k => currentAiMsg.text.indexOf(k) > -1)) {
            currentAiMsg.showProduct = true;
          }

          that.setData({
            messages: msgs,
            scrollToId: `msg-${aiMsgId}`
          });
        }
      } catch (err) {
        console.error('SSE Stream Error', err);
      }
    });
  },

  mockPurchase() {
    wx.showToast({
      title: '已调起订单面板',
      icon: 'success'
    });
  }
});