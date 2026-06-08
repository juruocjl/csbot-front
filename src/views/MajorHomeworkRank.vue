<template>
  <div class="major-homework-page">
    <div class="page-toolbar">
      <div>
        <h2>Major 作业排名</h2>
        <p>{{ rankData?.stage || 'loading' }}</p>
      </div>
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
            <th v-for="category in rankData.categories" :key="category">
              {{ category }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in rankData.players" :key="player.uid">
            <td class="avatar-cell">
              <img class="avatar" :src="player.avatar" alt="" loading="lazy">
            </td>
            <td class="rate-cell">{{ formatPercent(player.probability) }}</td>
            <td v-for="category in rankData.categories" :key="category" class="pick-cell">
              <div class="pick-list" :class="`pick-list-${categoryClass(category)}`">
                <button
                  v-for="pick in player.picks[category] || []"
                  :key="`${player.uid}-${category}-${pick.team}`"
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
import { ElMessage } from 'element-plus'
import { RefreshCw } from 'lucide-vue-next'
import { majorHomeworkAPI, type MajorHomeworkRankResponse } from '../api'

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
  const normalized = Math.abs(value) <= 1 ? value * 100 : value
  return `${normalized.toFixed(1)}%`
}

const shortTeamName = (team: string): string => {
  return team.slice(0, 3).toUpperCase()
}

const categoryClass = (category: string): string => {
  return category.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

onMounted(loadRankData)
</script>

<style scoped>
.major-homework-page {
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
  width: 100%;
  min-width: 860px;
  border-collapse: separate;
  border-spacing: 0;
}

.homework-table th,
.homework-table td {
  padding: 10px 12px;
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
  width: 96px;
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

.rate-cell {
  color: #111827;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.pick-cell {
  min-width: 176px;
}

.pick-list {
  display: grid;
  gap: 6px;
}

.pick-list-3-0,
.pick-list-0-3 {
  grid-template-columns: repeat(2, 44px);
}

.pick-list-3-1-3-2 {
  grid-template-columns: repeat(6, 44px);
}

.team-pick {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 4px;
  border: 2px solid;
  border-radius: 8px;
  cursor: default;
}

.team-pick img {
  max-width: 32px;
  max-height: 32px;
  object-fit: contain;
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

@media (max-width: 768px) {
  .page-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .homework-table {
    min-width: 760px;
  }

  .homework-table th,
  .homework-table td {
    padding: 8px;
  }

  .pick-list-3-1-3-2 {
    grid-template-columns: repeat(3, 44px);
  }
}
</style>
