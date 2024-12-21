class BaiduTranslateService {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = null;
  }

  async getAccessToken() {
    const url = `https://aip.baidubce.com/oauth/2.0/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify("")
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('获取access token失败:', error);
      return null;
    }
  }

  async translateImage(imageUrl, fromLang = 'zh', toLang = 'en') {
    try {
      // 如果没有access token，先获取
      if (!this.accessToken) {
        const token = await this.getAccessToken();
        if (!token) {
          return null;
        }
      }

      // API请求URL
      const url = `https://aip.baidubce.com/file/2.0/mt/pictrans/v1?access_token=${this.accessToken}`;

      // 获取图片内容
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.error(`获取图片失败: ${imageResponse.status}`);
        return null;
      }
      const imageBlob = await imageResponse.blob();

      // 创建FormData对象
      const formData = new FormData();
      formData.append('image', imageBlob, 'image.jpg');
      formData.append('from', fromLang);
      formData.append('to', toLang);
      formData.append('v', '3');
      formData.append('paste', '1');

      // 发送翻译请求
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.error(`翻译请求失败: ${response.status}`);
        return null;
      }

      const result = await response.json();

      // 检查返回数据的结构
      if (!result.data || !result.data.pasteImg) {
        console.error('翻译结果格式错误');
        return null;
      }

      // 返回完整的data:image/png;base64格式的图片
      return `data:image/png;base64,${result.data.pasteImg}`;

    } catch (error) {
      console.error('翻译请求失败:', error);
      return null;
    }
  }
}

export default BaiduTranslateService; 