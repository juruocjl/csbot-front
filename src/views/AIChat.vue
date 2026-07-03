<template>
  <div class="chat-container">
    <div class="query-section">
      <div class="query-form">
        <label>Chat ID</label>
        <div class="input-with-button">
          <input
            v-model="inputChatId"
            class="form-input"
            placeholder="输入 Chat ID"
            @keyup.enter="handleSearch"
          >
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>
    </div>

    <div class="chat-content">
      <div v-if="loading && records.length === 0" class="loading-container">
        <div class="spinner"></div>
        <p>正在获取聊天记录...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <h3>{{ error }}</h3>
        <el-button @click="fetchChatHistory">重试</el-button>
      </div>

      <div v-else-if="!chatId" class="empty-container">
        <div class="prompt-panel">
          <div class="prompt-panel-header">
            <MessageSquare :size="28" />
            <div>
              <h3>新建 AI 对话</h3>
              <p>输入问题后会创建新的 Chat ID，并跳转到对话记录页。</p>
            </div>
          </div>
          <el-input
            v-model="promptText"
            type="textarea"
            :rows="5"
            resize="vertical"
            placeholder="输入 prompt"
            @keydown.ctrl.enter.prevent="handleAsk"
            @keydown.meta.enter.prevent="handleAsk"
          />
          <div class="prompt-actions">
            <el-button
              type="primary"
              :loading="asking"
              :disabled="!promptText.trim()"
              @click="handleAsk"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="message-list">
        <div v-for="(msg, index) in records" :key="index" :class="['message-item', msg.role]">
          <template v-if="msg.role === 'system'">
            <div class="system-message">
              <div class="system-content">
                <span class="system-label">系统</span>
                {{ msg.content }}
              </div>
            </div>
          </template>

          <template v-else-if="msg.role === 'tool'">
            <div class="tool-result-message">
              <div class="tool-result-header">
                <Wrench :size="14" />
                <span>工具执行结果</span>
              </div>
              <div class="tool-result-content">{{ msg.content }}</div>
            </div>
          </template>

          <template v-else>
            <div class="message-meta">
              <span class="role-badge" :class="msg.role">{{ formatRole(msg.role) }}</span>
              <span class="timestamp">{{ formatTimestamp(msg.timestamp) }}</span>
            </div>

            <div class="message-bubble">
              <div v-if="msg.reasons" class="thinking-block">
                <div class="thinking-header" @click="msg.showReasons = !msg.showReasons">
                  <BrainCircuit :size="16" />
                  <span>思考过程</span>
                  <ChevronDown :size="14" :class="{ 'is-active': msg.showReasons }" class="collapse-icon" />
                </div>
                <div v-if="msg.showReasons" class="thinking-content">{{ msg.reasons }}</div>
              </div>

              <div v-if="msg.parsedTools && msg.parsedTools.length > 0" class="tools-block">
                <div v-for="(tool, tIdx) in msg.parsedTools" :key="tIdx" class="tool-call">
                  <div class="tools-header">
                    <Wrench :size="14" />
                    <span class="tool-name">{{ tool.name }}</span>
                  </div>
                  <div class="tools-content">
                    <div v-if="typeof tool.arguments === 'object'" class="args-grid">
                      <div v-for="(val, key) in tool.arguments" :key="key" class="arg-item">
                        <span class="arg-key">{{ key }}:</span>
                        <span class="arg-val">{{ val }}</span>
                      </div>
                    </div>
                    <div v-else>{{ tool.arguments }}</div>
                  </div>
                </div>
              </div>

              <div v-if="msg.content" class="content">{{ msg.content }}</div>
              <div v-else-if="!msg.tools" class="content empty">（无内容）</div>
            </div>
          </template>
        </div>

        <div v-if="loading && records.length > 0" class="loading-more">
          <div class="small-spinner"></div>
          <span>正在加载后续消息 ({{ records.length }}/{{ recordIds.length }})...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { aiAPI } from '../api'
import type { AiRecordResponse } from '../api'
import { MessageSquare, BrainCircuit, Wrench, ChevronDown } from 'lucide-vue-next'

