<template>
  <div class="home-view">
    <div class="welcome-card">
      <h2>欢迎来到主页</h2>
      <p>这里是主页内容区域</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 主页组件 - 内容待实现
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

.welcome-card h2 {
  color: #111827;
  margin-bottom: 0.75rem;
  font-size: 1.375rem;
  font-weight: 500;
}

.welcome-card p {
  color: #6b7280;
  font-size: 0.9375rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .welcome-card {
    padding: 1.5rem;
  }
  
  .welcome-card h2 {
    font-size: 1.25rem;
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
