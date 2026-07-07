<template>
  <div class="watch-stage-view">
    <div class="query-section">
      <div class="query-form">
        <div class="form-group">
          <label>Steam ID</label>
          <input v-model="querySteamId" class="form-input" placeholder="输入 Steam ID">
        </div>
        <UserChoose targetPath="/watch-stage" />
        <el-button type="primary" :loading="loading" @click="loadCurrent">
          获取快照
        </el-button>
        <el-button :loading="refreshing" @click="refreshSnapshot">
          刷新
        </el-button>
      </div>

      <div class="status-row">
        <el-tag :type="statusTagType">{{ statusText }}</el-tag>
        <span v-if="snapshot?.message" class="status-message">{{ snapshot.message }}</span>
        <span v-if="snapshot?.updatedAt" class="status-message">更新于 {{ formatTime(snapshot.updatedAt) }}</span>
      </div>
    </div>

    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />

    <div v-if="snapshot?.status === 'running'" class="match-content">
      <section class="match-summary">
        <div class="summary-main">
          <div class="score-block ct">
            <span class="side-label">CT</span>
            <strong>{{ snapshot.ctScore ?? '-' }}</strong>
          </div>
          <div class="map-block">
            <MapIcon v-if="snapshot.map" :map-name="snapshot.map" />
            <div class="map-name">{{ snapshot.map || '-' }}</div>
            <div class="match-id">{{ snapshot.matchId || '-' }}</div>
          </div>
          <div class="score-block t">
            <span class="side-label">T</span>
            <strong>{{ snapshot.terroristScore ?? '-' }}</strong>
          </div>
        </div>
      </section>

      <section class="table-section">
        <div class="team-title">CT</div>
        <el-table :data="ctPlayers" style="width: 100%" row-key="steamId">
          <el-table-column label="玩家" min-width="220">
            <template #default="{ row }">
              <PlayerCell :player="row" :profile="profileOf(row.steamId)" />
            </template>
          </el-table-column>
          <el-table-column label="K/D/A" align="center" width="110">
            <template #default="{ row }">{{ row.kill }}/{{ row.death }}/{{ row.assist }}</template>
          </el-table-column>
          <el-table-column label="ADR" align="center" width="90">
            <template #default="{ row }">{{ formatFixed(row.adr, 0) }}</template>
          </el-table-column>
          <el-table-column label="HS" align="center" width="90">
            <template #default="{ row }">{{ row.headshot || '-' }}</template>
          </el-table-column>
          <el-table-column label="ELO" align="center" width="140">
            <template #default="{ row }">
              <RankCell :profile="profileOf(row.steamId)" />
            </template>
          </el-table-column>
          <el-table-column label="底蕴分" align="center" width="120">
            <template #default="{ row }">{{ profileNumber(profileOf(row.steamId)?.legacyScore, 0) }}</template>
          </el-table-column>
          <el-table-column label="平均 RT" align="center" width="110">
            <template #default="{ row }">{{ profileNumber(profileOf(row.steamId)?.avgRt, 2) }}</template>
          </el-table-column>
          <el-table-column label="平均 WE" align="center" width="110">
            <template #default="{ row }">{{ profileNumber(profileOf(row.steamId)?.avgWe, 1) }}</template>
          </el-table-column>
          <el-table-column label="资料" align="center" min-width="150">
            <template #default="{ row }">
              <ProfileStatus :profile="profileOf(row.steamId)" />
            </template>
          </el-table-column>
        </el-table>

        <div class="team-title terrorist">T</div>
        <el-table :data="tPlayers" style="width: 100%" row-key="steamId">
          <el-table-column label="玩家" min-width="220">
            <template #default="{ row }">
              <PlayerCell :player="row" :profile="profileOf(row.steamId)" />
            </template>
          </el-table-column>
          <el-table-column label="K/D/A" align="center" width="110">
            <template #default="{ row }">{{ row.kill }}/{{ row.death }}/{{ row.assist }}</template>
          </el-table-column>
          <el-table-column label="ADR" align="center" width="90">
            <template #default="{ row }">{{ formatFixed(row.adr, 0) }}</template>
          </el-table-column>
          <el-table-column label="HS" align="center" width="90">
            <template #default="{ row }">{{ row.headshot || '-' }}</template>
          </el-table-column>
          <el-table-column label="ELO" align="center" width="140">
            <template #default="{ row }">
              <RankCell :profile="profileOf(row.steamId)" />
            </template>
          </el-table-column>
          <el-table-column label="底蕴分" align="center" width="120">
            <template #default="{ row }">{{ profileNumber(profileOf(row.steamId)?.legacyScore, 0) }}</template>
          </el-table-column>
          <el-table-column label="平均 RT" align="center" width="110">
            <template #default="{ row }">{{ profileNumber(profileOf(row.steamId)?.avgRt, 2) }}</template>
          </el-table-column>
          <el-table-column label="平均 WE" align="center" width="110">
            <template #default="{ row }">{{ profileNumber(profileOf(row.steamId)?.avgWe, 1) }}</template>
          </el-table-column>
          <el-table-column label="资料" align="center" min-width="150">
            <template #default="{ row }">
              <ProfileStatus :profile="profileOf(row.steamId)" />
            </template>
          </el-table-column>
        </el-table>
      </section>
    </div>

    <div v-else-if="!loading" class="empty-wrap">
      <el-empty :description="emptyText" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ElTag } from 'element-plus'
