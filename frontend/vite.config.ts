import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'https://nua-assignment-z1fs.onrender.com',
        changeOrigin: true,
        secure: true
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
})
