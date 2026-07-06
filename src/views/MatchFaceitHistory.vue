<template>
  <div class="history-faceit-container">
    <section class="query-section">
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
        <UserChoose targetPath="/history-faceit" />
        <el-button type="primary" @click="switchToHistory">完美</el-button>
        <el-button type="primary" @click="switchToGPHistory">官匹</el-button>
      </div>
      <div class="player-info">
        <div class="player-card">
          <router-link :to="`/data?steamId=${querySteamId}`" class="avatar-link">
            <el-avatar :src="`/imgs/avatar/${querySteamId}.png`" :alt="playerInfo?.nickname || '未知玩家'" :size="64" @error="handleImageError" />
          </router-link>
          <div class="player-details">
            <router-link :to="`/data?steamId=${querySteamId}`" class="nickname-link">
              <h3>{{ playerInfo?.nickname || faceitInfo?.nickname || '未知玩家' }}</h3>
            </router-link>
            <p class="last-update">
              <el-button @click="updateMatchHistory"><RefreshCw :size="16" /></el-button>
              <FaceitLevelBadge
                v-if="faceitInfo?.playerId"
                :skill-level="faceitInfo.skillLevel || 0"
                :faceit-elo="faceitInfo.faceitElo"
              />
              <span v-else>未绑定 FACEIT</span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="history-content">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      <div v-else-if="error" class="error-container">
        <h3>{{ error }}</h3>
        <el-button @click="queryHistory">重试</el-button>
      </div>
      <div v-else class="table-section">
        <div class="result-info">
          共 <strong>{{ historyData?.totCount || 0 }}</strong> 场 FACEIT 比赛
        </div>
        <el-table :data="historyData?.matches || []" style="width: 100%">
          <el-table-column label="比赛 ID" align="center">
            <template #default="{ row }">
              <router-link :to="`/match-faceit?id=${row.matchId}`" class="match-link" :title="row.matchId">
                {{ formatMatchId(row.matchId) }}
              </router-link>
              <p class="match-subtext">{{ formatTime(row.timeStamp) }}</p>
            </template>
          </el-table-column>
          <el-table-column label="模式" align="center">
            <template #default="{ row }">
              <el-tag type="warning" size="small">FACEIT</el-tag>
              {{ row.competitionName || row.mode }}
            </template>
          </el-table-column>
          <el-table-column label="地图" align="center">
            <template #default="{ row }">
              <div class="map-cell">
                <MapIcon :map-name="row.mapName" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="比分" align="center">
            <template #default="{ row }">
              <span :class="scoreClass(row.team, row.winTeam, 1)">{{ row.team1Score }}</span>
              <span> - </span>
              <span :class="scoreClass(row.team, row.winTeam, 2)">{{ row.team2Score }}</span>
            </template>
          </el-table-column>
          <el-table-column label="K/D/A" align="center">
            <template #default="{ row }">
              {{ row.kills }}/{{ row.deaths }}/{{ row.assists }}
            </template>
          </el-table-column>
          <el-table-column label="ADR" align="center">
            <template #default="{ row }">
              <span :class="valueClass(row.adr, 75)">{{ formatNumber(row.adr, 1) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="K/D" align="center">
            <template #default="{ row }">
              <span :class="valueClass(row.kdRatio, 1)">{{ formatNumber(row.kdRatio, 2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="FACEIT" align="center">
            <template #default="{ row }">
              <FaceitLevelBadge :skill-level="row.skillLevel" :faceit-elo="row.faceitElo" />
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="historyData?.totCount || 0"
            layout="prev, pager, next, total"
            @current-change="onPageChange"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { watchDebounced } from '@vueuse/core'
import { RefreshCw } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { authAPI, commonAPI, configAPI, type InfoFaceitResponse, type MatchFaceitHistoryResponse, type PlayerBase } from '../api'
import UserChoose from '../components/UserChoose.vue'
import MapIcon from '../components/MapIcon.vue'
import FaceitLevelBadge from '../components/FaceitLevelBadge.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref<string | null>(null)
const historyData = ref<MatchFaceitHistoryResponse | null>(null)
const playerInfo = ref<PlayerBase | null>(null)
const faceitInfo = ref<InfoFaceitResponse | null>(null)
const timeTypes = ref<string[]>([])
const querySteamId = ref<string>(route.query.steamId as string || '')
const queryTimeType = ref<string>(route.query.timeType as string || '')
const currentPage = ref<number>(Number(route.query.page) || 1)
const pageSize = ref(20)

onMounted(async () => {
  try {
    const timeTypeResponse = await configAPI.getTimeTypes()
    timeTypes.value = timeTypeResponse.gpTimeTypes
  } catch {
    timeTypes.value = []
  }
  if (!queryTimeType.value && timeTypes.value.length > 0) {
    queryTimeType.value = timeTypes.value[timeTypes.value.length - 1]
  }
  if (!querySteamId.value) {
    const result = await authAPI.getInfoSteamId()
    if (result.steamId) querySteamId.value = result.steamId
  }
  if (querySteamId.value) {
    await loadPlayerInfo()
    await loadFaceitInfo()
  }
  if (querySteamId.value && queryTimeType.value) await loadHistoryData()
})

const loadPlayerInfo = async (): Promise<void> => {
  try {
    playerInfo.value = await commonAPI.getPlayerBase(querySteamId.value)
  } catch {
    playerInfo.value = null
  }
}

const loadFaceitInfo = async (): Promise<void> => {
  try {
    const info = await authAPI.getInfoFaceit()
    faceitInfo.value = info.steamId === querySteamId.value ? info : null
  } catch {
    faceitInfo.value = null
  }
}

const updateMatchHistory = async (): Promise<void> => {
  ElMessage.info('正在请求更新比赛历史，请稍候...')
  try {
    const result = await commonAPI.updatePlayerData(querySteamId.value)
    ElMessage.success(`${result.nickname} 更新 ${result.matchCount} 场完美比赛，${result.matchgpCount} 场官匹比赛，${result.faceitCount} 场 FACEIT 比赛`)
    await loadPlayerInfo()
    await loadFaceitInfo()
    await loadHistoryData()
  } catch (err: any) {
    ElMessage.error(err.response?.data?.detail || '更新失败，请稍后重试')
  }
}

const queryHistory = async (): Promise<void> => {
  if (!querySteamId.value.trim() || !queryTimeType.value) return
  await router.replace({
    path: '/history-faceit',
    query: { steamId: querySteamId.value.trim(), timeType: queryTimeType.value, page: currentPage.value }
  })
}

const loadHistoryData = async (): Promise<void> => {
  loading.value = true
  error.value = null
  try {
    historyData.value = await commonAPI.getMatchFaceitHistory({
      steamId: querySteamId.value.trim(),
      timeType: queryTimeType.value,
      page: currentPage.value
    })
  } catch (err: any) {
    error.value = err.response?.data?.detail || '加载 FACEIT 历史失败'
  } finally {
    loading.value = false
  }
}

const onPageChange = async (page: number): Promise<void> => {
  currentPage.value = page
  await queryHistory()
}

const switchToHistory = (): void => {
  router.push({ path: '/history', query: { steamId: querySteamId.value.trim(), timeType: queryTimeType.value, page: 1 } })
}

const switchToGPHistory = (): void => {
  router.push({ path: '/history-gp', query: { steamId: querySteamId.value.trim(), timeType: queryTimeType.value, page: 1 } })
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

const formatMatchId = (matchId: string): string => matchId.slice(-8)

const formatNumber = (value: number, digits: number): string => {
  const num = Number(value)
  return Number.isFinite(num) ? num.toFixed(digits) : '-'
}

const valueClass = (value: number, threshold: number): string => {
  const num = Number(value)
  if (!Number.isFinite(num)) return ''
  return num >= threshold ? 'value-positive' : 'value-negative'
}

const scoreClass = (playerTeam: number, winTeam: number, scoreTeam: number): string => {
  if (winTeam === 0 || playerTeam !== scoreTeam) return ''
  return playerTeam === winTeam ? 'win-score' : 'lose-score'
}

const handleImageError = (e: Event): void => {
  const img = e.target as HTMLImageElement
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect fill="%23e5e7eb" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="22"%3E?%3C/text%3E%3C/svg%3E'
}

watch(() => route.query, async (newQuery) => {
  querySteamId.value = newQuery.steamId as string || ''
  queryTimeType.value = newQuery.timeType as string || queryTimeType.value
  currentPage.value = Number(newQuery.page) || 1
  if (querySteamId.value) {
    await loadPlayerInfo()
    await loadFaceitInfo()
    await loadHistoryData()
  }
}, { deep: true })

watchDebounced([querySteamId, queryTimeType], async () => {
  currentPage.value = 1
  await queryHistory()
}, { debounce: 500 })
</script>

<style scoped>
.history-faceit-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-section,
.history-content {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 16px;
}

.query-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-input,
.form-select {
  min-width: 180px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 8px 10px;
}

.player-card {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.player-details h3 {
  margin: 0;
}

.last-update {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 0;
  color: #6b7280;
}

.map-cell {
  display: flex;
  justify-content: center;
}

.match-link,
.nickname-link,
.avatar-link {
  color: #2563eb;
  text-decoration: none;
}

.match-subtext {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.result-info,
.pagination-section {
  margin: 12px 0;
}

.loading-container,
.error-container {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.value-positive,
.win-score {
  color: #059669;
  font-weight: 700;
}

.value-negative,
.lose-score {
  color: #dc2626;
  font-weight: 700;
}
</style>
