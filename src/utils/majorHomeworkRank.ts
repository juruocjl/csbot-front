/**
 * Major 作业排名列展示工具。
 *
 * 后端在 `/api/major/homework/rank` 里给出：
 * - `isStarred`：该玩家在**当前 Major 赛事**打🌟（未购通行证）；
 * - `rank`：排除打🌟玩家后的数字名次（打🌟玩家为 `null`）。
 *
 * 打🌟玩家显示 `🌟`、不占数字名次，但保持原排序原地混排。
 * 若后端尚未提供 `rank`（旧版本 / 部分数据），按数组顺序兜底递增跳过打🌟项。
 */

export interface MajorHomeworkRankCell {
  isStarred: boolean
  rank: number | null
  label: string
}

export function resolveMajorHomeworkRankCells(
  players: ReadonlyArray<{ uid: string; rank?: number | null; isStarred?: boolean }>
): MajorHomeworkRankCell[] {
  let fallbackRank = 0
  return players.map(player => {
    if (Boolean(player.isStarred)) {
      return { isStarred: true, rank: null, label: '🌟' }
    }
    fallbackRank += 1
    const providedRank = player.rank
    const effectiveRank = typeof providedRank === 'number'
      && Number.isInteger(providedRank)
      && providedRank > 0
      ? providedRank
      : fallbackRank
    return { isStarred: false, rank: effectiveRank, label: String(effectiveRank) }
  })
}
