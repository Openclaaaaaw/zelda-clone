import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  server: {
    port: 3001,
    host: true
  },
  build: {
    outDir: 'dist'
  }
})
