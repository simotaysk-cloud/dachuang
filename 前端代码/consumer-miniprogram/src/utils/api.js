const BASE_URL = 'https://cpuzhbc.cn';

export const publicRequest = (url, method, data) => {
  const app = getApp();
  const token = app ? app.globalData.authToken : '';

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method: method,
      data: data,
      header: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      success: res => resolve(res.data),
      fail: err => reject(err)
    });
  });
};
