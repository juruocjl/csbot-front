import apiClient from './client'

// 认证相关
export interface AuthData {
  token: string
  code: string
}

export interface VerifyTokenResponse {
  isVerified: boolean
}

export interface InfoNameResponse {
  showName: string
}

export interface InfoSteamIdResponse {
  steamId: string | null
}

export interface UserInfo {
  isVerified: boolean
  showName: string
  steamId: string | null
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
  pvpScoreChange: number | string
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

export interface PlayerDetailItem {
  value: number
  minValue: number
  maxValue: number
  avgValue: number
}

export interface BaseRatingDetail {
  pwRating: PlayerDetailItem
  rws: PlayerDetailItem
  pwRatingTAvg: PlayerDetailItem
  pwRatingCtAvg: PlayerDetailItem
  kastPerRound: PlayerDetailItem
}

export interface FirePowerDetail {
  score: number
  killsPerRound: PlayerDetailItem
  killsPerWinRound: PlayerDetailItem
  damagePerRound: PlayerDetailItem
  damagePerRoundWin: PlayerDetailItem
  roundsWithAKill: PlayerDetailItem
  multiKillRoundsPercentage: PlayerDetailItem
  we: PlayerDetailItem
  pistolRoundRating: PlayerDetailItem
}

export interface MarksmanshipDetail {
  score: number
  headshotRate: PlayerDetailItem
  killTime: PlayerDetailItem
  smHitRate: PlayerDetailItem
  reactionTime: PlayerDetailItem
  rapidStopRate: PlayerDetailItem
}

export interface FollowUpShotDetail {
  score: number
  savedTeammatePerRound: PlayerDetailItem
  tradeKillsPerRound: PlayerDetailItem
  tradeKillsPercentage: PlayerDetailItem
  assistKillsPercentage: PlayerDetailItem
  damagePerKill: PlayerDetailItem
}

export interface FirstBloodDetail {
  score: number
  firstHurt: PlayerDetailItem
  winAfterOpeningKill: PlayerDetailItem
  firstSuccessRate: PlayerDetailItem
  firstKill: PlayerDetailItem
  firstRate: PlayerDetailItem
}

export interface ItemDetail {
  score: number
  itemRate: PlayerDetailItem
  utilityDamagePerRounds: PlayerDetailItem
  flashAssistPerRound: PlayerDetailItem
  flashbangFlashRate: PlayerDetailItem
  timeOpponentFlashedPerRound: PlayerDetailItem
}

export interface ClutchDetail {
  score: number
  v1WinPercentage: PlayerDetailItem
  clutchPointsPerRound: PlayerDetailItem
  lastAlivePercentage: PlayerDetailItem
  timeAlivePerRound: PlayerDetailItem
  savesPerRoundLoss: PlayerDetailItem
}

export interface SniperDetail {
  score: number
  sniperFirstKillPercentage: PlayerDetailItem
  sniperKillsPercentage: PlayerDetailItem
  sniperKillPerRound: PlayerDetailItem
  roundsWithSniperKillsPercentage: PlayerDetailItem
  sniperMultipleKillRoundPercentage: PlayerDetailItem
}

export interface PlayerDetailResponse {
  pvpScore: number
  pvpStars: number
  cnt: number
  winRate: PlayerDetailItem
  seasonId: string
  baseRating: BaseRatingDetail
  firePower: FirePowerDetail
  marksmanship: MarksmanshipDetail
  followUpShot: FollowUpShotDetail
  firstBlood: FirstBloodDetail
  item: ItemDetail
  clutch: ClutchDetail
  sniper: SniperDetail
}

// 配置相关
export interface TimeResponse {
  timeTypes: string[]
}

export interface RankConfigItem {
  name: string
  description: string
  defaultTimeType: string
  allowedTimeTypes: string[]
  // outputFormat: dX 表示保留X位小数, pX 表示保留X位百分数
  // 例如: "d2" 表示保留2位小数, "p1" 表示保留1位百分数
  outputFormat: string
}

export interface RankConfigResponse {
  rankOptions: RankConfigItem[]
}

// 排名相关
export interface RankItem {
  steamId: string
  nickname: string
  value: number
  count: number
}

export interface RankResponse {
  minValue: number
  maxValue: number
  players: RankItem[]
}

export interface RankQueryParams {
  rankName: string
  timeType: string
}

// 认证 API 接口
export const authAPI = {
  // 验证 Token 是否有效
  verify: (): Promise<VerifyTokenResponse> => {
    return apiClient.post('/api/auth/verify')
  },

  // 获取用户显示名称
  getInfoName: (): Promise<InfoNameResponse> => {
    return apiClient.post('/api/auth/info/name')
  },

  // 获取用户绑定的 Steam ID
  getInfoSteamId: (): Promise<InfoSteamIdResponse> => {
    return apiClient.post('/api/auth/info/steamid')
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
  },

  // 获取玩家详细信息
  getPlayerDetail: (steamId: string): Promise<PlayerDetailResponse> => {
    return apiClient.post('/api/player/detail', { steamId: steamId })
  }
}

// 配置 API 接口
export const configAPI = {
  // 获取支持的时间范围类型
  getTimeTypes: (): Promise<TimeResponse> => {
    return apiClient.post('/api/config/time')
  },

  // 获取排名配置
  getRankConfig: (): Promise<RankConfigResponse> => {
    return apiClient.post('/api/config/rank')
  }
}

// 排名 API 接口
export const rankAPI = {
  // 获取排名列表
  getRankList: (params: RankQueryParams): Promise<RankResponse> => {
    return apiClient.post('/api/rank', params)
  }
}