import UserChoose from '../components/UserChoose.vue'
import MapIcon from '../components/MapIcon.vue'
import RankBadge from '../components/RankBadge.vue'
import { watchStageAPI, type WatchStageLivePlayer, type WatchStagePlayerProfile, type WatchStageSnapshot } from '../api'

const route = useRoute()
const router = useRouter()
const querySteamId = ref<string>(route.query.steamId as string || '')
const snapshot = ref<WatchStageSnapshot | null>(null)
const loading = ref<boolean>(false)
const refreshing = ref<boolean>(false)
const errorMessage = ref<string>('')

const PlayerCell = defineComponent({
  props: {
    player: { type: Object, required: true },
    profile: { type: Object, required: false }
  },
  setup(props) {
    return () => {
      const player = props.player as WatchStageLivePlayer
      const profile = props.profile as WatchStagePlayerProfile | undefined
      const nickname = profile?.nickname || player.steamId
      return h(RouterLink, {
        to: `/data?steamId=${player.steamId}`,
        class: 'nickname-link',
        title: nickname
      }, () => nickname)
    }
  }
})

const RankCell = defineComponent({
  props: {
    profile: { type: Object, required: false }
  },
  setup(props) {
    return () => {
      const profile = props.profile as WatchStagePlayerProfile | undefined
      if (!profile?.pvpScore) return h('span', { class: 'muted' }, '-')
      return h(RankBadge, {
        pvpScore: profile.pvpScore,
        pvpStars: profile.pvpStars ?? 0
      })
    }
  }
})

const ProfileStatus = defineComponent({
  props: {
    profile: { type: Object, required: false }
  },
  setup(props) {
    return () => {
      const profile = props.profile as WatchStagePlayerProfile | undefined
      if (!profile) return h(ElTag, { type: 'info' }, () => '等待')
      if (profile.status === 'ready') return h(ElTag, { type: 'success' }, () => '已就绪')
      if (profile.status === 'updating') return h(ElTag, { type: 'warning' }, () => '抓取中')
      if (profile.status === 'limited') return h(ElTag, { type: 'warning', title: profile.message || '' }, () => '限频')
      if (profile.status === 'failed') return h(ElTag, { type: 'danger', title: profile.message || '' }, () => '失败')
      return h(ElTag, { type: 'info' }, () => '暂无')
    }
  }
})

const ctPlayers = computed(() => {
  return (snapshot.value?.players || []).filter((player) => player.side === 'CT')
})

const tPlayers = computed(() => {
  return (snapshot.value?.players || []).filter((player) => player.side === 'TERRORIST')
})

