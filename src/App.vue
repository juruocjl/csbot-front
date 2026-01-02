<template>
  <div class="app">
    <div class="mobile-overlay" :class="{ active: mobileMenuOpen }" @click="mobileMenuOpen = false"></div>
    <aside class="sidebar" :class="{ active: mobileMenuOpen, collapsed: sidebarCollapsed }">
      <div class="logo">
        <h2 v-show="!sidebarCollapsed">Dashboard</h2>
        <h2 v-show="sidebarCollapsed" class="logo-icon">D</h2>
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
      </nav>
      <div class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
        <ChevronLeft v-if="!sidebarCollapsed" :size="20" :stroke-width="2" />
        <ChevronRight v-else :size="20" :stroke-width="2" />
      </div>
    </aside>
    <main class="main-content">
      <header class="header">
        <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div class="header-left">
          <h1>{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <div class="user-info">
            <span>管理员</span>
          </div>
          <button class="logout-btn" @click="handleLogout">
            <LogOut :size="18" :stroke-width="2" />
            <span>登出</span>
          </button>
        </div>
      </header>
      <div class="content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, BarChart3, ChevronLeft, ChevronRight, LogOut } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const mobileMenuOpen = ref(false)
const sidebarCollapsed = ref(false)

const pageTitle = computed(() => {
  const titles = {
    '/': '主页',
    '/data': '数据'
  }
  return titles[route.path] || 'Dashboard'
})

const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  background: #f5f5f5;
}

.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.mobile-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

.sidebar {
  width: 250px;
  background: #6366f1;
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, transform 0.3s ease;
  z-index: 999;
  position: relative;
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

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 10;
}

.mobile-menu-btn span {
  width: 2rem;
  height: 2px;
  background: #374151;
  transition: all 0.3s ease;
}

.header {
  background: white;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
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
  padding: 0.5rem 0.875rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
}

.content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .sidebar:not(.collapsed) {
    width: 200px;
  }
  
  .content {
    padding: 1.25rem;
  }
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }
  
  .mobile-overlay {
    display: block;
  }
  
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 250px;
    transform: translateX(-100%);
  }
  
  .sidebar.active {
    transform: translateX(0);
  }
  
  .sidebar-toggle {
    display: none;
  }
  
  .header {
    padding: 1rem;
  }
  
  .header-left h1 {
    font-size: 1.25rem;
  }
  
  .user-info {
    display: none;
  }
  
  .logout-btn span {
    display: none;
  }
  
  .logout-btn {
    padding: 0.5rem;
  }
  
  .content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .header-left h1 {
    font-size: 1.125rem;
  }
  
  .content {
    padding: 0.75rem;
  }
}
</style>
