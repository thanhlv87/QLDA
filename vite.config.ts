import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // hoặc '/QLDA/' nếu deploy GitHub Pages
  root: '.', // thư mục gốc dự án
  build: {
    outDir: 'dist', // đầu ra build
  },
})
