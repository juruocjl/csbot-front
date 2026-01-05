<template>
  <el-button @click="showDialog = true" class="user-choose-btn">
    <Users :size="18" :stroke-width="2" />
    选择玩家
  </el-button>

  <el-dialog v-model="showDialog" title="选择玩家" width="60%">
    <div class="user-list">
      <div class="dialog-header">
        <div class="avatar-toggle">
          <span>头像类型：</span>
          <el-switch 
            v-model="useQQAvatar"
            active-text="QQ"
            inactive-text="Steam"
            size="large"
          />
        </div>
      </div>

      <div 
        v-if="users.length === 0" 
        class="empty-state"
      >
        加载中...
      </div>
      <div 
        v-else
        class="user-grid"
      >
        <div
          v-for="user in users"
          :key="user.steamId"
          class="user-item"
          @click="selectUser(user)"
        >
          <el-avatar 
            :src="getAvatarUrl(user)"
            :alt="useQQAvatar ? user.qqNickname : user.nickname"
            :size="80"
            class="user-avatar"
            @error="handleAvatarError"
          />
          <div class="user-details">
            <p class="qq-nickname">{{ user.qqNickname }}</p>
            <p class="nickname">{{ user.nickname }}</p>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Users } from 'lucide-vue-next'
import { configAPI, type UserQQItem } from '../api'
import { ElMessage } from 'element-plus'

interface Props {
  targetPath?: string
}

const props = withDefaults(defineProps<Props>(), {
  targetPath: '/data'
})

const router = useRouter()
const showDialog = ref(false)
const users = ref<UserQQItem[]>([])
const useQQAvatar = ref(true)

const getAvatarUrl = (user: UserQQItem): string => {
  if (useQQAvatar.value) {
    return `https://q1.qlogo.cn/g?b=qq&nk=${user.qq}&s=640`
  } else {
    return `/imgs/avatar/${user.steamId}.png`
  }
}

const handleAvatarError = (e: Event): void => {
  const img = e.target as HTMLImageElement
  img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="28"%3E?%3C/text%3E%3C/svg%3E'
}

const loadUsers = async (): Promise<void> => {
  try {
    const response = await configAPI.getUsers()
    users.value = response.users
  } catch (err) {
    console.error('获取用户列表失败:', err)
    ElMessage.error('获取用户列表失败')
  }
}

const selectUser = (user: UserQQItem): void => {
  showDialog.value = false
  router.push({
    path: props.targetPath,
    query: { steamId: user.steamId }
  })
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-choose-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-list {
  padding: 1rem 0;
}

.dialog-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #ebeef5;
}

.avatar-toggle {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1.5rem;
}

.user-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.user-item:hover {
  background-color: #f5f7fa;
  border-color: #409eff;
  transform: translateY(-4px);
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  text-align: center;
  width: 100%;
  overflow: hidden;
}

.qq-nickname {
  margin: 0.5rem 0 0.25rem;
  font-weight: 500;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nickname {
  margin: 0;
  font-size: 0.75rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
