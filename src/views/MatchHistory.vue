<template>
  <div class="history-container">
    <div class="query-section">
      <div class="query-form">
        <div class="form-group">
          <label>Steam ID</label>
          <input v-model="querySteamId" class="form-input" placeholder="输入 Steam ID">
        </div>
        <div class="form-group">
          <label>时间范围</label>
          <select v-model="queryTimeType" class="form-select">
            <option v-for="timeType in timeTypes" :key="timeType" :value="timeType">
              {{ timeType }}
            </option>
          </select>
        </div>
        <UserChoose targetPath="/history" />
        <el-button type="primary" @click="switchToGPHistory" class="switch-btn">切换至官匹历史</el-button>
      </div>
      
      <!-- 玩家基本信息 -->
      <div v-if="playerInfo" class="player-info">
        <div class="player-card">
          <router-link :to="`/data?steamId=${querySteamId}`" class="avatar-link">
            <el-avatar :src="`/imgs/avatar/${querySteamId}.png`" :alt="playerInfo.nickname" :size="64" @error="handleImageError"></el-avatar>
          </router-link>
          <div class="player-details">
            <router-link :to="`/data?steamId=${querySteamId}`" class="nickname-link">
              <h3>{{ playerInfo.nickname }}</h3>
            </router-link>
            <p class="last-update">
              <el-button 
                @click="updateMatchHistory"
              ><RefreshCw :size="16"/></el-button>
              更新于：{{ formatTimestamp(playerInfo.lastUpdate) }}
            </p>
          </div>
        </div>
      </div>
      <div v-else class="player-info">
        <div class="player-card">
          <router-link :to="`/data?steamId=${querySteamId}`" class="avatar-link">
            <el-avatar :src="`/imgs/avatar/${querySteamId}.png`" alt="未知玩家" :size="64" @error="handleImageError"></el-avatar>
          </router-link>
          <div class="player-details">
            <router-link :to="`/data?steamId=${querySteamId}`" class="nickname-link">
              <h3>未知玩家</h3>
            </router-link>
            <p class="last-update">
              <el-button 
                @click="updateMatchHistory"
              ><RefreshCw :size="16"/></el-button>
              更新于：None
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="history-content">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>{{ error }}</h3>
        <el-button @click="queryHistory" class="retry-btn">重试</el-button>
      </div>

      <div v-else class="table-section">
        <div class="result-info">
          共 <strong>{{ historyData?.totCount || 0 }}</strong> 场比赛
        </div>

        <el-table :data="historyData?.matches || []" style="width: 100%">
          <el-table-column label="比赛 ID" align="center">
            <template #default="{ row }">
              <router-link :to="`/match?id=${row.matchId}`" class="match-link" :title="row.matchId">
                {{ formatMatchId(row.matchId) }}
              </router-link>
              <p class="match-subtext">
                {{ row.season }} / {{ formatTime(row.timeStamp) }}
              </p>
            </template>
          </el-table-column>
          <el-table-column label="模式" align="center">
            <template #default="{ row }">
              <div>
                {{ row.mode }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="地图" align="center">
            <template #default="{ row }">
              <div style="width: 100%; display: flex; justify-content: center;">
                <MapIcon :map-name="row.mapName" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="比分" align="center">
            <template #default="{ row }">
              <span :class="scoreClass(row.team, row.winTeam, 1)">
                {{ row.team1Score }}
              </span>
              <span> - </span>
              <span :class="scoreClass(row.team, row.winTeam, 2)">
                {{ row.team2Score }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Rating" align="center">
            <template #default="{ row }">
              <span :class="valueClass(row.rating)">{{ formatRating(row.rating) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="WE" align="center">
            <template #default="{ row }">
              <span :class="valueClass(row.we, 8)">{{ formatWe(row.we) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="底蕴分差" align="center">
            <template #default="{ row }">
              <span :class="{ 'value-positive': row.legacyDiff > 0, 'value-negative': row.legacyDiff < 0 }">
                {{ formatNumber(row.legacyDiff) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="段位" align="center">
            <template #default="{ row }">
              <div class="rank-display-cell">
                <RankBadge 
                  :pvp-score="rankDisplayScore(row)" 
                  :pvp-stars="row.pvpStars" 
                  :season="row.season" 
                />
                <span v-if="row.isPredictedPvpScore" class="predicted-rank-mark">*</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="分数变化" align="center">
            <template #default="{ row }">
              <span :class="{ 'value-positive': row.pvpScoreChange > 0, 'value-negative': row.pvpScoreChange < 0 }">
                {{ row.pvpScoreChange > 0 ? '+' : '' }}{{ row.pvpScoreChange }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-section">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="historyData?.totCount || 0"
            @current-change="onPageChange"
            layout="prev, pager, next, total"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authAPI, commonAPI, configAPI, type HistoryMatch, type MatchHistoryResponse, type PlayerBase} from '../api'
import { watchDebounced } from '@vueuse/core'
import { RefreshCw } from 'lucide-vue-next'
import RankBadge from '../components/RankBadge.vue'
import UserChoose from '../components/UserChoose.vue'
import MapIcon from '../components/MapIcon.vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()


const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const historyData = ref<MatchHistoryResponse | null>(null)
const playerInfo = ref<PlayerBase | null>(null)
const timeTypes = ref<string[]>([])

const querySteamId = ref<string>(route.query.steamId as string || '')
const queryTimeType = ref<string>(route.query.timeType as string || '')
const currentPage = ref<number>(Number(route.query.page) || 1)
const pageSize = ref<number>(20)

onMounted(async () => {
  // 获取时间类型列表
  try {
    const timeTypeResponse = await configAPI.getTimeTypes()
    timeTypes.value = timeTypeResponse.timeTypes
  } catch (err) {
    console.error('获取时间类型失败:', err)
    timeTypes.value = []
  }
  
  if (querySteamId.value) {
    await loadPlayerInfo()
  }

  if (queryTimeType.value && querySteamId.value) {
    // 如果 URL 中已有参数，直接加载数据
    await loadHistoryData()
    return
  }
  
  // 如果 URL 中没有参数，设置默认值
  if (!queryTimeType.value && timeTypes.value.length > 0) {
    queryTimeType.value = timeTypes.value[timeTypes.value.length - 1]
  }
  
  if (!querySteamId.value) {
    try {
      const result = await authAPI.getInfoSteamId()
      if (result.steamId) {
        querySteamId.value = result.steamId
        // 设置完值后，watchDebounced 会自动触发 queryHistory()，不需要手动 replace
      }
    } catch (err) {
      console.error('获取 Steam ID 失败:', err)
    }
  }
})

const loadPlayerInfo = async (): Promise<void> => {
  try {
    playerInfo.value = await commonAPI.getPlayerBase(querySteamId.value)
  } catch (err) {
    console.error('获取玩家信息失败:', err)
    playerInfo.value = null
  }
}

const updateMatchHistory = async (): Promise<void> => {
  ElMessage.info('正在请求更新比赛历史，请稍候...')
  try {
    const result = await commonAPI.updatePlayerData(querySteamId.value)
    console.log('请求更新比赛历史成功:', result)
    ElMessage.success(`${result.nickname} 更新 ${result.matchCount} 场完美比赛，${result.matchgpCount} 场官匹比赛`)
    // 只在成功时调用
    await loadPlayerInfo()
    await loadHistoryData()
  } catch (err: any) {
    console.error('请求更新比赛历史失败:', err)
    ElMessage.error(err.response?.data?.detail || '更新失败，请稍后重试')
  }
}

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

const handleImageError = (e: Event): void => {
  const img = e.target as HTMLImageElement
  img.src =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect fill="%23e5e7eb" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="22"%3E?%3C/text%3E%3C/svg%3E'
}

const rankDisplayScore = (row: HistoryMatch): number => {
  return row.displayPvpScore ?? row.pvpScore
}

const switchToGPHistory = (): void => {
  router.push({
    path: '/history-gp',
    query: {
      steamId: querySteamId.value.trim(),
      timeType: queryTimeType.value,
      page: 1
    }
  })
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
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

const formatNumber = (value: number): string => {
  if (Number.isNaN(value)) return '-'
  const intValue = Math.round(value)
  if (intValue >= 0) return `+${intValue}`
  return intValue.toString()
}

const formatRating = (value: number): string => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '-'
  return num.toFixed(2)
}

const formatWe = (value: number): string => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '-'
  return num.toFixed(1)
}

const valueClass = (value: number | string, threshold: number = 1): string => {
  const num = Number(value)
  if (Number.isNaN(num)) return ''
  return num > threshold ? 'value-positive' : 'value-negative'
}

const scoreClass = (playerTeam: number, winTeam: number, scoreTeam: number): string => {
  // 平局不显示颜色
  if (winTeam === 0) return ''
  
  if (playerTeam === scoreTeam) {
    // 是玩家所在的队伍
    return playerTeam === winTeam ? 'win-score' : 'lose-score'
  }
  return ''
}

const loadHistoryData = async (): Promise<void> => {
  loading.value = true
  error.value = null
  try {
    const response = await commonAPI.getMatchHistory({
      steamId: querySteamId.value.trim(),
      timeType: queryTimeType.value,
      page: currentPage.value
    })
    historyData.value = response
  } catch (err: any) {
    if (err.response?.data?.detail) {
      error.value = err.response?.data.detail;
    } else {
      error.value = '加载历史记录失败，请重试';
    }
    console.error('获取历史记录失败:', err)
  } finally {
    loading.value = false
  }
}

const queryHistory = async (resetPage: boolean = false): Promise<void> => {
  if (resetPage) {
    currentPage.value = 1
  }

  // 只更新URL参数，由 route.query 监听触发实际查询
  await router.replace({
    path: '/history',
    query: {
      steamId: querySteamId.value.trim(),
      timeType: queryTimeType.value,
      page: currentPage.value
    }
  })
}

const onPageChange = async (page: number): Promise<void> => {
  // 更新URL参数，由 route.query 监听触发查询
  await router.replace({
    path: '/history',
    query: {
      steamId: querySteamId.value.trim(),
      timeType: queryTimeType.value,
      page
    }
  })
}

// 监听 Steam ID 改变，获取玩家信息
watchDebounced(querySteamId, loadPlayerInfo, { debounce: 100 })

// 监听 Steam ID 和 时间类型的变化自动查询
watchDebounced([querySteamId, queryTimeType], () => {
  queryHistory(true)
}, { debounce: 100 })

// 监听路由参数变化，执行实际的数据查询
watch(() => route.query, async (newQuery) => {
  if (newQuery.steamId) {
    querySteamId.value = newQuery.steamId as string
    queryTimeType.value = (newQuery.timeType as string) || '全部'
    currentPage.value = Number(newQuery.page) || 1
    
    // 加载历史记录
    await loadHistoryData()
  }
}, { deep: true })</script>

<style scoped>
.history-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.query-section {
  background: white;
  padding: 1.5rem;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.query-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: flex-end;
}


.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.form-input,
.form-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.player-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
}

.player-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-details h3 {
  margin: 0;
  font-size: 1rem;
  color: #111827;
  font-weight: 600;
}

.last-update {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.history-content {
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p {
  color: #6b7280;
  font-size: 1rem;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-container h3 {
  color: #dc2626;
  margin-bottom: 1.5rem;
}

:deep(.retry-btn) {
  background: #6366f1 !important;
  color: white !important;
}

.table-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
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

.win-score {
  color: #059669;
  font-weight: 600;
}

.lose-score {
  color: #dc2626;
  font-weight: 600;
}.win-score {
  color: #059669;
  font-weight: 600;
}

.team-badge {
  display: inline-block;
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.team-badge.team-1 {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.team-badge.team-2 {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.value-positive {
  color: #059669;
  font-weight: 600;
}

.value-negative {
  color: #dc2626;
  font-weight: 600;
}

.rank-display-cell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: scale(0.75);
  transform-origin: center;
}

.predicted-rank-mark {
  position: absolute;
  top: -0.15rem;
  right: -0.45rem;
  color: #f59e0b;
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1;
}

.score-increase {
  color: #059669;
  font-weight: 600;
}

.score-decrease {
  color: #dc2626;
  font-weight: 600;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.avatar-link,
.nickname-link {
  cursor: pointer;
  transition: opacity 0.2s;
  display: inline-block;
  text-decoration: none;
  color: inherit;
}

.avatar-link:hover {
  opacity: 0.7;
}

.nickname-link {
  color: #6366f1;
}

.nickname-link:hover {
  color: #4f46e5;
  text-decoration: underline;
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
  .query-form {
    grid-template-columns: 1fr;
  }

  .table-section {
    padding: 1rem;
  }

  :deep(.el-table) {
    font-size: 0.875rem;
  }
}
</style>
