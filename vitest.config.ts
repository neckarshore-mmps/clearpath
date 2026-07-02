import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      // Mirror tsconfig.json "paths": { "@/*": ["./*"] } — vitest does not
      // read tsconfig paths on its own.
      '@': rootDir,
    },
  },
  test: {
    environment: 'node',
  },
})
