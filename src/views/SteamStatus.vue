<template>
  <div class="steam-status-view">
    <div class="header-row">
      <div class="header-left">
        <h2>游戏状态</h2>
        <span class="api-status">status: {{ apiStatus }}</span>
      </div>
      <el-button @click="refreshStatus" :loading="loading">刷新</el-button>
    </div>

    <div v-if="loading" class="loading-wrap">
      <el-skeleton :rows="4" animated />
    </div>

    <el-alert
      v-else-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />

    <div v-else-if="onlineUsers.length === 0" class="empty-wrap">
      <el-empty description="当前无人在线" />
    </div>

    <div v-else class="group-list">
      <el-card v-for="group in groupedGames" :key="group.gameName" class="group-card" shadow="never">
        <template #header>
          <div class="group-header">
            <div class="group-title">{{ group.gameName }}</div>
            <el-tag type="info">{{ group.players.length }} 人</el-tag>
          </div>
        </template>

        <div class="player-list">
          <div v-for="partyBlock in getPartyBlocks(group.players)" :key="partyBlock.id" class="party-box" :class="{ grouped: partyBlock.grouped }">
            <div v-for="item in partyBlock.players" :key="item.uid" class="player-row">
              <el-avatar :size="36" :src="getAvatarSrc(item.uid)" />
              <div class="player-content">
                <div class="player-status">{{ formatRichDisplay(item.rich_display) }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card v-if="onlineIdleUsers.length > 0" class="group-card" shadow="never">
        <template #header>
          <div class="group-header">
            <div class="group-title">在线但未在游戏中</div>
            <el-tag type="warning">{{ onlineIdleUsers.length }} 人</el-tag>
          </div>
        </template>

        <div class="idle-avatar-list">
          <el-avatar v-for="item in onlineIdleUsers" :key="item.uid" :size="36" :src="getAvatarSrc(item.uid)" />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { systemAPI, type SteamStatusItem } from '../api'

interface GameGroup {
  gameName: string
  players: SteamStatusItem[]
}

interface PartyBlock {
  id: string
  players: SteamStatusItem[]
  grouped: boolean
}

const loading = ref<boolean>(false)
const errorMessage = ref<string>('')
const steamStatus = ref<SteamStatusItem[]>([])
const apiStatus = ref<string>('-')

const playingUsers = computed<SteamStatusItem[]>(() => {
  return steamStatus.value.filter((item) => item.game_appid.trim() !== '')
})

const onlineIdleUsers = computed<SteamStatusItem[]>(() => {
  return steamStatus.value.filter((item) => item.state === 'online' && item.game_appid.trim() === '')
})

const onlineUsers = computed<SteamStatusItem[]>(() => {
  return steamStatus.value.filter((item) => item.state === 'online')
})

const groupedGames = computed<GameGroup[]>(() => {
  const groupedMap = new Map<string, SteamStatusItem[]>()

  for (const item of playingUsers.value) {
    const gameName = item.game_name.trim() || '未知游戏'
    if (!groupedMap.has(gameName)) {
      groupedMap.set(gameName, [])
    }
    groupedMap.get(gameName)?.push(item)
  }

  return Array.from(groupedMap.entries())
    .sort(([nameA], [nameB]) => nameA.localeCompare(nameB, 'zh-Hans-CN'))
    .map(([gameName, players]) => ({
      gameName,
      players
    }))
})

const getAvatarSrc = (uid: string): string => {
  return `https://q1.qlogo.cn/g?b=qq&nk=${uid}&s=640`
}

const formatRichDisplay = (richDisplay: Record<string, string>): string => {

  const status = richDisplay.status?.trim() ?? ''
  const desc = richDisplay.desc?.trim() ?? ''
  if (status && desc) {
    return `${status} | ${desc}`
  }
  if (status) {
    return status
  }
  if (desc) {
    return desc
  }
  
  const steamDisplay = richDisplay.steam_display?.trim()
  if (steamDisplay) {
    return steamDisplay
  }

  return '无详细状态'
}

const getPlayerGroupKey = (item: SteamStatusItem): string => {
  return item.rich_display.steam_player_group?.trim() ?? ''
}

const getPartyBlocks = (players: SteamStatusItem[]): PartyBlock[] => {
  const groupCounter = new Map<string, number>()
  for (const item of players) {
    const key = getPlayerGroupKey(item)
    if (!key) {
      continue
    }
    groupCounter.set(key, (groupCounter.get(key) ?? 0) + 1)
  }

  const blocks: PartyBlock[] = []
  const groupedMap = new Map<string, SteamStatusItem[]>()

  for (const item of players) {
    const key = getPlayerGroupKey(item)
    const canGroup = key !== '' && (groupCounter.get(key) ?? 0) > 1

    if (!canGroup) {
      blocks.push({
        id: `single-${item.uid}`,
        players: [item],
        grouped: false
      })
      continue
    }

    if (!groupedMap.has(key)) {
      groupedMap.set(key, [])
    }
    groupedMap.get(key)?.push(item)
  }

  for (const [key, groupedPlayers] of groupedMap.entries()) {
    blocks.push({
      id: `group-${key}`,
      players: groupedPlayers,
      grouped: true
    })
  }

  return blocks
}

const fetchSteamStatus = async (): Promise<void> => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await systemAPI.getSteamStatus()
    apiStatus.value = response.status
    if (response.status !== 'success') {
      errorMessage.value = '获取游戏状态失败：服务返回非 success 状态'
      return
    }
    steamStatus.value = response.data
  } catch (error) {
    console.error('获取 Steam 状态失败:', error)
    errorMessage.value = '获取游戏状态失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const refreshStatus = async (): Promise<void> => {
  await fetchSteamStatus()
  if (!errorMessage.value) {
    ElMessage.success('刷新成功')
  }
}

onMounted(async () => {
  await fetchSteamStatus()
})
</script>

<style scoped>
.steam-status-view {
  width: 100%;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.header-row h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.api-status {
  font-size: 0.82rem;
  color: #6b7280;
}

.loading-wrap,
.empty-wrap {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.group-card {
  border-radius: 10px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.party-box {
  border: 1px solid transparent;
  border-radius: 6px;
}

.party-box.grouped {
  padding: 0.3rem;
  border-color: #fbbf24;
  background: #fffbeb;
}

.player-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.45rem 0.55rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fafafa;
}

.party-box.grouped .player-row {
  background: transparent;
}

.player-content {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.player-status {
  font-size: 0.84rem;
  font-weight: 500;
  color: #374151;
  line-height: 1.35;
  word-break: break-word;
}

.idle-avatar-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .player-row {
    padding: 0.4rem 0.5rem;
  }

  .player-status {
    font-size: 0.8rem;
  }
}
</style>
