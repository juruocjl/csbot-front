<template>
  <div class="home-view">
    <div class="welcome-card">
      <div class="user-profile">
        <el-avatar 
          :src="qqAvatarUrl" 
          :alt="userName" 
          :size="80"
          shape="circle"
          @error="handleImageError"
        />
        <div class="user-info">
          <h2>{{ userName }}</h2>
          <p class="steam-id">{{ steamId }}</p>
          <p class="qq-id" v-if="qq">QQ: {{ qq }}</p>
        </div>
      </div>
    </div>

    <div class="status-card" v-if="status">
      <h3>系统状态</h3>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">CPU 使用率</span>
          <el-progress 
            :percentage="Math.min(status.cpuUsage, 100)" 
            :color="getProgressColor(status.cpuUsage)"
            :format="() => `${status ? status.cpuUsage.toFixed(1) : 'NaN'}%`"
          />
        </div>
        <div class="status-item">
          <span class="label">内存使用率</span>
          <el-progress 
            :percentage="Math.min(status.memoryUsagePercent, 100)" 
            :color="getProgressColor(status.memoryUsagePercent)"
            :format="() => `${status ? status.memoryUsagePercent.toFixed(1) : 'NaN'}%`"
          />
          <span class="value" style="margin-top: 0.5rem;">{{ status.memoryUsed.toFixed(1) }} / {{ status.memoryTotal.toFixed(1) }} GB</span>
        </div>
        <div class="status-item">
          <span class="label">图库状态</span>
          <span class="value">{{ status.pictureLibrary }}</span>
        </div>
        <div class="status-item">
          <span class="label">消息统计</span>
          <span class="value">{{ status.messageCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { authAPI, systemAPI, type StatusResponse } from '../api'

const userName = ref<string>('用户')
const steamId = ref<string>('')
const qq = ref<string>('')
const status = ref<StatusResponse | null>(null)

const qqAvatarUrl = computed<string>(() => {
  if (qq.value) {
    return `https://q1.qlogo.cn/g?b=qq&nk=${qq.value}&s=640`
  }
  return ''
})

const getProgressColor = (percentage: number): string => {
  if (percentage <= 50) return '#22c55e'  // 绿色
  if (percentage <= 80) return '#eab308'  // 黄色
  return '#ef4444'                         // 红色
}

const handleImageError = (e: Event): void => {
  const img = e.target as HTMLImageElement
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="28"%3E?%3C/text%3E%3C/svg%3E'
}

onMounted(async () => {
  try {
    const nameResult = await authAPI.getInfoName()
    userName.value = nameResult.showName
  } catch (err) {
    console.error('获取用户名失败:', err)
  }

  try {
    const steamIdResult = await authAPI.getInfoSteamId()
    if (steamIdResult.steamId) {
      steamId.value = steamIdResult.steamId
    }
  } catch (err) {
    console.error('获取 Steam ID 失败:', err)
  }

  try {
    const qqResult = await authAPI.getInfoQQ()
    qq.value = qqResult.qq
  } catch (err) {
    console.error('获取 QQ 号失败:', err)
  }

  try {
    const statusResult = await systemAPI.getStatus()
    status.value = statusResult
  } catch (err) {
    console.error('获取系统状态失败:', err)
  }
})
</script>

<style scoped>
.home-view {
  width: 100%;
  height: 100%;
}

.welcome-card {
  background: white;
  padding: 2rem;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.welcome-card h2 {
  color: #111827;
  margin: 0;
  font-size: 1.375rem;
  font-weight: 600;
}

.steam-id {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.qq-id {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.status-card {
  background: white;
  padding: 1.5rem;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  margin-top: 1.5rem;
}

.status-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  color: #111827;
  font-weight: 600;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.status-item .label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.status-item .value {
  font-size: 1rem;
  color: #111827;
  font-weight: 600;
}

@media (max-width: 768px) {
  .welcome-card {
    padding: 1.5rem;
  }
  
  .welcome-card h2 {
    font-size: 1.25rem;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .welcome-card {
    padding: 1rem;
  }
  
  .welcome-card h2 {
    font-size: 1.125rem;
  }
  
  .welcome-card p {
    font-size: 0.875rem;
  }
}
</style>
