<template>
  <div class="history-all-page">
    <section class="history-table">
      <div v-if="loading" class="loading-layer">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="error" class="error-card">
        <p>{{ error }}</p>
        <el-button type="primary" @click="loadMatches">重试</el-button>
      </div>

      <div v-else class="table-section">
        <div class="result-info">
          共 <strong>{{ historyData?.totCount || 0 }}</strong> 场比赛
        </div>

        <el-table
          :data="filteredMatches"
          style="width: 100%"
        >
          <el-table-column label="比赛 ID" align="center">
            <template #default="{ row }">
              <router-link :to="matchDetailLink(row)" class="match-link" :title="row.matchId">
                {{ formatMatchId(row.matchId) }}
              </router-link>
              <p class="match-subtext">
                {{ formatTime(row.timeStamp) }}
              </p>
            </template>
          </el-table-column>

          <el-table-column label="模式" align="center">
            <template #default="{ row }">
              <div>
                <el-tag :type="row.isGP ? 'danger' : 'success'" size="small" class="match-type-tag">
                  {{ row.isGP ? '官匹' : '完美' }}
                </el-tag>
                {{ formatMode(row.mode) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="地图" align="center">
            <template #default="{ row }">
              <MapIcon :map-name="row.mapName" />
            </template>
          </el-table-column>

          <el-table-column label="队伍 1" align="center">
            <template #default="{ row }">
              <div class="avatar-stack" :class="getTeamCellClass(row.winTeam, 1)">
                <el-avatar
                  v-for="player in getVisiblePlayers(row.team1Player)"
                  :key="`team1-${player}`"
                  :src="getAvatarUrl(player)"
                  :alt="player"
                  size="36"
                  @error="handlePlayerAvatarError"
                />
                <span
                  v-if="getRemainingPlayers(row.team1Player) > 0"
                  class="avatar-more"
                >+{{ getRemainingPlayers(row.team1Player) }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="队伍 2" align="center">
            <template #default="{ row }">
              <div class="avatar-stack" :class="getTeamCellClass(row.winTeam, 2)">
                <el-avatar
                  v-for="player in getVisiblePlayers(row.team2Player)"
                  :key="`team2-${player}`"
                  :src="getAvatarUrl(player)"
                  :alt="player"
                  size="36"
                  @error="handlePlayerAvatarError"
                />
                <span
                  v-if="getRemainingPlayers(row.team2Player) > 0"
                  class="avatar-more"
                >+{{ getRemainingPlayers(row.team2Player) }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="比分" align="center">
            <template #default="{ row }">
              <span :class="scoreClass(row, 1)">{{ row.team1Score }}</span>
              <span class="score-separator">-</span>
              <span :class="scoreClass(row, 2)">{{ row.team2Score }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-section">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="historyData?.totCount || 0"
            layout="prev, pager, next, total"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { commonAPI, type AllMatchHistoryResponse, type AllMatchHistoryItem } from '../api'
import MapIcon from '../components/MapIcon.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref<string | null>(null)
const historyData = ref<AllMatchHistoryResponse | null>(null)
const matches = ref<AllMatchHistoryItem[]>([])
const searchTerm = ref('')
const currentPage = ref<number>(Number(route.query.page) || 1)
const pageSize = ref(20)
const AVATAR_LIMIT = 5
const AVATAR_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"%3E%3Crect fill="%23e5e7eb" width="36" height="36"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="18"%3E%3F%3C/text%3E%3C/svg%3E'

const loadMatches = async (): Promise<void> => {
  loading.value = true
  error.value = null
  try {
    const response = await commonAPI.getAllMatchHistory({ page: currentPage.value })
    historyData.value = response
    matches.value = response.matches
    pageSize.value = response.pageSize
  } catch (err: any) {
    error.value = err?.response?.data?.detail || '加载失败，请稍后重试'
    console.error('获取全部比赛失败:', err)
  } finally {
    loading.value = false
  }
}

const filteredMatches = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  if (!keyword) {
    return matches.value
  }
  return matches.value.filter((item) => {
    return (
      item.matchId.toLowerCase().includes(keyword) ||
      item.mapName.toLowerCase().includes(keyword) ||
      item.mode.toLowerCase().includes(keyword)
    )
  })
})


const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

const formatMode = (mode: string): string => {
  return mode || '未知'
}

const formatMatchId = (matchId: string): string => {
  const atIndex = matchId.indexOf('@')
  if (atIndex === -1) {
    return matchId.slice(-6)
  }
  const beforeAt = matchId.substring(0, atIndex + 1)
  const lastSix = matchId.slice(-6)
  return `${beforeAt}...${lastSix}`
}

const matchDetailLink = (match: AllMatchHistoryItem): string => {
  const base = match.isGP ? '/match-gp' : '/match'
  return `${base}?id=${match.matchId}`
}

const scoreClass = (row: AllMatchHistoryItem, teamIndex: number): string => {
	// 平局不显示颜色
	if (row.winTeam === 0) return ''
	
	// 判断所有玩家是否在同一边
	const allOnOne = row.team1Player.length === 0 || row.team2Player.length === 0
	
	if (allOnOne) {
		// 所有玩家在一边，显示该队的颜色（赢绿输红）
		const playerTeam = row.team1Player.length > 0 ? 1 : 2
		if (playerTeam === teamIndex) {
			// 显示玩家队伍的颜色
			return row.winTeam === playerTeam ? 'score-winner' : 'score-loser'
		}
		// 对方队伍不显示颜色
		return ''
	}
	
	// 玩家分散在两边，只显示赢得那边的颜色
	return row.winTeam === teamIndex ? 'score-winner' : ''
}

const getTeamCellClass = (winTeam: number, teamIndex: number): string => {
  if (winTeam === 0) return '' // 平局，无颜色
  if (winTeam === teamIndex) return 'cell-winner'
  return 'cell-loser'
}

const getAvatarUrl = (steamId: string): string => {
  return steamId ? `/imgs/avatar/${steamId}.png` : ''
}

const handlePlayerAvatarError = (event: Event): void => {
  const img = event.target as HTMLImageElement
  img.src = AVATAR_PLACEHOLDER
}

const getVisiblePlayers = (players: string[] = []): string[] => {
  return players.slice(0, AVATAR_LIMIT)
}

const getRemainingPlayers = (players: string[] = []): number => {
  return Math.max(players.length - AVATAR_LIMIT, 0)
}

const handlePageChange = async (page: number): Promise<void> => {
  await router.replace({
    path: '/history-all',
    query: {
      page
    }
  })
}

onMounted(() => {
  loadMatches()
})

// 监听路由参数变化，执行实际的数据查询
watch(() => route.query, async (newQuery) => {
  currentPage.value = Number(newQuery.page) || 1
  await loadMatches()
}, { deep: true })
</script>

<style scoped>
.history-all-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history-all-header {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
}

.title-stack {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.eyebrow {
  font-size: 0.875rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #94a3b8;
  margin: 0;
}

.history-all-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}

.subtitle {
  margin: 0;
  color: #475569;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.summary-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 90px;
}

.summary-card span {
  font-size: 0.85rem;
  color: #6b7280;
}

.summary-card strong {
  font-size: 1.4rem;
  color: #111827;
}

.history-table {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1.5rem 1.5rem 2rem;
}

.table-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
}

.loading-layer,
.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 220px;
  color: #475569;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.result-meta {
  margin-bottom: 1rem;
  color: #475569;
  font-size: 0.95rem;
}

.result-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.result-info strong {
  color: #111827;
  font-weight: 600;
}

.match-link {
  color: #6366f1;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;
}

.match-link:hover {
  color: #4f46e5;
  text-decoration: underline;
}

.match-subtext {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0.25rem 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.match-type-tag {
  flex-shrink: 0;
}

.map-name {
  color: #111827;
  margin: 0;
}

.mode-chip {
  margin: 0;
  font-size: 0.8rem;
  color: #475569;
}

.cell-winner {
  background-color: #ecfdf3 !important;
}

.cell-loser {
  background-color: #fee2e2 !important;
}

.avatar-stack {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: -0.7rem;
  flex-wrap: wrap;
}

.avatar-stack :deep(.el-avatar) {
  border-radius: 50%;
  margin-right: -0.5rem;
  border: 2px solid white;
  position: relative;
  z-index: 1;
}

.avatar-stack :deep(.el-avatar:first-child) {
  z-index: 5;
}

.avatar-stack :deep(.el-avatar:nth-child(2)) {
  z-index: 4;
}

.avatar-stack :deep(.el-avatar:nth-child(3)) {
  z-index: 3;
}

.avatar-stack :deep(.el-avatar:nth-child(4)) {
  z-index: 2;
}

.avatar-stack :deep(.el-avatar:nth-child(5)) {
  z-index: 1;
}

.avatar-more {
  font-size: 0.75rem;
  color: #475569;
  font-weight: 700;
}

.team-label {
  font-size: 0.75rem;
  color: #64748b;
  display: block;
}

.score-winner {
  color: #16a34a;
  font-weight: 600;
}

.score-loser {
  color: #dc2626;
  font-weight: 600;
}

.score-separator {
  margin: 0 0.35rem;
  color: #94a3b8;
}

.pagination-section {
  padding-top: 1.5rem;
  display: flex;
  justify-content: center;
}

:deep(.el-pagination) {
  display: flex;
  gap: 0.5rem;
}

:deep(.el-table) {
  border: none;
}

:deep(.el-table th) {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.el-table tr:hover > td) {
  background: #f9fafb;
}

@media (max-width: 768px) {
  .history-all-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .lineup-avatars {
    align-items: stretch;
  }

  :deep(.el-table) {
    font-size: 0.875rem;
  }
}
</style>
