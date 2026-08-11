import { rmSync } from "node:fs"

import { mockContext } from "../../../tests/mockContext"
import type { OwnerMetadataCache } from "../dataPath/ownerCache"
import { createValidationRulesSnapshot } from "../rulesSnapshot"

export const missingOwnerMetadataCache: OwnerMetadataCache = {
  get: () => ({ status: "not-found", diagnostics: [] }),
  listRefs: () => [],
}

export function createTestValidationRulesSnapshot(): ReturnType<typeof createValidationRulesSnapshot> {
  return createValidationRulesSnapshot(mockContext)
}

export function removeTrackedDirectories(directories: string[]): void {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
}
