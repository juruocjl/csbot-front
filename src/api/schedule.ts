import apiClient from './client'

export interface ScheduleTeam {
  id: string
  name: string
  logo: string
  groups?: string[]
  external_ids?: string[]
  exact?: boolean
}
export interface MatchTeam {
  team_id: string | null
  external_id: string | null
  name: string
  logo: string
}
export interface ScheduleMatch {
  id: string
  event_id: number
  event_name: string
  stage: string
  start_ts: number
  updated_at: number
  format: number
  status: 'live' | 'upcoming' | 'finished' | 'unknown'
  team1: MatchTeam
  team2: MatchTeam
  score1: number | null
  score2: number | null
  maps: { name: string; status: string; score1: number | null; score2: number | null }[]
}
export interface ScheduleResponse {
  uid: string | null
  page: number
  page_size: number
  total: number
  matches: ScheduleMatch[]
  follows: ScheduleTeam[]
  generated_at: number
  live_count: number
  events: { id: number; name: string }[]
}
export const scheduleAPI = {
  get: (params: { uid?: string; page: number; eventId?: number }): Promise<ScheduleResponse> => apiClient.post<unknown, ScheduleResponse>('/api/schedule', params),
  search: (query: string): Promise<{ teams: ScheduleTeam[] }> => apiClient.post<unknown, { teams: ScheduleTeam[] }>('/api/schedule/teams', { query }),
  follows: (): Promise<{ teams: ScheduleTeam[] }> => apiClient.post<unknown, { teams: ScheduleTeam[] }>('/api/schedule/follows'),
  follow: (teamId: string, enabled = true): Promise<{ success: boolean }> => apiClient.post<unknown, { success: boolean }>('/api/schedule/follow', { teamId, enabled }),
}
