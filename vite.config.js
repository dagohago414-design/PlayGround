import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: { host: '0.0.0.0', port: 3000 },
  build: { target: 'es2020', assetsInlineLimit: 0 }
})
