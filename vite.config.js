import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: process.env.VITE_USE_API === 'true' ? '/' : '/HouseholdFinances/',
  plugins: [react(), tailwindcss()],
})
