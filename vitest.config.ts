import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    environmentMatchGlobs: [
      ['src/renderer/**', 'jsdom'],
    ],
    setupFiles: ['src/renderer/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@main': path.resolve(__dirname, 'src/main'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
})
