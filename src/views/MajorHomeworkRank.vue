<template>
  <div class="major-homework-page">
    <div class="page-toolbar">
      <div>
        <h2>Major 作业排名</h2>
        <p>{{ rankData?.stage || 'loading' }}</p>
      </div>
      <el-button @click="router.push('/major-homework/me')">
        <UserRound :size="16" />
        个人作业
      </el-button>
      <el-button :loading="loading" @click="loadRankData">
        <RefreshCw :size="16" />
        刷新
      </el-button>
    </div>

    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />

    <div v-loading="loading" class="rank-shell">
      <table v-if="rankData && rankData.players.length" class="homework-table">
        <thead>
          <tr>
            <th class="avatar-col">头像</th>
            <th class="rate-col">正确率</th>
            <th class="choices-col">
              <div class="choice-header-grid">
                <span class="label-30">3-0</span>
                <span class="label-advance">晋级</span>
                <span class="label-03">0-3</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="result-row">
            <td class="avatar-cell result-label">赛果</td>
            <td class="rate-cell result-rate">-</td>
            <td class="choices-cell">
              <div class="choices-grid">
                <button
                  v-for="(pick, index) in flatResultPicks()"
                  :key="`result-${index}-${pick.category}-${pick.team}`"
                  class="team-pick"
                  :class="[pick.team === '?' ? 'status-unknown' : `status-${pick.status}`]"
                  :title="pick.team === '?' ? '未确定' : `${pick.team} ${pick.wins}-${pick.losses}`"
                >
                  <img v-if="pick.logo" :src="pick.logo" :alt="pick.team" loading="eager">
                  <span v-else>{{ pick.team }}</span>
                </button>
              </div>
            </td>
          </tr>
          <tr v-for="player in rankData.players" :key="player.uid">
            <td class="avatar-cell">
              <button class="avatar-button" :title="`查看 ${player.uid} 的作业`" @click="openPersonal(player.uid)">
                <img class="avatar" :src="player.avatar" alt="" loading="lazy">
              </button>
            </td>
            <td class="rate-cell">{{ formatPercent(player.probability) }}</td>
            <td class="choices-cell">
              <div class="choices-grid">
                <button
                  v-for="pick in flatPicks(player)"
                  :key="`${player.uid}-${pick.category}-${pick.team}`"
                  class="team-pick"
                  :class="`status-${pick.status}`"
                  :title="`${pick.team} ${pick.wins}-${pick.losses}`"
                >
                  <img v-if="pick.logo" :src="pick.logo" :alt="pick.team" loading="lazy">
                  <span v-else>{{ shortTeamName(pick.team) }}</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <el-empty v-else-if="!loading" description="暂无作业" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { RefreshCw, UserRound } from 'lucide-vue-next'
import { majorHomeworkAPI, type MajorHomeworkPick, type MajorHomeworkRankItem, type MajorHomeworkRankResponse } from '../api'

const router = useRouter()
const rankData = ref<MajorHomeworkRankResponse | null>(null)
const loading = ref<boolean>(false)
const error = ref<string>('')

const loadRankData = async (): Promise<void> => {
  loading.value = true
  error.value = ''
  try {
    rankData.value = await majorHomeworkAPI.getRank()
  } catch (err: any) {
    error.value = err.response?.data?.detail || '作业排名加载失败'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const formatPercent = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) {
    return '-'
  }
  const normalized = Math.abs(value) <= 1.000001 ? value * 100 : value
  const bounded = Math.max(0, Math.min(100, normalized))
  return `${bounded.toFixed(1)}%`
}

const shortTeamName = (team: string): string => {
  return team.slice(0, 3).toUpperCase()
}

const openPersonal = (uid: string): void => {
  router.push(`/major-homework/user/${encodeURIComponent(uid)}`)
}

const flatPicks = (player: MajorHomeworkRankItem): MajorHomeworkPick[] => {
  return [
    ...(player.picks['3-0'] || []),
    ...(player.picks['3-1/3-2'] || []),
    ...(player.picks['0-3'] || []),
  ]
}

const flatResultPicks = (): MajorHomeworkPick[] => {
  if (!rankData.value) {
    return []
  }
  return [
    ...(rankData.value.resultPicks['3-0'] || []),
    ...(rankData.value.resultPicks['3-1/3-2'] || []),
    ...(rankData.value.resultPicks['0-3'] || []),
  ]
}

onMounted(loadRankData)
</script>

<style scoped>
.major-homework-page {
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

.page-toolbar h2 {
  margin: 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0;
}

.page-toolbar p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.page-toolbar :deep(.el-button) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.rank-shell {
  min-height: 220px;
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.homework-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.homework-table th,
.homework-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #eef2f7;
  text-align: left;
  vertical-align: middle;
}

.homework-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.homework-table tbody tr:hover {
  background: #f9fafb;
}

.homework-table tbody tr:last-child td {
  border-bottom: 0;
}

.avatar-col {
  width: 72px;
}

.rate-col {
  width: 88px;
}

.choices-col {
  width: var(--choices-width);
}

.avatar-cell,
.rate-cell {
  white-space: nowrap;
}

.avatar {
  display: block;
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  object-fit: cover;
  background: #f3f4f6;
}

.avatar-button {
  display: inline-flex;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.avatar-button:hover .avatar {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.16);
}

.rate-cell {
  color: #111827;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.result-row {
  background: #fbfdff;
}

.homework-table tbody .result-row:hover {
  background: #fbfdff;
}

.result-label {
  color: #334155;
  font-size: 14px;
  font-weight: 800;
}

.result-rate {
  color: #94a3b8;
}

.choices-cell {
  width: var(--choices-width);
  min-width: var(--choices-width);
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

.status-unknown {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.status-unknown span {
  color: #64748b;
  font-size: 18px;
}

@media (max-width: 768px) {
  .page-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .homework-table {
    min-width: 620px;
  }

  .homework-table th,
  .homework-table td {
    padding: 8px;
  }

  .major-homework-page {
    --pick-size: 36px;
    --pick-gap: 3px;
  }

  .team-pick img {
    max-width: 27px;
    max-height: 27px;
  }
}
</style>