interface DisplayRecord extends AiRecordResponse {
  showReasons?: boolean
  parsedTools?: Array<{ name: string; arguments: any }>
}

const route = useRoute()
const router = useRouter()
const chatId = ref(route.query.chatId as string || '')
const inputChatId = ref(chatId.value)
const promptText = ref('')
const asking = ref(false)
const recordIds = ref<number[]>([])
const records = ref<DisplayRecord[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const pollingTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const stopPolling = () => {
  if (pollingTimer.value) {
    clearTimeout(pollingTimer.value)
    pollingTimer.value = null
  }
}

const parseTools = (toolsStr: string | null) => {
  if (!toolsStr) return []
  try {
    const tools = JSON.parse(toolsStr)
    if (!Array.isArray(tools)) return []
    return tools.map(tool => {
      let args = tool.arguments
      if (typeof args === 'string') {
        try {
          args = JSON.parse(args)
        } catch {
          // keep original string
        }
      }
      return {
        name: tool.name || 'unknown_tool',
        arguments: args
      }
    })
  } catch (e) {
    console.warn('Failed to parse tools JSON:', e)
    return []
  }
}

const navigateToChat = (value: string) => {
  const target = value.trim()
  if (!target) return
  router.push({
    path: '/ai-chat',
    query: {
      ...route.query,
      chatId: target
    }
  })
}

const handleSearch = () => {
  if (!inputChatId.value.trim()) return
  if (inputChatId.value === chatId.value) {
    fetchChatHistory()
  } else {
    navigateToChat(inputChatId.value)
  }
}

const handleAsk = async () => {
  const prompt = promptText.value.trim()
  if (!prompt || asking.value) return
  asking.value = true
  try {
    const result = await aiAPI.ask(prompt)
    promptText.value = ''
    navigateToChat(result.chatId)
  } catch (err: any) {
    ElMessage.error(err.response?.data?.detail || err.message || '创建 AI 对话失败')
  } finally {
    asking.value = false
  }
}

const fetchChatHistory = async (isIncremental = false) => {
  if (!chatId.value) {
    records.value = []
    recordIds.value = []
    stopPolling()
    return
  }

  if (!isIncremental) {
    loading.value = true
    error.value = null
    records.value = []
    recordIds.value = []
    stopPolling()
  }

  try {
    const idsResult = await aiAPI.getRecordIds(chatId.value)
    const newIds = idsResult.recordIds.filter(id => !recordIds.value.includes(id))

    if (newIds.length > 0) {
      const fetchedNewRecords: DisplayRecord[] = []
      for (const id of newIds) {
        if (route.query.chatId !== chatId.value) break
        try {
          const record = await aiAPI.getRecord(id)
          fetchedNewRecords.push({
            ...record,
            showReasons: false,
            parsedTools: parseTools(record.tools)
          })
          if (!isIncremental) {
            records.value = [...records.value, ...fetchedNewRecords]
            fetchedNewRecords.length = 0
          }
        } catch (e) {
          console.error(`Failed to fetch record ${id}:`, e)
        }
      }

      if (fetchedNewRecords.length > 0) {
        records.value = [...records.value, ...fetchedNewRecords]
      }
      recordIds.value = idsResult.recordIds
    }

    if (!idsResult.isEnd) {
      pollingTimer.value = setTimeout(() => fetchChatHistory(true), 5000)
    } else {
      stopPolling()
    }
  } catch (err: any) {
    if (!isIncremental) {
      error.value = err.message || '加载聊天记录失败'
    }
    stopPolling()
  } finally {
    if (!isIncremental) {
      loading.value = false
    }
  }
}

onMounted(() => {
  if (chatId.value) {
    fetchChatHistory()
  }
})

onUnmounted(() => {
  stopPolling()
})

watch(() => route.query.chatId, (newVal) => {
  chatId.value = newVal as string || ''
  inputChatId.value = chatId.value
  fetchChatHistory()
})

const formatTimestamp = (ts: number) => {
  return new Date(ts * 1000).toLocaleString()
}

const formatRole = (role: string) => {
  const roles: Record<string, string> = {
    user: '用户',
    assistant: 'AI 助手',
    system: '系统',
    tool: '工具'
  }
  return roles[role] || role
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
}

.query-section {
  padding: 1.25rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.query-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 520px;
}

.query-form label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.input-with-button {
  display: flex;
  gap: 0.5rem;
}

.form-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background-color: #f9fafb;
}

