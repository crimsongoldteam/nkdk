import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'packages/cli/vitest.config.ts',
      'packages/core/vitest.config.ts',
      'packages/extension/vitest.config.ts',
      'packages/language/vitest.config.ts',
    ],
  },
})
