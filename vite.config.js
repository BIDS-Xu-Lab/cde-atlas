import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/cde-atlas/',
  plugins: [vue()],
  server: {
    port: 5173,
  },
})
