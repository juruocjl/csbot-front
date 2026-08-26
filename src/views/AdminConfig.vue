<template>
  <div class="config-page">
    <el-alert
      title="保存后无需重启服务；使用配置的任务会在下一次执行时从数据库读取最新值。"
      type="info"
      :closable="false"
      show-icon
    />

    <el-skeleton v-if="loading" :rows="5" animated />
    <el-empty v-else-if="items.length === 0" description="暂无可编辑的运行配置" />

    <el-card v-for="item in items" v-else :key="item.key" class="config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <h2>{{ item.name }}</h2>
            <code>{{ item.key }}</code>
          </div>
          <el-tag effect="plain">{{ item.valueType }}</el-tag>
        </div>
      </template>

      <p class="description">{{ item.description }}</p>
      <el-input
        v-model="drafts[item.key]"
        type="textarea"
        :autosize="{ minRows: 4, maxRows: 14 }"
        spellcheck="false"
        placeholder="请输入 JSON 值"
      />
      <p v-if="item.valueType === 'integer_list'" class="format-hint">
        请输入 JSON 正整数数组，例如 [123456, 789012]
      </p>

      <div class="card-footer">
        <span class="updated-at">{{ updateDescription(item) }}</span>
        <div class="actions">
          <el-button @click="resetDraft(item)">撤销编辑</el-button>
          <el-button
            type="primary"
            :loading="savingKey === item.key"
            @click="save(item)"
          >
            保存并热加载
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { adminConfigAPI, type RuntimeConfigItem } from '../api'

const loading = ref(true)
const savingKey = ref<string | null>(null)
const items = ref<RuntimeConfigItem[]>([])
const drafts = ref<Record<string, string>>({})

const formatValue = (value: unknown): string => JSON.stringify(value, null, 2)

const resetDraft = (item: RuntimeConfigItem): void => {
  drafts.value[item.key] = formatValue(item.value)
}

const updateDescription = (item: RuntimeConfigItem): string => {
  if (item.updatedAt === null) {
    return '尚未修改，当前为默认值'
  }
  const time = new Date(item.updatedAt * 1000).toLocaleString()
  return item.updatedBy ? `最后由 ${item.updatedBy} 修改于 ${time}` : `最后修改于 ${time}`
}

const load = async (): Promise<void> => {
  loading.value = true
  try {
    const response = await adminConfigAPI.list()
    items.value = response.items
    for (const item of response.items) {
      resetDraft(item)
    }
  } catch (error) {
    console.error('读取运行配置失败:', error)
    ElMessage.error('读取运行配置失败')
  } finally {
    loading.value = false
  }
}

const save = async (item: RuntimeConfigItem): Promise<void> => {
  let value: unknown
  try {
    value = JSON.parse(drafts.value[item.key])
  } catch {
    ElMessage.error('配置值不是有效的 JSON')
    return
  }

  savingKey.value = item.key
  try {
    const updated = await adminConfigAPI.update(item.key, value)
    const index = items.value.findIndex(current => current.key === item.key)
    if (index !== -1) {
      items.value[index] = updated
    }
    resetDraft(updated)
    ElMessage.success(`${updated.name}已更新`)
  } catch (error: any) {
    console.error('保存运行配置失败:', error)
    ElMessage.error(error.response?.data?.detail || '保存运行配置失败')
  } finally {
    savingKey.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.config-page {
  max-width: 920px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-card {
  border-radius: 8px;
}

.card-header,
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.card-header h2 {
  margin: 0 0 0.35rem;
  color: #111827;
  font-size: 1.1rem;
}

.card-header code {
  color: #6b7280;
  font-size: 0.8rem;
}

.description {
  margin: 0 0 1rem;
  color: #4b5563;
  line-height: 1.6;
}

.format-hint {
  margin: 0.5rem 0 0;
  color: #6b7280;
  font-size: 0.82rem;
}

:deep(.el-textarea__inner) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.55;
}

.card-footer {
  margin-top: 1rem;
}

.updated-at {
  color: #6b7280;
  font-size: 0.82rem;
}

.actions {
  display: flex;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .card-header,
  .card-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