const statusText = computed(() => {
  if (loading.value) return '连接中'
  if (!snapshot.value) return '未连接'
  if (snapshot.value.status === 'running') return '观战中'
  if (snapshot.value.status === 'pending') return '等待数据'
  if (snapshot.value.status === 'closed') return '已断开'
  return snapshot.value.status
})

const statusTagType = computed(() => {
  if (snapshot.value?.status === 'running') return 'success'
  if (snapshot.value?.status === 'pending') return 'warning'
  if (snapshot.value?.status === 'closed') return 'danger'
  return 'info'
})

const emptyText = computed(() => {
  if (!querySteamId.value) return '请选择或输入一个玩家'
  if (snapshot.value?.status === 'pending') return '正在等待观将台推送'
  if (snapshot.value?.status === 'closed') return '当前没有可用的观将台连接'
  return '暂无比赛数据'
})

const profileOf = (steamId: string): WatchStagePlayerProfile | undefined => {
  return snapshot.value?.profiles?.[steamId]
}

const formatFixed = (value: number | null | undefined, digits: number): string => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '-'
  return num.toFixed(digits)
}

const profileNumber = (value: number | null | undefined, digits: number): string => {
  if (value === null || value === undefined) return '-'
  return formatFixed(value, digits)
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleTimeString('zh-CN')
}

const refreshSnapshot = async (): Promise<void> => {
  const steamId = querySteamId.value.trim()
  if (!steamId) return
  refreshing.value = true
  errorMessage.value = ''
  try {
    snapshot.value = await watchStageAPI.getSnapshot(steamId)
  } catch (error: any) {
    errorMessage.value = error.response?.data?.detail || '获取观将台快照失败'
  } finally {
    refreshing.value = false
  }
}

const loadCurrent = async (): Promise<void> => {
  const steamId = querySteamId.value.trim()
  if (!steamId) return
  loading.value = true
  errorMessage.value = ''
  if (route.query.steamId !== steamId) {
    await router.replace({ path: '/watch-stage', query: { steamId } })
  }
  try {
    snapshot.value = await watchStageAPI.getSnapshot(steamId)
  } catch (error: any) {
    errorMessage.value = error.response?.data?.detail || '连接观将台失败'
  } finally {
    loading.value = false
  }
}

watch(() => route.query.steamId, async (value) => {
  querySteamId.value = value as string || ''
  if (querySteamId.value) {
    if (!loading.value) {
      await loadCurrent()
    }
  } else {
    snapshot.value = null
  }
})

onMounted(async () => {
  if (querySteamId.value) {
    await loadCurrent()
  }
})
</script>

<style scoped>
.watch-stage-view {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.query-section,
.match-summary,
.table-section,
.empty-wrap {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
}

.query-form {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto auto auto;
  gap: 0.75rem;
  align-items: end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.86rem;
  color: #374151;
  font-weight: 600;
}

.form-input {
  height: 32px;
  padding: 0 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

.status-row {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 0.75rem;
}

.status-message,
.muted {
  font-size: 0.82rem;
  color: #6b7280;
}

.match-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary-main {
  display: grid;
  grid-template-columns: 1fr minmax(180px, 280px) 1fr;
  align-items: center;
  gap: 1rem;
}

.score-block {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.5rem;
}

.score-block strong {
  font-size: 2rem;
  line-height: 1;
}

.side-label {
  font-size: 0.85rem;
  font-weight: 800;
}

.ct .side-label {
  color: #2563eb;
}

.t .side-label,
.terrorist {
  color: #d97706;
}

.map-block {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.map-name {
  font-weight: 700;
  color: #111827;
}

.match-id {
  font-size: 0.76rem;
  color: #9ca3af;
}

.table-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.team-title {
  font-weight: 800;
  color: #2563eb;
}

.nickname-link {
  font-size: 0.9rem;
  font-weight: 700;
  color: #2563eb;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: 100%;
}

.nickname-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

:deep(.rank-display-cell),
:deep(.rank-badge-svg) {
  transform: scale(0.72);
  transform-origin: center;
}

@media (max-width: 900px) {
  .query-form,
  .summary-main {
    grid-template-columns: 1fr;
  }
}
</style>
