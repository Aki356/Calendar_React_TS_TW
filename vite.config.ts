import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Конфиг Vite
export default defineConfig({
  plugins: [react()],
  base: '/Calendar_React_TS_TW/',
})
