import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Absolute path to `__fixtures__` next to the test file.
 * Pass `import.meta.url` from the test module.
 */
export const testFixturesDir = (importMetaUrl: string): string =>
  join(dirname(fileURLToPath(importMetaUrl)), "__fixtures__")
