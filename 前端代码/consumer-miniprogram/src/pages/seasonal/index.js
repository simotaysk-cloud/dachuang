const seasonalItems = [
  {
    id: 'gan-cao',
    herb: '甘草',
    title: '甘草陈皮温润饮',
    tag: '节气·春养',
    season: '春末换季',
    scenario: '适合嗓子干、饮食偏重后想喝一杯清甜轻饮的人群。',
    image: '/assets/seasonal/season-gan-cao.jpg',
    excerpt: '甘草切片清甜温和，适合换季时搭配陈皮作日常轻饮。',
    effects: ['口感清甜，适合作为日常代茶饮基底', '搭配陈皮后香气更稳，适合饭后温饮', '适合展示药材切片纹理与原料可识别度'],
    usage: '取甘草 2-3 片、陈皮少量，以 85℃ 左右热水冲泡 5 分钟后温饮。',
    cautions: '养生参考不等同处方。孕期、慢病用药或长期饮用前，建议咨询医生或药师。'
  },
  {
    id: 'huang-qi',
    herb: '黄芪',
    title: '黄芪麦冬清补茶',
    tag: '饮片推荐',
    season: '立夏前后',
    scenario: '适合春夏交替、想要一杯清淡温润茶饮的日常场景。',
    image: '/assets/seasonal/season-huang-qi.jpg',
    excerpt: '黄芪片纹理饱满，适合在春夏交替时做清淡代茶饮。',
    effects: ['切片纤维清晰，便于观察饮片品质', '与麦冬搭配后口感更柔和', '适合轻补不厚重的日常茶饮表达'],
    usage: '取黄芪 3-5 片、麦冬少量，以热水冲泡或小火煮 8-10 分钟。',
    cautions: '发热、上火明显或正在接受治疗时不建议自行长期饮用。'
  },
  {
    id: 'ju-hua',
    herb: '菊花',
    title: '菊花枸杞清目茶',
    tag: '节气·新材',
    season: '伏案用眼后',
    scenario: '适合长时间看屏幕后，作为清香型温热茶饮。',
    image: '/assets/seasonal/season-ju-hua.jpg',
    excerpt: '干菊花花型完整、香气清浅，适合作为伏案后的温和茶饮。',
    effects: ['花型完整，冲泡后香气清雅', '搭配枸杞后颜色更温暖，口感更圆润', '适合办公室和晚间轻饮场景'],
    usage: '取菊花 4-6 朵、枸杞少量，以 90℃ 热水冲泡 3-5 分钟。',
    cautions: '脾胃虚寒或对菊科植物过敏者谨慎饮用。'
  }
];

Page({
  data: {
    mode: 'list',
    items: seasonalItems,
    detail: null
  },

  onLoad(options) {
    const id = options && options.id;
    if (id) {
      this.showDetail(decodeURIComponent(id));
      return;
    }
    wx.setNavigationBarTitle({ title: '时令养生' });
  },

  showDetail(id) {
    const detail = seasonalItems.find((item) => item.id === id) || seasonalItems[0];
    this.setData({
      mode: 'detail',
      detail
    });
    wx.setNavigationBarTitle({ title: detail.herb + '养单' });
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/seasonal/index?id=' + encodeURIComponent(id)
    });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: [url],
      current: url
    });
  }
});
