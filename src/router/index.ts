import { createRouter, createWebHistory, RouteRecordRaw, NavigationGuardNext } from 'vue-router'
import Home from '../views/Home.vue'
import Data from '../views/Data.vue'
import Login from '../views/Login.vue'
import MatchDetail from '../views/MatchDetail.vue'
import MatchHistory from '../views/MatchHistory.vue'
import { authAPI, type UserInfo } from '../api'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

// 全局缓存用户信息，避免重复调用 getInfo
let cachedUserInfo: UserInfo | null = null
let userInfoPromise: Promise<UserInfo> | null = null

export const getCachedUserInfo = (): UserInfo | null => cachedUserInfo
export const setUserInfoPromise = (promise: Promise<UserInfo>) => {
  userInfoPromise = promise
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
    path: '/history',
    name: 'MatchHistory',
    component: MatchHistory,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, _from, next: NavigationGuardNext) => {
  const token = localStorage.getItem('token')
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

  // 检查 token 是否有效，并缓存用户信息
  try {
    // 如果还没有发起请求，就发起一个，之后就用缓存的结果
    if (!userInfoPromise) {
      userInfoPromise = authAPI.getInfo()
    }
    cachedUserInfo = await userInfoPromise
    next()
  } catch (error) {
    // token 无效，清除缓存并跳转到登录页
    localStorage.removeItem('token')
    userInfoPromise = null
    cachedUserInfo = null
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})

export default router
