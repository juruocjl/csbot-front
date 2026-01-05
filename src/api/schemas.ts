import { z } from 'zod'

// 认证相关 Schemas
export const AuthDataSchema = z.object({
  token: z.string(),
  code: z.string()
})

export const VerifyTokenResponseSchema = z.object({
  isVerified: z.boolean()
})

export const InfoNameResponseSchema = z.object({
  showName: z.string()
})

export const InfoSteamIdResponseSchema = z.object({
  steamId: z.string().nullable()
})

export const InfoQQResponseSchema = z.object({
  qq: z.string()
})

export const UserInfoSchema = z.object({
  isVerified: z.boolean(),
  showName: z.string(),
  steamId: z.string().nullable()
})

export const SendAuthResponseSchema = z.object({}).strict()

// 比赛相关 Schemas
export const PlayerSchema = z.object({
  steamId: z.string(),
  nickname: z.string(),
  team: z.number(),
  rating: z.number(),
  we: z.number(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  legacyScore: z.union([z.number(), z.null()]),
  pvpScore: z.number(),
  pvpScoreChange: z.number(),
  pvpStars: z.number()
})

export const MatchDataSchema = z.object({
  matchId: z.string(),
  timestamp: z.number(),
  mode: z.string(),
  season: z.string(),
  winTeam: z.number(),
  team1Score: z.number(),
  team2Score: z.number(),
  team1LegacyScore: z.union([z.number(), z.null()]),
  team2LegacyScore: z.union([z.number(), z.null()]),
  players: z.array(PlayerSchema)
})

// 历史记录相关 Schemas
export const HistoryMatchSchema = z.object({
  matchId: z.string(),
  timeStamp: z.number(),
  season: z.string(),
  mode: z.string(),
  mapName: z.string(),
  team1Score: z.number(),
  team2Score: z.number(),
  team: z.number(),
  winTeam: z.number(),
  rating: z.number(),
  we: z.number(),
  pvpScore: z.number(),
  pvpScoreChange: z.number(),
  legacyDiff: z.number().nullable()
})

export const MatchHistoryResponseSchema = z.object({
  totCount: z.number(),
  pageSize: z.number(),
  matches: z.array(HistoryMatchSchema)
})

// 玩家相关 Schemas
export const PlayerBaseSchema = z.object({
  nickname: z.string(),
  lastUpdate: z.number()
})

export const PlayerDetailItemSchema = z.object({
  value: z.number(),
  minValue: z.number(),
  maxValue: z.number(),
  avgValue: z.number()
})

export const BaseRatingDetailSchema = z.object({
  pwRating: PlayerDetailItemSchema,
  rws: PlayerDetailItemSchema,
  pwRatingTAvg: PlayerDetailItemSchema,
  pwRatingCtAvg: PlayerDetailItemSchema,
  kastPerRound: PlayerDetailItemSchema
})

export const FirePowerDetailSchema = z.object({
  score: z.number(),
  killsPerRound: PlayerDetailItemSchema,
  killsPerWinRound: PlayerDetailItemSchema,
  damagePerRound: PlayerDetailItemSchema,
  damagePerRoundWin: PlayerDetailItemSchema,
  roundsWithAKill: PlayerDetailItemSchema,
  multiKillRoundsPercentage: PlayerDetailItemSchema,
  we: PlayerDetailItemSchema,
  pistolRoundRating: PlayerDetailItemSchema
})

export const MarksmanshipDetailSchema = z.object({
  score: z.number(),
  headshotRate: PlayerDetailItemSchema,
  killTime: PlayerDetailItemSchema,
  smHitRate: PlayerDetailItemSchema,
  reactionTime: PlayerDetailItemSchema,
  rapidStopRate: PlayerDetailItemSchema
})

export const FollowUpShotDetailSchema = z.object({
  score: z.number(),
  savedTeammatePerRound: PlayerDetailItemSchema,
  tradeKillsPerRound: PlayerDetailItemSchema,
  tradeKillsPercentage: PlayerDetailItemSchema,
  assistKillsPercentage: PlayerDetailItemSchema,
  damagePerKill: PlayerDetailItemSchema
})

export const FirstBloodDetailSchema = z.object({
  score: z.number(),
  firstHurt: PlayerDetailItemSchema,
  winAfterOpeningKill: PlayerDetailItemSchema,
  firstSuccessRate: PlayerDetailItemSchema,
  firstKill: PlayerDetailItemSchema,
  firstRate: PlayerDetailItemSchema
})

export const ItemDetailSchema = z.object({
  score: z.number(),
  itemRate: PlayerDetailItemSchema,
  utilityDamagePerRounds: PlayerDetailItemSchema,
  flashAssistPerRound: PlayerDetailItemSchema,
  flashbangFlashRate: PlayerDetailItemSchema,
  timeOpponentFlashedPerRound: PlayerDetailItemSchema
})

export const ClutchDetailSchema = z.object({
  score: z.number(),
  v1WinPercentage: PlayerDetailItemSchema,
  clutchPointsPerRound: PlayerDetailItemSchema,
  lastAlivePercentage: PlayerDetailItemSchema,
  timeAlivePerRound: PlayerDetailItemSchema,
  savesPerRoundLoss: PlayerDetailItemSchema
})

export const SniperDetailSchema = z.object({
  score: z.number(),
  sniperFirstKillPercentage: PlayerDetailItemSchema,
  sniperKillsPercentage: PlayerDetailItemSchema,
  sniperKillPerRound: PlayerDetailItemSchema,
  roundsWithSniperKillsPercentage: PlayerDetailItemSchema,
  sniperMultipleKillRoundPercentage: PlayerDetailItemSchema
})

export const PlayerDetailResponseSchema = z.object({
  pvpScore: z.number(),
  pvpStars: z.number(),
  cnt: z.number(),
  winRate: PlayerDetailItemSchema,
  seasonId: z.string(),
  lastUpdate: z.number(),
  baseRating: BaseRatingDetailSchema,
  firePower: FirePowerDetailSchema,
  marksmanship: MarksmanshipDetailSchema,
  followUpShot: FollowUpShotDetailSchema,
  firstBlood: FirstBloodDetailSchema,
  item: ItemDetailSchema,
  clutch: ClutchDetailSchema,
  sniper: SniperDetailSchema
})

// 配置相关 Schemas
export const TimeResponseSchema = z.object({
  timeTypes: z.array(z.string())
})

export const RankConfigItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  defaultTimeType: z.string(),
  allowedTimeTypes: z.array(z.string()),
  outputFormat: z.string()
})

