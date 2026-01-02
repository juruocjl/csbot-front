import apiClient from './client'

// 认证 API 接口
export const authAPI = {
  // 获取用户信息（需要 token）
  getInfo: () => {
    return apiClient.post('/api/auth/info')
  },

  // 初始化登录，获取 token 和验证码
  init: () => {
    return apiClient.post('/api/auth/init')
  },

}

// 通用 API 接口
export const commonAPI = {
  // 获取数据
  getData: (params) => {
    return apiClient.get('/api/data', { params })
  },

  // 提交数据
  postData: (data) => {
    return apiClient.post('/api/data', data)
  },

  // 获取比赛详情
  getMatchInfo: (matchId) => {
    return apiClient.post('/api/data/match_info', { match_id: matchId })
  }
}
