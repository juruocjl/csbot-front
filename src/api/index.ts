import apiClient, { fetchAllMatchHistory } from './client'
import * as schemas from './schemas'

// 使用Zod生成的类型（从schemas.ts导出）
export type AuthData = schemas.AuthData
export type VerifyTokenResponse = schemas.VerifyTokenResponse
export type InfoNameResponse = schemas.InfoNameResponse
export type InfoSteamIdResponse = schemas.InfoSteamIdResponse
export type InfoQQResponse = schemas.InfoQQResponse
export type UserInfo = schemas.UserInfo
export type SendAuthResponse = schemas.SendAuthResponse

// 比赛相关
export type Player = schemas.Player
export type MatchData = schemas.MatchData
export type MatchGPPlayerInfo = schemas.MatchGPPlayerInfo
export type MatchGPInfo = schemas.MatchGPInfo

// 历史记录相关
export type HistoryMatch = schemas.HistoryMatch
export type MatchHistoryResponse = schemas.MatchHistoryResponse
export type HistoryGPMatch = schemas.HistoryGPMatch
export type MatchGPHistoryResponse = schemas.MatchGPHistoryResponse
export type AllMatchHistoryItem = schemas.AllMatchHistoryItem
export type AllMatchHistoryResponse = schemas.AllMatchHistoryResponse

// 玩家相关
export type PlayerUpdate = schemas.PlayerUpdate
export type PlayerBase = schemas.PlayerBase
export type PlayerDetailItem = schemas.PlayerDetailItem
export type BaseRatingDetail = schemas.BaseRatingDetail
export type FirePowerDetail = schemas.FirePowerDetail
export type MarksmanshipDetail = schemas.MarksmanshipDetail
export type FollowUpShotDetail = schemas.FollowUpShotDetail
export type FirstBloodDetail = schemas.FirstBloodDetail
export type ItemDetail = schemas.ItemDetail
export type ClutchDetail = schemas.ClutchDetail
export type SniperDetail = schemas.SniperDetail
export type LadderItem = schemas.LadderItem
export type PlayerDetailResponse = schemas.PlayerDetailResponse

// 配置相关
export type TimeResponse = schemas.TimeResponse
export type RankConfigItem = schemas.RankConfigItem
export type RankConfigResponse = schemas.RankConfigResponse

// 用户相关
export type UserQQItem = schemas.UserQQItem
export type UserResponse = schemas.UserResponse

// 排名相关
export type RankItem = schemas.RankItem
export type RankResponse = schemas.RankResponse

// 状态相关
export type StatusResponse = schemas.StatusResponse
export type SteamStatusItem = schemas.SteamStatusItem
export type SteamStatusResponse = schemas.SteamStatusResponse

// AI 相关
export type AIRecordIdsResponse = schemas.AIRecordIdsResponse
export type AiRecordResponse = schemas.AiRecordResponse

export interface RankQueryParams {
  rankName: string
  timeType: string
}

// 认证 API 接口
export const authAPI = {
  // 验证 Token 是否有效
  verify: async (): Promise<VerifyTokenResponse> => {
    const response = await apiClient.post('/api/auth/verify')
    return schemas.VerifyTokenResponseSchema.parse(response)
  },

  // 获取用户显示名称
  getInfoName: async (): Promise<InfoNameResponse> => {
    const response = await apiClient.post('/api/auth/info/name')
    return schemas.InfoNameResponseSchema.parse(response)
  },

  // 获取用户绑定的 Steam ID
  getInfoSteamId: async (): Promise<InfoSteamIdResponse> => {
    const response = await apiClient.post('/api/auth/info/steamid')
    return schemas.InfoSteamIdResponseSchema.parse(response)
  },

  // 获取用户绑定的 QQ 号
  getInfoQQ: async (): Promise<InfoQQResponse> => {
    const response = await apiClient.post('/api/auth/info/qq')
    return schemas.InfoQQResponseSchema.parse(response)
  },

  // 初始化登录，获取 token 和验证码
  init: async (): Promise<AuthData> => {
    const response = await apiClient.post('/api/auth/init')
    return schemas.AuthDataSchema.parse(response)
  },

  // 发送当前页面到群聊
  send: async (path: string): Promise<SendAuthResponse> => {
    const response = await apiClient.post('/api/auth/send', { path })
    return schemas.SendAuthResponseSchema.parse(response)
  },
}

