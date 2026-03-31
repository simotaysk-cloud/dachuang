const BASE_URL = 'https://cpuzhbc.cn';
    
export const publicRequest = (url, method, data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method: method,
      data: data,
      success: res => resolve(res.data),
      fail: err => reject(err)
    });
  });
};
