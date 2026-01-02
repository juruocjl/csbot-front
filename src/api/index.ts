import apiClient from './client'

// 认证相关
export interface AuthData {
  token: string
  code: string
}

export interface UserInfo {
  isVerified: boolean
  userId: string
  groupId: string
  steamId: string | null
  showName: string
}

// 比赛相关
export interface Player {
  steamId: string
  nickname?: string
  team: number
  rating: number | string
  we: number | string
  kills: number | string
  deaths: number | string
  assists: number | string
  legacyScore: number | string
  pvpScore: number | string
  pvpStars: number | string
}

export interface MatchData {
  matchId: string
  timestamp: number
  mode: string
  season: string | number
  winTeam: number
  team1Score: number
  team2Score: number
  team1LegacyScore: number | string
  team2LegacyScore: number | string
  players: Player[]
}

// 历史记录相关
export interface HistoryMatch {
  matchId: string
  timeStamp: number
  season: string
  mode: string
  mapName: string
  team1Score: number
  team2Score: number
  team: number
  winTeam: number
  rating: number
  we: number
  pvpScore: number
  pvpScoreChange: number
  legacyDiff: number
}

export interface MatchHistoryResponse {
  totCount: number
  pageSize: number
  matches: HistoryMatch[]
}

export interface HistoryQueryParams {
  steamId: string
  timeType: string
  page: number
}

// 玩家相关
export interface PlayerBase {
  nickname: string
  lastUpdate: number
}


// 认证 API 接口
export const authAPI = {
  // 获取用户信息（需要 token）
  getInfo: (): Promise<UserInfo> => {
    return apiClient.post('/api/auth/info')
  },

  // 初始化登录，获取 token 和验证码
  init: (): Promise<AuthData> => {
    return apiClient.post('/api/auth/init')
  },
}

// 通用 API 接口
export const commonAPI = {
  // 获取比赛详情
  getMatchInfo: (matchId: string): Promise<MatchData> => {
    return apiClient.post('/api/match/info', { matchId: matchId })
  },

  // 获取比赛历史记录
  getMatchHistory: (params: HistoryQueryParams): Promise<MatchHistoryResponse> => {
    return apiClient.post('/api/match/history', params)
  },

  // 获取玩家基础信息
  getPlayerBase: (steamId: string): Promise<PlayerBase> => {
    return apiClient.post('/api/player/base', { steamId: steamId })
  }
}