export const RankConfigResponseSchema = z.object({
  rankOptions: z.array(RankConfigItemSchema)
})

// 排名相关 Schemas
export const RankItemSchema = z.object({
  steamId: z.string(),
  nickname: z.string(),
  value: z.number(),
  count: z.number()
})

export const RankResponseSchema = z.object({
  minValue: z.number(),
  maxValue: z.number(),
  players: z.array(RankItemSchema)
})

export const StatusResponseSchema = z.object({
  cpuUsage: z.number(),
  memoryTotal: z.number(),
  memoryUsed: z.number(),
  memoryUsagePercent: z.number(),
  memoryAvailable: z.number(),
  pictureLibrary: z.string(),
  messageCount: z.string()
})

// 用户相关 Schemas
export const UserQQItemSchema = z.object({
  qq: z.string(),
  qqNickname: z.string(),
  steamId: z.string(),
  nickname: z.string()
})

export const UserResponseSchema = z.object({
  users: z.array(UserQQItemSchema)
})

// 自动类型推导
export type AuthData = z.infer<typeof AuthDataSchema>
export type VerifyTokenResponse = z.infer<typeof VerifyTokenResponseSchema>
export type InfoNameResponse = z.infer<typeof InfoNameResponseSchema>
export type InfoSteamIdResponse = z.infer<typeof InfoSteamIdResponseSchema>
export type InfoQQResponse = z.infer<typeof InfoQQResponseSchema>
export type UserInfo = z.infer<typeof UserInfoSchema>
export type SendAuthResponse = z.infer<typeof SendAuthResponseSchema>
export type Player = z.infer<typeof PlayerSchema>
export type MatchData = z.infer<typeof MatchDataSchema>
export type HistoryMatch = z.infer<typeof HistoryMatchSchema>
export type MatchHistoryResponse = z.infer<typeof MatchHistoryResponseSchema>
export type PlayerBase = z.infer<typeof PlayerBaseSchema>
export type PlayerDetailItem = z.infer<typeof PlayerDetailItemSchema>
export type BaseRatingDetail = z.infer<typeof BaseRatingDetailSchema>
export type FirePowerDetail = z.infer<typeof FirePowerDetailSchema>
export type MarksmanshipDetail = z.infer<typeof MarksmanshipDetailSchema>
export type FollowUpShotDetail = z.infer<typeof FollowUpShotDetailSchema>
export type FirstBloodDetail = z.infer<typeof FirstBloodDetailSchema>
export type ItemDetail = z.infer<typeof ItemDetailSchema>
export type ClutchDetail = z.infer<typeof ClutchDetailSchema>
export type SniperDetail = z.infer<typeof SniperDetailSchema>
export type PlayerDetailResponse = z.infer<typeof PlayerDetailResponseSchema>
export type TimeResponse = z.infer<typeof TimeResponseSchema>
export type RankConfigItem = z.infer<typeof RankConfigItemSchema>
export type RankConfigResponse = z.infer<typeof RankConfigResponseSchema>
export type RankItem = z.infer<typeof RankItemSchema>
export type RankResponse = z.infer<typeof RankResponseSchema>
export type StatusResponse = z.infer<typeof StatusResponseSchema>
export type UserQQItem = z.infer<typeof UserQQItemSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>