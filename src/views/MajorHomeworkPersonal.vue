<template>
  <div class="major-homework-personal-page">
    <div class="page-toolbar">
      <div class="title-block">
        <div class="title-heading">
          <img
            v-if="personalData?.avatar"
            class="detail-avatar"
            :src="personalData.avatar"
            alt=""
            loading="eager"
          >
          <h2>{{ pageHeading }}</h2>
        </div>
        <p>{{ personalData?.stage || 'loading' }}</p>
      </div>
      <div class="toolbar-actions">
        <el-button @click="router.push('/major-homework')">
          <ListOrdered :size="16" />
          作业排名
        </el-button>
        <el-button :loading="loading" @click="loadPersonalData">
          <RefreshCw :size="16" />
          刷新
        </el-button>
      </div>
    </div>

    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />

    <div v-loading="loading" class="history-shell">
      <table v-if="personalData && personalData.rows.length" class="history-table">
        <thead>
          <tr>
            <th class="homework-col">
              <div class="choice-header-grid">
                <span class="label-30">3-0</span>
                <span class="label-advance">晋级</span>
                <span class="label-03">0-3</span>
              </div>
            </th>
            <th class="event-col">事件</th>
            <th class="rate-col">当前正确率</th>
            <th class="delta-col">正确率变化</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in personalData.rows" :key="`${row.matchCount}-${row.createdAt}-${row.homeworkText}`">
            <td class="homework-cell">
              <div class="choices-grid">
                <button
                  v-for="pick in flatPicks(row)"
                  :key="`${index}-${pick.category}-${pick.team}`"
                  class="team-pick"
                  :class="`status-${pick.status}`"
                  :title="`${pick.team} ${pick.wins}-${pick.losses}`"
                >
                  <img v-if="pick.logo" :src="pick.logo" :alt="pick.team" loading="lazy">
                  <span v-else>{{ shortTeamName(pick.team) }}</span>
                </button>
              </div>
            </td>
            <td class="event-cell">
              <div v-if="isMatchEvent(row)" class="match-event" :title="row.event">
                <span class="event-team event-winner">
                  <img v-if="row.eventWinnerLogo" :src="row.eventWinnerLogo" :alt="row.eventWinner || ''" loading="lazy">
                  <span v-else>{{ shortTeamName(row.eventWinner || '') }}</span>
                </span>
                <span class="event-score">
                  <span class="score-winner">{{ splitScore(row.eventScore).winner }}</span>
                  <span class="score-separator">:</span>
                  <span class="score-loser">{{ splitScore(row.eventScore).loser }}</span>
                </span>
                <span class="event-team">
                  <img v-if="row.eventLoserLogo" :src="row.eventLoserLogo" :alt="row.eventLoser || ''" loading="lazy">
                  <span v-else>{{ shortTeamName(row.eventLoser || '') }}</span>
                </span>
              </div>
              <span v-else class="event-main">{{ row.event }}</span>
            </td>
            <td class="rate-cell">{{ formatPercent(row.probability) }}</td>
            <td class="delta-cell" :class="deltaClass(row.probabilityChange)">
              {{ formatDelta(row.probabilityChange) }}
            </td>
          </tr>
        </tbody>
      </table>

      <el-empty v-else-if="!loading" description="暂无个人作业记录" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ListOrdered, RefreshCw } from 'lucide-vue-next'
import {
  majorHomeworkAPI,
  type MajorHomeworkPersonalResponse,
  type MajorHomeworkPersonalRow,
  type MajorHomeworkPick,
} from '../api'

const router = useRouter()
const route = useRoute()
const personalData = ref<MajorHomeworkPersonalResponse | null>(null)
const loading = ref<boolean>(false)
const error = ref<string>('')

const targetUid = computed<string>(() => {
  const rawUid = route.params.uid
  return Array.isArray(rawUid) ? rawUid[0] || '' : rawUid || ''
})

const pageHeading = computed<string>(() => {
  return targetUid.value ? '作业详情' : '个人作业'
})

const loadPersonalData = async (): Promise<void> => {
  loading.value = true
  error.value = ''
  try {
    personalData.value = await majorHomeworkAPI.getPersonal(targetUid.value || undefined)
  } catch (err: any) {
    error.value = err.response?.data?.detail || '个人作业加载失败'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const formatPercent = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) {
    return '-'
  }
  const normalized = value * 100
  const bounded = Math.max(0, Math.min(100, normalized))
  return `${bounded.toFixed(1)}%`
}

const formatDelta = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) {
    return '-'
  }
  const normalized = value * 100
  const bounded = Math.max(-100, Math.min(100, normalized))
  if (Math.abs(bounded) < 0.05) {
    return '0.0%'
  }
  return `${bounded > 0 ? '+' : ''}${bounded.toFixed(1)}%`
}

