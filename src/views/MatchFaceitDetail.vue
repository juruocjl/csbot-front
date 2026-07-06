<template>
  <div class="match-detail">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="error-container">
      <h3>{{ error }}</h3>
      <div class="error-actions">
        <el-button @click="loadMatchInfo">重试</el-button>
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>
    <div v-else-if="matchData" class="match-content">
      <section class="match-info-card">
        <div class="info-row">
          <div class="info-item">
            <label>比赛 ID</label>
            <span>{{ matchData.matchId }}</span>
          </div>
          <div class="info-item">
            <label>时间</label>
            <span>{{ formatTimestamp(matchData.timestamp) }}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item">
            <label>模式</label>
            <span><el-tag type="warning" size="small">FACEIT</el-tag> {{ matchData.competitionName || matchData.mode }}</span>
          </div>
          <div class="info-item">
            <label>地图</label>
            <MapIcon :map-name="matchData.mapName" />
          </div>
        </div>
        <div class="score-display">
          <div class="team-score" :class="team1StyleClass">
            <span class="team-label">队伍 1</span>
            <span class="score">{{ matchData.team1Score }}</span>
          </div>
          <span class="vs">VS</span>
          <div class="team-score" :class="team2StyleClass">
            <span class="team-label">队伍 2</span>
            <span class="score">{{ matchData.team2Score }}</span>
          </div>
        </div>
      </section>

      <section class="players-section">
        <h3>玩家数据</h3>
        <div class="comparison-table">
          <el-table :data="allPlayersWithTeam" style="width: 100%" :row-class-name="getRowClassName">
            <el-table-column label="" align="center" width="4" />
            <el-table-column label="头像" align="center" width="80">
              <template #default="{ row }">
                <router-link v-if="row.steamId" :to="`/data?steamId=${row.steamId}`" class="avatar-link">
                  <el-avatar :src="`/imgs/avatar/${row.steamId}.png`" :alt="row.nickname" :size="40" @error="handleImageError" />
                </router-link>
                <el-avatar v-else :alt="row.nickname" :size="40">{{ row.nickname.slice(0, 1) }}</el-avatar>
              </template>
            </el-table-column>
            <el-table-column label="昵称" min-width="120" align="center">
              <template #default="{ row }">
                <router-link v-if="row.steamId" :to="`/data?steamId=${row.steamId}`" class="nickname-link">
                  {{ row.nickname }}
                </router-link>
                <span v-else>{{ row.nickname }}</span>
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
            <el-table-column label="K/D/A" align="center">
              <template #default="{ row }">
                {{ row.kills }}/{{ row.deaths }}/{{ row.assists }}
              </template>
            </el-table-column>
            <el-table-column label="KD Diff" align="center">
              <template #default="{ row }">
                <span :class="kdDiffClass(row.kills, row.deaths)">{{ calculateKDDiff(row.kills, row.deaths) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="HS%" align="center">
              <template #default="{ row }">
                {{ row.headshotsPct }}%
              </template>
            </el-table-column>
            <el-table-column label="MVP" align="center">
              <template #default="{ row }">
                {{ row.mvps }}
              </template>
            </el-table-column>
            <el-table-column label="FACEIT" align="center" min-width="110">
              <template #default="{ row }">
                <FaceitLevelBadge :skill-level="row.skillLevel" :faceit-elo="row.faceitElo" compact />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { commonAPI, type MatchFaceitInfo, type MatchFaceitPlayerInfo } from '../api'
import MapIcon from '../components/MapIcon.vue'
import FaceitLevelBadge from '../components/FaceitLevelBadge.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref<string | null>(null)
const matchData = ref<MatchFaceitInfo | null>(null)

const team1Players = computed<MatchFaceitPlayerInfo[]>(() => {
  const list = matchData.value?.players.filter((p) => p.team === 1) || []
  return [...list].sort((a, b) => Number(b.adr) - Number(a.adr))
})

const team2Players = computed<MatchFaceitPlayerInfo[]>(() => {
  const list = matchData.value?.players.filter((p) => p.team === 2) || []
  return [...list].sort((a, b) => Number(b.adr) - Number(a.adr))
})

const allPlayersWithTeam = computed<Array<MatchFaceitPlayerInfo & { teamName: string }>>(() => [
  ...team1Players.value.map((p) => ({ ...p, teamName: '队伍 1' })),
  ...team2Players.value.map((p) => ({ ...p, teamName: '队伍 2' }))
])

const team1StyleClass = computed(() => teamStyle(1))
const team2StyleClass = computed(() => teamStyle(2))

const teamStyle = (team: number): string => {
  if (!matchData.value || matchData.value.winTeam === 0) return ''
  if (matchData.value.userTeam === team) return matchData.value.winTeam === team ? 'winner' : 'loser'
  return matchData.value.winTeam === team ? 'winner' : ''
}

const loadMatchInfo = async (): Promise<void> => {
  const matchId = route.query.id as string
  if (!matchId) {
    error.value = '缺少比赛 ID'
    return
  }
  loading.value = true
  error.value = null
  try {
    matchData.value = await commonAPI.getMatchFaceitInfo(matchId)
  } catch (err: any) {
    error.value = err.response?.status === 404 ? '比赛不存在' : '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

const formatTimestamp = (timestamp: number): string => new Date(timestamp * 1000).toLocaleString('zh-CN')

const formatNumber = (value: number, digits: number): string => {
  const num = Number(value)
  return Number.isFinite(num) ? num.toFixed(digits) : '-'
}

const calculateKDDiff = (kills: number, deaths: number): string => {
  const diff = Number(kills) - Number(deaths)
  if (!Number.isFinite(diff)) return '-'
  return diff > 0 ? `+${diff}` : `${diff}`
}

const kdDiffClass = (kills: number, deaths: number): string => {
  const diff = Number(kills) - Number(deaths)
  if (diff > 0) return 'value-positive'
  if (diff < 0) return 'value-negative'
  return ''
}

const valueClass = (value: number, threshold: number): string => {
  const num = Number(value)
  if (!Number.isFinite(num)) return ''
  return num >= threshold ? 'value-positive' : 'value-negative'
}

const getRowClassName = ({ row }: { row: MatchFaceitPlayerInfo & { teamName: string } }): string => {
  return row.team === 1 ? 'team-1-row' : 'team-2-row'
}

const handleImageError = (event: Event): void => {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect fill="%23e5e7eb" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="18"%3E?%3C/text%3E%3C/svg%3E'
}

const goBack = (): void => {
  router.back()
}

onMounted(loadMatchInfo)
</script>

<style scoped>
.match-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.match-info-card,
.players-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 16px;
}

.info-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item label {
  color: #6b7280;
  font-size: 13px;
}

.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-top: 14px;
}

.team-score {
  min-width: 120px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score {
  font-size: 24px;
  font-weight: 800;
}

.winner {
  border-color: #16a34a;
  background: #f0fdf4;
}

.loser {
  border-color: #dc2626;
  background: #fef2f2;
}

.comparison-table {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.team-1-row .el-table__cell:first-child) {
  background: #6366f1;
}

:deep(.team-2-row .el-table__cell:first-child) {
  background: #f59e0b;
}

.avatar-link,
.nickname-link {
  color: #2563eb;
  text-decoration: none;
}

.value-positive {
  color: #059669;
  font-weight: 700;
}

.value-negative {
  color: #dc2626;
  font-weight: 700;
}

.loading-container,
.error-container {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.error-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 768px) {
  .score-display {
    flex-direction: column;
  }
}
</style>
