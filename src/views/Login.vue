<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>用户登录</h2>
        <p>请使用验证码登录系统</p>
      </div>
      
      <div class="login-content">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>正在获取验证码...</p>
        </div>
        
        <div v-else-if="authData" class="auth-info">
          <div class="info-item">
            <label>Token:</label>
            <div class="token-display">
              <code>{{ authData.token.substring(0, 20) }}...</code>
              <el-button @click="copyToken" class="copy-btn">复制</el-button>
            </div>
          </div>
          
          <div class="info-item code-section">
            <label>验证码:</label>
            <div class="code-display">{{ authData.code }}</div>
          </div>
          
          
          <div class="instructions">
            <p>在群内使用 <code>/验证 {{ authData.code }}</code> 登录</p>
          </div>
          
          <el-button @click="checkLogin" class="check-btn" :disabled="checking">
            {{ checking ? '检查中...' : '检查登录' }}
          </el-button>
          
          <el-button @click="refreshAuth" class="refresh-btn">
            刷新验证码
          </el-button>

          <div class="manual-token">
            <label>手动输入 Token（可选）</label>
            <div class="manual-row">
              <input
                v-model="manualToken"
                class="token-input"
                placeholder="粘贴 token 后点击验证"
              />
              <el-button
                class="manual-btn"
                @click="useManualToken"
                :disabled="manualChecking"
              >
                {{ manualChecking ? '验证中...' : '验证并登录' }}
              </el-button>
            </div>
            <p class="manual-hint">验证通过后将直接登录并保存该 token</p>
          </div>

          <p v-if="errorMessage" class="error-message inline-error">{{ errorMessage }}</p>
        </div>
        
        <div v-else class="error-state">
          <p class="error-message">{{ errorMessage }}</p>
          <el-button @click="initAuth" class="retry-btn">重试</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authAPI } from '../api'

interface AuthData {
  token: string
  code: string
}

const router = useRouter()
const route = useRoute()

const loading = ref<boolean>(false)
const checking = ref<boolean>(false)
const manualChecking = ref<boolean>(false)
const authData = ref<AuthData | null>(null)
const manualToken = ref<string>('')
const errorMessage = ref<string>('')

const initAuth = async (): Promise<void> => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    const data = await authAPI.init()
    authData.value = data
    
    // 保存 token 到 localStorage
    localStorage.setItem('token', data.token)
  } catch (error) {
    ElMessage.error('获取验证码失败，请重试')
    console.error('初始化认证失败:', error)
  } finally {
    loading.value = false
  }
}

const checkLogin = async (): Promise<void> => {
  checking.value = true
  
  try {
    await authAPI.getInfo()
    // 登录成功，跳转回之前的页面或首页
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } catch (error) {
    ElMessage.error('登录验证失败，请确保已在其他设备上完成验证')
    console.error('检查登录失败:', error)
  } finally {
    checking.value = false
  }
}

const useManualToken = async (): Promise<void> => {
  const token = manualToken.value.trim()
  if (!token) {
    ElMessage.error('请输入 token')
    return
  }

  const prevToken = localStorage.getItem('token')
  manualChecking.value = true

  try {
    localStorage.setItem('token', token)
    await authAPI.getInfo()
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } catch (error) {
    ElMessage.error('Token 验证失败，请确认正确后重试')
    if (prevToken) {
      localStorage.setItem('token', prevToken)
    } else {
      localStorage.removeItem('token')
    }
    console.error('手动 token 验证失败:', error)
  } finally {
    manualChecking.value = false
  }
}

const refreshAuth = (): void => {
  initAuth()
}

const copyToken = (): void => {
  if (authData.value) {
    navigator.clipboard.writeText(authData.value.token)
      .then(() => {
        ElMessage.success('Token 已复制到剪贴板')
      })
      .catch(() => {
        ElMessage.error('复制失败，请手动复制')
      })
  }
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  initAuth()
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.login-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  padding: 1rem;
  overflow: hidden;
}

.login-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  width: 100%;
  max-width: 480px;
  overflow: hidden;
}

.login-header {
  padding: 2rem;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
}

.login-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  color: #111827;
  font-weight: 600;
}

.login-header p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9375rem;
}

.login-content {
  padding: 2rem;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 2rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 4px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p,
.error-state p {
  color: #6b7280;
  margin: 0;
}

.auth-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.token-display {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.token-display code {
  flex: 1;
  padding: 0.75rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.copy-btn) {
  padding: 0.75rem 1rem !important;
  background: #6366f1 !important;
  color: white !important;
  font-size: 0.875rem;
  white-space: nowrap;
}

.code-section {
  align-items: center;
}

.code-display {
  font-size: 3rem;
  font-weight: 700;
  color: #6366f1;
  letter-spacing: 0.5rem;
  text-align: center;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
}

.expires {
  margin: 0;
  color: #6b7280;
  font-size: 0.9375rem;
}

.instructions {
  padding: 1rem;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 4px;
}

.instructions p {
  margin: 0;
  color: #92400e;
  font-size: 0.875rem;
}

:deep(.check-btn) {
  width: 100% !important;
  padding: 0.875rem !important;
  font-size: 1rem;
  font-weight: 500;
  background: #6366f1 !important;
  color: white !important;
}

:deep(.refresh-btn) {
  width: 100% !important;
  padding: 0.875rem !important;
  font-size: 1rem;
  font-weight: 500;
  background: white !important;
  color: #6366f1 !important;
  border: 1px solid #6366f1 !important;
}

:deep(.retry-btn) {
  width: 100% !important;
  padding: 0.875rem !important;
  font-size: 1rem;
  font-weight: 500;
  background: #6366f1 !important;
  color: white !important;
}

.error-message {
  color: #dc2626;
  margin-bottom: 1rem;
}

.inline-error {
  margin-top: 0.25rem;
  margin-bottom: 0;
}

.manual-token {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.manual-row {
  display: flex;
  gap: 0.5rem;
}

.token-input {
  flex: 1;
  padding: 0.75rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.9375rem;
  color: #111827;
  background: #f9fafb;
}

.token-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  background: white;
}

:deep(.manual-btn) {
  padding: 0.75rem 1rem !important;
  background: #10b981 !important;
  color: white !important;
  font-size: 0.9375rem;
  white-space: nowrap;
}

.manual-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: #6b7280;
}

@media (max-width: 480px) {
  .login-card {
    border-radius: 0;
  }
  
  .login-header,
  .login-content {
    padding: 1.5rem;
  }
  
  .code-display {
    font-size: 2.5rem;
    letter-spacing: 0.3rem;
  }
}
</style>
