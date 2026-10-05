// Only screenshot browsers collect data. Auth, mutations and AI APIs never enter it.
const endpoints = new Set([
  '/api/match/info', '/api/match/infogp', '/api/match/infofaceit',
  '/api/match/history', '/api/match/historygp', '/api/match/historyfaceit', '/api/match/historyall',
  '/api/player/base', '/api/player/detail', '/api/rank', '/api/steam/status',
  '/api/watch-stage/snapshot', '/api/major/homework/rank', '/api/major/homework/personal',
  '/api/config/time', '/api/config/rank', '/api/config/users'
])
const parameters = new Set(['matchId', 'steamId', 'timeType', 'page', 'rankName', 'uid', 'seasonId', 'stage', 'eventId'])
interface ResponseMetadata { api: string; params: Record<string, unknown>; data: unknown }
interface PageMetadata { documentKey: string; pending: number; failed: boolean; responses: ResponseMetadata[] }
declare global {
  interface Window { __CSBOT_CAPTURE_METADATA__?: boolean; __CSBOT_PAGE_METADATA__?: PageMetadata }
}
export function beginPageMetadata(api: string, rawParams: unknown) {
  if (typeof window === 'undefined' || !window.__CSBOT_CAPTURE_METADATA__ || !endpoints.has(api)) return null
  let params: Record<string, unknown>
  try { params = typeof rawParams === 'string' ? JSON.parse(rawParams) : rawParams || {} } catch { return null }
  if (!params || typeof params !== 'object' || Array.isArray(params) || Object.keys(params).some(key => !parameters.has(key))) return null
  const documentKey = location.pathname + location.search
  let state = window.__CSBOT_PAGE_METADATA__
  if (!state || state.documentKey !== documentKey) state = window.__CSBOT_PAGE_METADATA__ = { documentKey, pending: 0, failed: false, responses: [] }
  state.pending++
  return { state, api, params: JSON.parse(JSON.stringify(params)) as Record<string, unknown> }
}
export function finishPageMetadata(ticket: ReturnType<typeof beginPageMetadata>, data?: unknown, failed = false) {
  if (!ticket) return
  const { state, api, params } = ticket
  state.pending--
  state.failed ||= failed
  if (failed) return
  let item: ResponseMetadata
  try { item = { api, params, data: JSON.parse(JSON.stringify(data)) } }
  catch { state.failed = true; return }
  const index = state.responses.findIndex(value => value.api === api && JSON.stringify(value.params) === JSON.stringify(params))
  if (index < 0) state.responses.push(item)
  else state.responses[index] = item
}
