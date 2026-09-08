import { createLocalIndexesCollector, ExecutionPath, type DirectImportTraversal } from "@nkdk/runtime/rule-kit"

export function createTestImportTraversal(overrides: Partial<DirectImportTraversal> = {}): DirectImportTraversal {
  return {
    pathCursor: ExecutionPath.from<string | number>([]),
    rulePath: [],
    collector: createLocalIndexesCollector(),
    ...overrides,
  }
}
