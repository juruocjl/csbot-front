<template>
  <div class="rank-container">
    <div class="query-section">
      <div class="query-form">
        <div class="form-group">
          <label>排名类型</label>
          <select v-model="queryRankName" class="form-select" :disabled="rankLoading">
            <option value="">选择排名类型</option>
            <option v-for="config in rankConfigs" :key="config.name" :value="config.name">
              {{ config.description }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>时间范围</label>
          <select v-model="queryTimeType" class="form-select" :disabled="rankLoading">
            <option v-for="timeType in availableTimeTypes" :key="timeType" :value="timeType">
              {{ timeType }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="rank-content">
      <div v-if="rankLoading" class="loading-container">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="rankError" class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>{{ rankError }}</h3>
        <el-button @click="loadRankData" class="retry-btn">重试</el-button>
      </div>

      <div v-else-if="rankData" class="table-section">
        <div class="result-info">
          共 <strong>{{ rankData.players.length }}</strong> 个玩家
        </div>

        <el-table :data="rankData.players" style="width: 100%">
          <el-table-column label="排名" align="center" width="80">
            <template #default="{ $index }">
              {{ $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column label="头像" align="center" width="80">
            <template #default="{ row }">
              <el-avatar :src="`/imgs/avatar/${row.steamId}.png`" :alt="row.nickname" :size="40"></el-avatar>
            </template>
          </el-table-column>
          <el-table-column label="昵称" align="left" width="150">
            <template #default="{ row }">
              <div class="nickname-cell">{{ row.nickname }}</div>
            </template>
          </el-table-column>
          <el-table-column label="数值" align="center" min-width="220">
            <template #default="{ row }">
              <div class="value-bar-container">
                <div class="value-bar">
                  <div 
                    class="value-bar-fill" 
                    :style="{ 
                      width: getProgressPercentage(row.value) + '%',
                      backgroundColor: getBarColor(getProgressPercentage(row.value))
                    }"
                  ></div>
                </div>
                <span class="value-text">{{ formatValue(row.value) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="场次" align="center" width="80">
            <template #default="{ row }">
              {{ row.count }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else class="empty-container">
        <p>请选择排名类型和时间范围</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { configAPI, rankAPI, type RankConfigItem, type RankResponse } from '../api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const rankLoading = ref<boolean>(false)
const rankError = ref<string | null>(null)
const rankData = ref<RankResponse | null>(null)

const rankConfigs = ref<RankConfigItem[]>([])
const timeTypes = ref<string[]>([])
const availableTimeTypes = ref<string[]>([])

const queryRankName = ref<string>(route.query.rankName as string || '')
const queryTimeType = ref<string>(route.query.timeType as string || '')

onMounted(async () => {
  // 获取排名配置
  try {
    const rankConfigResponse = await configAPI.getRankConfig()
    rankConfigs.value = rankConfigResponse.rankOptions
  } catch (err) {
    console.error('获取排名配置失败:', err)
    ElMessage.error('获取排名配置失败')
    rankConfigs.value = []
  }

  // 获取时间类型列表
  try {
    const timeTypeResponse = await configAPI.getTimeTypes()
    timeTypes.value = timeTypeResponse.timeTypes
  } catch (err) {
    console.error('获取时间类型失败:', err)
    ElMessage.error('获取时间类型失败')
    timeTypes.value = []
  }

  // 初始化：如果URL中有参数，设置值并初始化可用时间范围
  if (route.query.rankName && route.query.timeType) {
    queryRankName.value = route.query.rankName as string
    queryTimeType.value = route.query.timeType as string
    
    // 根据rankName初始化availableTimeTypes
    const config = rankConfigs.value.find(c => c.name === queryRankName.value)
    if (config) {
      availableTimeTypes.value = config.allowedTimeTypes
    }
    
    await loadRankData()
  }
})

// 监听排名或时间范围改变，更新URL
watch([queryRankName, queryTimeType], async ([newRankName, newTimeType]) => {
  rankData.value = null
  
  // 更新可用时间范围
  if (newRankName) {
    const config = rankConfigs.value.find(c => c.name === newRankName)
    if (config) {
      availableTimeTypes.value = config.allowedTimeTypes
      // 如果当前timeType不在允许列表中，设置为默认值
      if (!config.allowedTimeTypes.includes(newTimeType)) {
        queryTimeType.value = config.defaultTimeType
        return // 让timeType的变化触发下一次watch
      }
    }
  }

  // 更新URL参数
  if (newRankName && newTimeType) {
    await router.push({
      path: '/rank',
      query: {
        rankName: newRankName,
        timeType: newTimeType
      }
    })
  }
}, { flush: 'post' })

// 监听路由参数变化，重新加载数据
watch(() => route.query, async (newQuery) => {
  if (newQuery.rankName && newQuery.timeType) {
    queryRankName.value = newQuery.rankName as string
    queryTimeType.value = newQuery.timeType as string
    await loadRankData()
  }
}, { deep: true })

const loadRankData = async (): Promise<void> => {
  if (!queryRankName.value || !queryTimeType.value) {
    ElMessage.warning('请选择排名类型和时间范围')
    return
  }

  rankLoading.value = true
  rankError.value = null
  try {
    rankData.value = await rankAPI.getRankList({
      rankName: queryRankName.value,
      timeType: queryTimeType.value
    })
  } catch (err: any) {
    rankError.value = '加载排名数据失败，请重试'
    console.error('获取排名数据失败:', err)
  } finally {
    rankLoading.value = false
  }
}

const getProgressPercentage = (value: number): number => {
  if (!rankData.value) return 0
  const { minValue, maxValue } = rankData.value
  if (maxValue === minValue) return 100
  return ((value - minValue) / (maxValue - minValue)) * 100
}

const getBarColor = (percentage: number): string => {
  // 使用HSL颜色空间实现平滑渐变
  // 红色(0°) -> 绿色(120°)
  const hue = (percentage / 100) * 120
  const saturation = 75
  const lightness = 50
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

const formatValue = (value: number): string => {
  if (!Number.isFinite(value)) return '-'
  
  // 根据outputFormat格式化值
  const format = currentRankConfig.value?.outputFormat || 'd2'
  
  if (format.startsWith('d')) {
    // 保留X位小数
    const decimals = parseInt(format.substring(1), 10)
    return value.toFixed(decimals)
  } else if (format.startsWith('p')) {
    // 保留X位百分数
    const decimals = parseInt(format.substring(1), 10)
    return (value * 100).toFixed(decimals) + '%'
  }
  
  return value.toFixed(2)
}

const currentRankConfig = computed<RankConfigItem | undefined>(() => {
  return rankConfigs.value.find(c => c.name === queryRankName.value)
})
</script>

<style scoped>
.rank-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.query-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.query-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.form-select:hover {
  border-color: #d1d5db;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.rank-content {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p {
  color: #6b7280;
  font-size: 0.875rem;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
  color: #dc2626;
}

.error-icon {
  font-size: 2.5rem;
}

.error-container h3 {
  margin: 0;
  font-size: 1rem;
}

.retry-btn {
  margin-top: 0.5rem;
}

.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #9ca3af;
  font-size: 0.875rem;
}

.table-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.result-info strong {
  color: #111827;
  font-weight: 600;
}

.value-bar-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.value-bar {
  flex: 1;
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.value-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.value-text {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
  min-width: 50px;
  text-align: right;
}

.nickname-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-value {
  font-weight: 500;
  color: #3b82f6;
}

:deep(.el-table) {
  border-radius: 4px;
  overflow: hidden;
}

:deep(.el-table__header) {
  background-color: #f9fafb;
}

:deep(.el-table__row:hover > td) {
  background-color: #f3f4f6 !important;
}

@media (max-width: 768px) {
  .query-form {
    grid-template-columns: 1fr;
  }

  .rank-header h2 {
    font-size: 1.25rem;
  }

  .query-section {
    padding: 1rem;
  }

  .rank-content {
    padding: 1rem;
  }

  :deep(.el-table) {
    font-size: 0.75rem;
  }
}
</style>
