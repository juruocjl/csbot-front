import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 80,
    open: true,
    proxy: {
      '/api': {
        target: 'http://cgserver:1234', // 你的 Nonebot/后端地址
        changeOrigin: true, // 解决跨域的关键
      }
    }
  }
})
