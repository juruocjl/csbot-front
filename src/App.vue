<template>
  <el-container class="app-container">
    <el-aside width="auto" class="sidebar" :class="{ collapsed: sidebarCollapsed, active: mobileMenuOpen }">
      <div class="logo">
        <h2 v-show="!sidebarCollapsed">CSBOT</h2>
        <h2 v-show="sidebarCollapsed" class="logo-icon"><PiggyBank /></h2>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-item" @click="mobileMenuOpen = false">
          <Home :size="20" :stroke-width="2" />
          <span v-show="!sidebarCollapsed">主页</span>
        </router-link>
        <router-link to="/data" class="nav-item" @click="mobileMenuOpen = false">
          <BarChart3 :size="20" :stroke-width="2" />
          <span v-show="!sidebarCollapsed">数据</span>
        </router-link>
        <router-link to="/history" class="nav-item" @click="mobileMenuOpen = false">
          <History :size="20" :stroke-width="2" />
          <span v-show="!sidebarCollapsed">历史</span>
        </router-link>
        <router-link to="/history-all" class="nav-item" @click="mobileMenuOpen = false">
          <Layers :size="20" :stroke-width="2" />
          <span v-show="!sidebarCollapsed">全站记录</span>
        </router-link>
        <router-link to="/rank" class="nav-item" @click="mobileMenuOpen = false">
          <Trophy :size="20" :stroke-width="2" />
          <span v-show="!sidebarCollapsed">排名</span>
        </router-link>
      </nav>
      <div class="sidebar-toggle hidden-sm-and-down" @click="sidebarCollapsed = !sidebarCollapsed">
        <ChevronLeft v-if="!sidebarCollapsed" :size="20" :stroke-width="2" />
        <ChevronRight v-else :size="20" :stroke-width="2" />
      </div>
    </el-aside>
    <el-container class="main-container" @click="mobileMenuOpen = false">
      <el-header class="header">
        <el-button class="mobile-menu-btn hidden-md-and-up" @click.stop="mobileMenuOpen = !mobileMenuOpen">
          <Menu :size="20" :stroke-width="2" />
        </el-button>
        <div class="header-left">
          <el-button @click="router.back()" class="back-btn-global">
            <ChevronLeft :size="20" />
            返回
          </el-button>
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <div class="user-info hidden-sm-and-down">
            <span>{{ showName }}</span>
          </div>
          <el-button class="share-btn" @click="handleShare" title="分享当前页面">
            <Share2 :size="18" :stroke-width="2" />
          </el-button>
          <el-button class="logout-btn" @click="handleLogout">
            <LogOut :size="18" :stroke-width="2" />
          </el-button>
        </div>
      </el-header>
      <el-main class="content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Home, BarChart3, ChevronLeft, ChevronRight, LogOut, Menu, History, Layers, Share2, PiggyBank, Trophy } from 'lucide-vue-next'
import { authAPI } from './api'

const route = useRoute()
const router = useRouter()
const mobileMenuOpen = ref<boolean>(false)
const sidebarCollapsed = ref<boolean>(localStorage.getItem('sidebarCollapsed') !== 'false')
const showName = ref<string>('用户')

const pageTitle = computed<string>(() => {
  const titles: Record<string, string> = {
    '/': '主页',
    '/data': '数据',
    '/history': '历史',
    '/history-gp': '官匹历史',
    '/history-all': '全站记录',
    '/rank': '排名',
    '/match': '比赛详情',
    '/match-gp': '官匹比赛详情',
  }
  return titles[route.path] || 'Dashboard'
})

// 监听sidebarCollapsed变化，保存到localStorage
watch(sidebarCollapsed, (newValue) => {
  localStorage.setItem('sidebarCollapsed', String(newValue))
})

const handleLogout = (): void => {
  localStorage.removeItem('token')
  router.push('/login')
}

const handleShare = (): void => {
  // 调用API发送当前页面路径
  ElMessage.info('正在分享当前页面...')
  authAPI.send(route.fullPath).then(() => {
    ElMessage.success('分享成功')
  }).catch(err => {
    console.error('发送分享请求失败:', err)
    if (err.response?.data?.detail) {
      ElMessage.error(`分享失败: ${err.response.data.detail}`)
      return
    }
  })
}

onMounted(async () => {
  try {
    const result = await authAPI.getInfoName()
    showName.value = result.showName
  } catch (err) {
    console.error('获取用户名失败:', err)
  }

  // 监听从登录页跳转的情况
  router.afterEach((_to, from) => {
    if (from.path === '/login') {
      authAPI.getInfoName().then(result => {
        showName.value = result.showName
      }).catch(err => {
        console.error('获取用户名失败:', err)
      })
    }
  })
})

// 路由变化时关闭移动菜单
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>

<style scoped>
:deep(.el-container) {
  height: 100vh;
}

:deep(.el-aside) {
  background: #6366f1;
  color: white;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  transition: width 0.3s ease;
}

:deep(.el-header) {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  height: auto;
}

:deep(.el-main) {
  background: #f5f5f5;
  padding: 1.5rem;
  overflow-y: auto;
}

.app-container {
  display: flex;
  height: 100vh;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sidebar {
  width: 250px;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 999;
  transition: width 0.3s ease, transform 0.3s ease;
}

.sidebar.collapsed {
  width: 70px;
}

.logo {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.logo h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
}

.logo .logo-icon {
  text-align: center;
  font-size: 1.5rem;
}

.logo-icon {
  width: 24px;
}

.nav {
  flex: 1;
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.875rem 1.5rem;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  transition: all 0.2s ease;
  gap: 0.875rem;
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.875rem 0;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.router-link-active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border-left: 3px solid white;
}

.sidebar.collapsed .nav-item.router-link-active {
  border-left: 3px solid white;
  border-bottom: none;
}

.sidebar-toggle {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.85);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.2s ease;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.mobile-menu-btn {
  flex-direction: column;
  justify-content: space-around;
  width: 2rem;
  height: 2rem;
  padding: 0 !important;
  z-index: 10;
}

:deep(.mobile-menu-btn) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
  font-weight: 500;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

:deep(.back-btn-global) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem !important;
  background: white !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 4px;
  color: #374151 !important;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

:deep(.back-btn-global:hover) {
  background: #f9fafb !important;
  border-color: #d1d5db !important;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}

.user-info {
  padding: 0.5rem 0.875rem;
  background: #f3f4f6;
  border-radius: 4px;
  color: #374151;
  font-size: 0.875rem;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

:deep(.logout-btn),
:deep(.share-btn) {
  color: #374151 !important;
  background: white !important;
  border: 1px solid #e5e7eb !important;
}

:deep(.logout-btn:hover),
:deep(.share-btn:hover) {
  background: #f9fafb !important;
  border-color: #d1d5db !important;
  color: #111827 !important;
}

.logout-btn {
  padding: 0.5rem;
}

/* 小设备响应式 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 250px;
    transform: translateX(-100%);
    z-index: 1000;
  }

  .sidebar.active {
    transform: translateX(0);
  }

  .sidebar.collapsed {
    width: 250px;
  }
}
</style>
