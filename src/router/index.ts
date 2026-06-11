import { createRouter, createWebHistory, RouteRecordRaw, NavigationGuardNext } from 'vue-router'
import Home from '../views/Home.vue'
import Data from '../views/Data.vue'
import Login from '../views/Login.vue'
import MatchDetail from '../views/MatchDetail.vue'
import MatchGPDetail from '../views/MatchGPDetail.vue'
import MatchHistory from '../views/MatchHistory.vue'
import MatchGPHistory from '../views/MatchGPHistory.vue'
import MatchAllHistory from '../views/MatchAllHistory.vue'
import Rank from '../views/Rank.vue'
import MajorHomeworkRank from '../views/MajorHomeworkRank.vue'
import MajorHomeworkPersonal from '../views/MajorHomeworkPersonal.vue'
import AIChat from '../views/AIChat.vue'
import SteamStatus from '../views/SteamStatus.vue'
import { ElMessage } from 'element-plus'
import Cookies from 'js-cookie'
import { authAPI } from '../api'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/data',
    name: 'Data',
    component: Data,
    meta: { requiresAuth: true }
  },
  {
    path: '/match',
    name: 'MatchDetail',
    component: MatchDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/match-gp',
    name: 'MatchGPDetail',
    component: MatchGPDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/history',
    name: 'MatchHistory',
    component: MatchHistory,
    meta: { requiresAuth: true }
  },
  {
    path: '/history-gp',
    name: 'MatchGPHistory',
    component: MatchGPHistory,
    meta: { requiresAuth: true }
  },
  {
    path: '/history-all',
    name: 'MatchAllHistory',
    component: MatchAllHistory,
    meta: { requiresAuth: true }
  },
  {
    path: '/rank',
    name: 'Rank',
    component: Rank,
    meta: { requiresAuth: true }
  },
  {
    path: '/major-homework',
    name: 'MajorHomeworkRank',
    component: MajorHomeworkRank,
    meta: { requiresAuth: true }
  },
  {
    path: '/major-homework/me',
    name: 'MajorHomeworkPersonal',
    component: MajorHomeworkPersonal,
    meta: { requiresAuth: true }
  },
  {
    path: '/major-homework/user/:uid',
    name: 'MajorHomeworkUser',
    component: MajorHomeworkPersonal,
    meta: { requiresAuth: true }
  },
  {
    path: '/ai-chat',
    name: 'AIChat',
    component: AIChat,
    meta: { requiresAuth: true }
  },
  {
    path: '/steam-status',
    name: 'SteamStatus',
    component: SteamStatus,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, _from, next: NavigationGuardNext) => {
  const token = Cookies.get('token')
  const requiresAuth = to.meta.requiresAuth !== false

  // 如果页面不需要认证，直接放行
  if (!requiresAuth) {
    next()
    return
  }

  // 如果没有 token，跳转到登录页
  if (!token) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // 检查 token 是否有效
  try {
    await authAPI.verify()
    next()
  } catch (error: any) {
    if(error.response?.status === 401) {
      // token 无效，清除并跳转到登录页
      Cookies.remove('token')
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      console.error('验证 Token 时发生错误:', error)
      ElMessage.error('验证身份时发生错误，请稍后重试')
      return
    }
  }
})

export default router