.empty-container,
.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}

.error-container {
  flex-direction: column;
  text-align: center;
}

.error-container h3 {
  color: #ef4444;
  margin-bottom: 1rem;
}

.prompt-panel {
  width: min(760px, 100%);
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.prompt-panel-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1rem;
  color: #374151;
}

.prompt-panel-header h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.prompt-panel-header p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.prompt-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.75rem;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.message-item {
  display: flex;
  flex-direction: column;
}

.message-item.user {
  align-items: flex-end;
}

.message-item.assistant,
.message-item.tool {
  align-items: flex-start;
}

.message-item.system {
  align-items: center;
}

.system-message {
  display: flex;
  justify-content: center;
  width: 100%;
}

.system-content {
  background: #f1f5f9;
  color: #64748b;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  max-width: 90%;
  text-align: center;
}

.system-label {
  font-weight: 700;
  margin-right: 0.5rem;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.tool-result-message {
  max-width: 90%;
  margin-bottom: 0.5rem;
}

.tool-result-header,
.tools-header,
.thinking-header,
.message-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tool-result-header {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  margin: 0 0 0.25rem 0.5rem;
}

.tool-result-content {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  color: #475569;
  padding: 0.75rem;
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-meta {
  margin-bottom: 0.4rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.role-badge {
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
}

.role-badge.user {
  background: #e0e7ff;
  color: #4338ca;
}

.role-badge.assistant {
  background: #f3f4f6;
  color: #374151;
}

.message-bubble {
  padding: 1rem;
  border-radius: 8px;
  max-width: 85%;
  line-height: 1.6;
  white-space: pre-wrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user .message-bubble {
  background-color: #6366f1;
  color: white;
  border-bottom-right-radius: 2px;
}

.assistant .message-bubble {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 2px;
  color: #1f2937;
}

.thinking-block,
.tools-block {
  margin-bottom: 0.75rem;
  border-radius: 6px;
  overflow: hidden;
  font-size: 0.85rem;
}

.thinking-block {
  border: 1px solid #e5e7eb;
}

.thinking-header {
  padding: 0.4rem 0.75rem;
  background-color: #f9fafb;
  cursor: pointer;
  user-select: none;
  color: #6b7280;
}

.collapse-icon {
  margin-left: auto;
  transition: transform 0.2s;
}

.collapse-icon.is-active {
  transform: rotate(180deg);
}

.thinking-content {
  padding: 0.75rem;
  background-color: #fff;
  color: #6b7280;
  font-style: italic;
  border-top: 1px solid #e5e7eb;
}

.tools-block {
  border: 1px solid #e0e7ff;
  background-color: #e0e7ff;
}

.tool-call {
  background-color: #f8fafc;
}

.tools-header {
  padding: 0.4rem 0.75rem;
  background-color: #eef2ff;
  color: #4338ca;
  border-bottom: 1px solid #e0e7ff;
}

.tool-name {
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.tools-content {
  padding: 0.75rem;
  word-break: break-word;
}

.args-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 0.75rem;
}

.arg-item {
  display: contents;
}

.arg-key {
  color: #64748b;
  font-weight: 500;
}

.arg-val {
  color: #1e293b;
}

.content.empty {
  color: #9ca3af;
  font-style: italic;
}

.spinner,
.small-spinner {
  border-style: solid;
  border-color: #f3f3f3;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner {
  width: 40px;
  height: 40px;
  border-width: 4px;
  margin-right: 1rem;
}

.small-spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .input-with-button {
    flex-direction: column;
  }

  .message-bubble {
    max-width: 95%;
  }
}
</style>
