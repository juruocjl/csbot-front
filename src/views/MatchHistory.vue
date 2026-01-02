<template>
  <div class="history-container">
    <div class="history-header">
      <h2>比赛历史记录</h2>
    </div>

    <div class="query-section">
      <div class="query-form">
        <div class="form-group">
          <label>Steam ID</label>
          <input v-model="querySteamId" class="form-input" placeholder="输入 Steam ID">
        </div>
        <div class="form-group">
          <label>时间范围</label>
          <select v-model="queryTimeType" class="form-select">
            <option value="今日">今日</option>
            <option value="昨日">昨日</option>
            <option value="本周">本周</option>
            <option value="本赛季">本赛季</option>
            <option value="上赛季">上赛季</option>
            <option value="全部">全部</option>
          </select>
        </div>
      </div>
      
      <!-- 玩家基本信息 -->
      <div v-if="playerInfo" class="player-info">
        <div class="player-card">
          <el-avatar :src="`/imgs/avatar/${querySteamId}.png`" :alt="playerInfo.nickname" :size="64"></el-avatar>
          <div class="player-details">
            <h3>{{ playerInfo.nickname }}</h3>
            <p class="last-update">更新于：{{ formatTimestamp(playerInfo.lastUpdate) }}</p>
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
              <div>
                <router-link :to="`/match?id=${row.matchId}`" class="match-link" :title="row.matchId">
                  {{ formatMatchId(row.matchId) }}
                </router-link>
              </div>
              <div style="font-size: 12px; color: #999; margin-top: 4px;">
                {{ row.season }} / {{ formatMonthDay(row.timeStamp) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="模式" align="center">
            <template #default="{ row }">
              {{ row.mode }}
            </template>
          </el-table-column>
          <el-table-column label="地图" align="center">
            <template #default="{ row }">
              {{ row.mapName }}
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
              <div style="transform: scale(0.75); transform-origin: center; display: inline-block;">
                <RankBadge 
                  :pvp-score="row.pvpScore" 
                  :pvp-stars="row.pvpStars" 
                  :season="row.season" 
                />
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
import { authAPI, commonAPI, type MatchHistoryResponse, type PlayerBase } from '../api'
import { ElMessage } from 'element-plus'
import RankBadge from '../components/RankBadge.vue'

const route = useRoute()
const router = useRouter()

const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const historyData = ref<MatchHistoryResponse | null>(null)
const playerInfo = ref<PlayerBase | null>(null)

const querySteamId = ref<string>(route.query.steamId as string || '')
const queryTimeType = ref<string>(route.query.timeType as string || '全部')
const currentPage = ref<number>(Number(route.query.page) || 1)
const pageSize = ref<number>(20)

onMounted(async () => {
  // 如果 URL 中没有 steamId，获取当前用户信息后使用用户的 steamId
  if (!querySteamId.value) {
    try {
      const userInfo = await authAPI.getInfo()
      if (userInfo.steamId) {
        querySteamId.value = userInfo.steamId
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
    }
  }
  
  // 如果有 steamId，获取玩家基本信息
  if (querySteamId.value) {
    try {
      playerInfo.value = await commonAPI.getPlayerBase(querySteamId.value)
    } catch (err) {
      console.error('获取玩家信息失败:', err)
      playerInfo.value = null
    }
    
    // 自动加载历史记录
    queryHistory()
  }
})

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

const formatMonthDay = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
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
  if (value >= 0) return `+${value.toFixed(2)}`
  return value.toFixed(2)
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
  if (playerTeam === scoreTeam) {
    // 是玩家所在的队伍
    return playerTeam === winTeam ? 'win-score' : 'lose-score'
  }
  return ''
}

const pvpScoreChangeClass = (change: number): string => {
  if (change > 0) return 'score-increase'
  if (change < 0) return 'score-decrease'
  return ''
}

const queryHistory = async (resetPage: boolean = false): Promise<void> => {
  if (!querySteamId.value.trim()) {
    ElMessage.error('请输入 Steam ID')
    return
  }

  loading.value = true
  error.value = null
  
  if (resetPage) {
    currentPage.value = 1
  }

  // 更新URL参数
  await router.push({
    path: '/history',
    query: {
      steamId: querySteamId.value.trim(),
      timeType: queryTimeType.value,
      page: currentPage.value
    }
  })

  try {
    const response = await commonAPI.getMatchHistory({
      steamId: querySteamId.value.trim(),
      timeType: queryTimeType.value,
      page: currentPage.value
    })
    historyData.value = response
  } catch (err: any) {
    error.value = '加载历史记录失败，请重试'
    console.error('获取历史记录失败:', err)
  } finally {
    loading.value = false
  }
}

const onPageChange = async (page: number): Promise<void> => {
  currentPage.value = page
  
  // 更新URL参数
  await router.push({
    path: '/history',
    query: {
      steamId: querySteamId.value.trim(),
      timeType: queryTimeType.value,
      page
    }
  })

  await queryHistory()
}

// 监听 Steam ID 改变，获取玩家信息
watch(querySteamId, async (newSteamId) => {
  if (newSteamId.trim()) {
    try {
      playerInfo.value = await commonAPI.getPlayerBase(newSteamId)
    } catch (err) {
      console.error('获取玩家信息失败:', err)
      playerInfo.value = null
    }
  }
}, { debounce: 500 })

// 监听 Steam ID 和 时间类型的变化自动查询
watch([querySteamId, queryTimeType], () => {
  if (querySteamId.value.trim()) {
    currentPage.value = 1
    queryHistory()
  }
}, { debounce: 500 })

// 监听路由参数变化
watch(() => route.query, (newQuery) => {
  if (newQuery.steamId) {
    querySteamId.value = newQuery.steamId as string
    queryTimeType.value = (newQuery.timeType as string) || ''
    currentPage.value = Number(newQuery.page) || 1
    queryHistory()
  }
}, { deep: true })</script>

<style scoped>
.history-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
  font-weight: 500;
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
