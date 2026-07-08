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
      <section class="match-info-card">
        <div class="info-row">
          <div class="info-item">
            <label>Match ID</label>
            <span>{{ snapshot.matchId || '-' }}</span>
          </div>
          <div class="info-item">
            <label>Map</label>
            <MapIcon v-if="snapshot.map" :map-name="snapshot.map" />
            <span v-else>-</span>
          </div>
        </div>
        <div class="score-display">
          <div class="team-score">
            <span class="team-label">CT</span>
            <span class="score">{{ snapshot.ctScore ?? '-' }}</span>
          </div>
          <span class="vs">VS</span>
          <div class="team-score">
            <span class="team-label">T</span>
            <span class="score">{{ snapshot.terroristScore ?? '-' }}</span>
          </div>
        </div>
        <div class="legacy-display">
          <div class="legacy-item">
            <span class="legacy-label">CT &#24213;&#34164;&#20998;</span>
            <span class="legacy-value">{{ formatTeamLegacy(ctPlayers) }}</span>
          </div>
          <div class="legacy-item">
            <span class="legacy-label">T &#24213;&#34164;&#20998;</span>
            <span class="legacy-value">{{ formatTeamLegacy(tPlayers) }}</span>
          </div>
        </div>
      </section>

      <section class="table-section">
        <div class="team-title">CT</div>
        <el-table :data="ctPlayers" style="width: 100%" row-key="steamId">
          <el-table-column :label="'\u5934\u50cf'" align="center" width="80">
            <template #default="{ row }">
              <router-link :to="`/data?steamId=${row.steamId}`" class="avatar-link">
                <el-avatar
                  :src="avatarSrc(row.steamId)"
                  :alt="playerNickname(row)"
                  :size="40"
                  shape="circle"
                  @error="handleImageError"
                />
              </router-link>
            </template>
          </el-table-column>
          <el-table-column :label="'\u6635\u79f0'" min-width="100" align="center">
            <template #default="{ row }">
              <router-link :to="`/data?steamId=${row.steamId}`" class="nickname-link">
                {{ playerNickname(row) }}
              </router-link>
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
          <el-table-column :label="'\u5934\u50cf'" align="center" width="80">
            <template #default="{ row }">
              <router-link :to="`/data?steamId=${row.steamId}`" class="avatar-link">
                <el-avatar
                  :src="avatarSrc(row.steamId)"
                  :alt="playerNickname(row)"
                  :size="40"
                  shape="circle"
                  @error="handleImageError"
                />
              </router-link>
            </template>
          </el-table-column>
          <el-table-column :label="'\u6635\u79f0'" min-width="100" align="center">
            <template #default="{ row }">
              <router-link :to="`/data?steamId=${row.steamId}`" class="nickname-link">
                {{ playerNickname(row) }}
              </router-link>
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
import { useRoute, useRouter } from 'vue-router'
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

const RankCell = defineComponent({
  props: {
    profile: { type: Object, required: false }
  },
  setup(props) {
    return () => {
      const profile = props.profile as WatchStagePlayerProfile | undefined
      if (!profile?.pvpScore) return h('span', { class: 'muted' }, '?')
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

const avatarSrc = (steamId: string): string => {
  return `/imgs/avatar/${steamId}.png`
}

const playerNickname = (player: WatchStageLivePlayer): string => {
  return profileOf(player.steamId)?.nickname || player.steamId
}

const handleImageError = (e: Event): void => {
  const img = e.target as HTMLImageElement
  img.src =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect fill="%23e5e7eb" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="14"%3E?%3C/text%3E%3C/svg%3E'
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

const formatTeamLegacy = (players: WatchStageLivePlayer[]): string => {
  const values = players
    .map((player) => profileOf(player.steamId)?.legacyScore)
    .filter((value): value is number => value !== null && value !== undefined && Number.isFinite(Number(value)))
  if (!values.length) return '-'
  const total = values.reduce((sum, value) => sum + Number(value), 0)
  return Math.round(total / values.length).toString()
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
.match-info-card,
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

.match-info-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.info-item span {
  font-size: 1rem;
  color: #111827;
}

.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 4px;
}

.team-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 4px;
}

.team-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.score {
  font-size: 2rem;
  color: #111827;
  font-weight: 700;
}

.vs {
  font-size: 1.5rem;
  font-weight: 700;
  color: #6b7280;
}

.legacy-display {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 4px;
}

.legacy-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legacy-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.legacy-value {
  color: #111827;
  font-size: 1.1rem;
  font-weight: 700;
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
  .query-form {
    grid-template-columns: 1fr;
  }

  .score-display,
  .legacy-display {
    flex-direction: column;
  }
}
</style>