// 通用 API 接口
export const commonAPI = {
  // 获取比赛详情
  getMatchInfo: async (matchId: string): Promise<MatchData> => {
    const response = await apiClient.post('/api/match/info', { matchId: matchId })
    return schemas.MatchDataSchema.parse(response)
  },

  // 获取官匹比赛详情
  getMatchGPInfo: async (matchId: string): Promise<MatchGPInfo> => {
    const response = await apiClient.post('/api/match/infogp', { matchId: matchId })
    return schemas.MatchGPInfoSchema.parse(response)
  },

  // 获取比赛历史记录
  getMatchHistory: async (params: { steamId: string; timeType: string; page: number }): Promise<MatchHistoryResponse> => {
    const response = await apiClient.post('/api/match/history', params)
    return schemas.MatchHistoryResponseSchema.parse(response)
  },

  // 获取官匹比赛历史记录
  getMatchGPHistory: async (params: { steamId: string; timeType: string; page: number }): Promise<MatchGPHistoryResponse> => {
    const response = await apiClient.post('/api/match/historygp', params)
    return schemas.MatchGPHistoryResponseSchema.parse(response)
  },

  getAllMatchHistory: async (params: { page: number }): Promise<AllMatchHistoryResponse> => {
    const response = await fetchAllMatchHistory(params)
    return schemas.AllMatchHistoryResponseSchema.parse(response)
  },

  // 更新玩家数据
  updatePlayerData: async (steamId: string): Promise<PlayerUpdate> => {
    const response = await apiClient.post('/api/player/update', { steamId: steamId })
    return schemas.PlayerUpdateSchema.parse(response)
  },

  // 获取玩家基础信息
  getPlayerBase: async (steamId: string): Promise<PlayerBase> => {
    const response = await apiClient.post('/api/player/base', { steamId: steamId })
    return schemas.PlayerBaseSchema.parse(response)
  },

  // 获取玩家详细信息
  getPlayerDetail: async (steamId: string): Promise<PlayerDetailResponse> => {
    const response = await apiClient.post('/api/player/detail', { steamId: steamId })
    return schemas.PlayerDetailResponseSchema.parse(response)
  }
}

// 配置 API 接口
export const configAPI = {
  // 获取支持的时间范围类型
  getTimeTypes: async (): Promise<TimeResponse> => {
    const response = await apiClient.post('/api/config/time')
    return schemas.TimeResponseSchema.parse(response)
  },

  // 获取排名配置
  getRankConfig: async (): Promise<RankConfigResponse> => {
    const response = await apiClient.post('/api/config/rank')
    return schemas.RankConfigResponseSchema.parse(response)
  },

  // 获取绑定用户列表
  getUsers: async (): Promise<UserResponse> => {
    const response = await apiClient.post('/api/config/users')
    return schemas.UserResponseSchema.parse(response)
  }
}

// 排名 API 接口
export const rankAPI = {
  // 获取排名列表
  getRankList: async (params: { rankName: string; timeType: string }): Promise<RankResponse> => {
    const response = await apiClient.post('/api/rank', params)
    return schemas.RankResponseSchema.parse(response)
  }
}

// 系统状态 API 接口
export const systemAPI = {
  // 获取服务器状态
  getStatus: async (): Promise<StatusResponse> => {
    const response = await apiClient.post('/api/status')
    return schemas.StatusResponseSchema.parse(response)
  },

  // 获取 Steam 在线状态
  getSteamStatus: async (): Promise<SteamStatusResponse> => {
    const response = await apiClient.post('/api/steam/status')
    return schemas.SteamStatusResponseSchema.parse(response)
  }
}

// AI API 接口
export const aiAPI = {
  // 获取AI聊天记录编号列表
  getRecordIds: async (chatId: string): Promise<AIRecordIdsResponse> => {
    const response = await apiClient.post('/api/ai/recordids', { chatId })
    return schemas.AIRecordIdsResponseSchema.parse(response)
  },

  // 获取AI聊天记录内容
  getRecord: async (recordId: number): Promise<AiRecordResponse> => {
    const response = await apiClient.post('/api/ai/record', { recordId })
    return schemas.AiRecordResponseSchema.parse(response)
  }
}
