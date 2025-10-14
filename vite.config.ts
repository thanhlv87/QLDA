import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Replace QLDA-NPSC with your repository name
  root: '.',          // chỉ định gốc dự án là thư mục hiện tại
  build: {
    outDir: 'dist',   // đầu ra build
    },
})