const deltaClass = (value: number | null): string => {
  if (value === null || !Number.isFinite(value) || Math.abs(value) < 0.0005) {
    return 'delta-flat'
  }
  return value > 0 ? 'delta-up' : 'delta-down'
}

const shortTeamName = (team: string): string => {
  return team.slice(0, 3).toUpperCase()
}

const isMatchEvent = (row: MajorHomeworkPersonalRow): boolean => {
  return Boolean(row.eventWinner && row.eventLoser && row.eventScore)
}

const splitScore = (score?: string | null): { winner: string; loser: string } => {
  const parts = String(score || '').split(':')
  return {
    winner: parts[0] || '',
    loser: parts[1] || '',
  }
}

const flatPicks = (row: MajorHomeworkPersonalRow): MajorHomeworkPick[] => {
  return [
    ...(row.picks['3-0'] || []),
    ...(row.picks['3-1/3-2'] || []),
    ...(row.picks['0-3'] || []),
  ]
}

onMounted(loadPersonalData)

watch(targetUid, () => {
  loadPersonalData()
})
</script>

<style scoped>
.major-homework-personal-page {
  --pick-size: 42px;
  --pick-gap: 4px;
  --choices-width: calc(var(--pick-size) * 10 + var(--pick-gap) * 9);
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
}

.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-block h2 {
  margin: 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0;
}

.detail-avatar {
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  object-fit: cover;
  background: #f3f4f6;
}

.title-block p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.toolbar-actions :deep(.el-button) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.history-shell {
  min-height: 220px;
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.history-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.history-table th,
.history-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #eef2f7;
  text-align: left;
  vertical-align: middle;
}

.history-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.history-table tbody tr:hover {
  background: #f9fafb;
}

.history-table tbody tr:last-child td {
  border-bottom: 0;
}

.homework-col,
.homework-cell {
  width: var(--choices-width);
  min-width: var(--choices-width);
}

.event-col {
  width: 210px;
}

.rate-col,
.delta-col {
  width: 112px;
}

.choice-header-grid,
.choices-grid {
  display: grid;
  grid-template-columns: repeat(10, var(--pick-size));
  gap: var(--pick-gap);
  width: var(--choices-width);
}

.choice-header-grid {
  align-items: end;
  color: #475569;
  font-size: 13px;
  line-height: 1;
}

.choice-header-grid span {
  text-align: center;
}

.label-30 {
  grid-column: 1 / span 2;
}

.label-advance {
  grid-column: 3 / span 6;
}

.label-03 {
  grid-column: 9 / span 2;
}

.team-pick {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--pick-size);
  height: var(--pick-size);
  padding: 4px;
  border: 2px solid;
  border-radius: 8px;
  cursor: default;
}

.team-pick img {
  max-width: 31px;
  max-height: 31px;
  object-fit: contain;
  filter:
    drop-shadow(0 0 1px rgba(15, 23, 42, 0.8))
    drop-shadow(0 1px 1px rgba(15, 23, 42, 0.45));
}

.team-pick span {
  color: #1f2937;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
}

.status-correct {
  border-color: #16a34a;
  background: #dcfce7;
}

.status-wrong {
  border-color: #dc2626;
  background: #fee2e2;
}

.status-pending {
  border-color: #2563eb;
  background: #dbeafe;
}

.event-cell {
  color: #111827;
}

.event-main {
  display: block;
  max-width: 210px;
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-event {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 132px;
}

.event-team {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 4px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #f8fafc;
}

.event-winner {
  border-color: #dbe3ef;
  background: #f8fafc;
}

.event-team img {
  max-width: 26px;
  max-height: 26px;
  object-fit: contain;
  filter:
    drop-shadow(0 0 1px rgba(15, 23, 42, 0.8))
    drop-shadow(0 1px 1px rgba(15, 23, 42, 0.45));
}

.event-team span {
  color: #1f2937;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0;
}

.event-score {
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  font-weight: 900;
  white-space: nowrap;
}

.score-winner {
  color: #16a34a;
}

.score-separator,
.score-loser {
  color: #111827;
}

.rate-cell,
.delta-cell {
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  white-space: nowrap;
}

.rate-cell {
  color: #111827;
}

.delta-up {
  color: #16a34a;
}

.delta-down {
  color: #dc2626;
}

.delta-flat {
  color: #64748b;
}

@media (max-width: 768px) {
  .page-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-actions {
    width: 100%;
  }

  .major-homework-personal-page {
    --pick-size: 36px;
    --pick-gap: 3px;
  }

  .team-pick img {
    max-width: 27px;
    max-height: 27px;
  }
}
</style>
