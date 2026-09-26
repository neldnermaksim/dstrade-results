import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_PATH позволяет развернуть раздел внутри основного сайта, например /results/
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  server: { port: 5173, host: true },
  preview: { port: 4173, host: true },
})
