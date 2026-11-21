/**
 * ELO 榜单 S 段位等效分展示工具。
 *
 * 完美天梯把 S 段位玩家统一存成 pvpScore = 2401，升星信息在 pvpStars 里；
 * 排名页在数值旁展示 `S ★N` 胶囊标注，并提示 2401 + 25×★ 的折算规则。
 */

export const S_RANK_MIN_SCORE = 2401
export const S_STAR_EQUIVALENT_POINTS = 25

export interface RankBadgeSource {
  badgeText?: string | null
  rawPvpScore?: number | null
  pvpStars?: number | null
}

export function isEloRank(rankName: string): boolean {
  return rankName === 'ELO'
}

export function getEloRankNote(rankName: string): string | null {
  return isEloRank(rankName) ? 'S 段位按 2401 + 25×★ 折算等效分' : null
}

export function formatRankBadgeText(rankName: string, item: RankBadgeSource): string | null {
  if (!isEloRank(rankName)) return null
  if (typeof item.badgeText === 'string' && item.badgeText.trim()) {
    return item.badgeText.trim()
  }
  const rawPvpScore = item.rawPvpScore
  if (typeof rawPvpScore !== 'number' || !Number.isFinite(rawPvpScore)
    || !Number.isInteger(rawPvpScore)) {
    return null
  }
  const stars = Math.max(Math.floor(Number(item.pvpStars ?? 0) || 0), 0)
  if (rawPvpScore === S_RANK_MIN_SCORE || (rawPvpScore > S_RANK_MIN_SCORE && stars > 0)) {
    return `S ★${stars}`
  }
  return null
}
