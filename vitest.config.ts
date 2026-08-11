import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'packages/rules/vitest.config.ts',
      'packages/runtime/vitest.config.ts',
      'packages/platform/vitest.config.ts',
      'packages/mcp/vitest.config.ts',
    ],
  },
})
