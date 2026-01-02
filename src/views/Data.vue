<template>
  <div class="data-view">
    <div class="data-card">
      <h2>数据页面</h2>
      <p>这里是数据内容区域</p>
    </div>
  </div>
</template>

<script setup>
// 数据页面组件 - 内容待实现
</script>

<style scoped>
.data-view {
  width: 100%;
  height: 100%;
}

.data-card {
  background: white;
  padding: 2rem;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.data-card h2 {
  color: #111827;
  margin-bottom: 0.75rem;
  font-size: 1.375rem;
  font-weight: 500;
}

.data-card p {
  color: #6b7280;
  font-size: 0.9375rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .data-card {
    padding: 1.5rem;
  }
  
  .data-card h2 {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .data-card {
    padding: 1rem;
  }
  
  .data-card h2 {
    font-size: 1.125rem;
  }
  
  .data-card p {
    font-size: 0.875rem;
  }
}
</style>
