import { rootObjectDeclarations } from "./root-objects"
import type { RootObjectDeclaration, ScenarioOperation } from "./types"

export function createRootPropertyOperations(
  roots: readonly RootObjectDeclaration[],
): readonly ScenarioOperation[] {
  return roots.flatMap((declaration): readonly ScenarioOperation[] => declaration.propertyChanges.length === 0
    ? []
    : [{
  key: `change:${declaration.key}:comment`,
  kind: "change",
  targetKey: declaration.key,
  changes: declaration.propertyChanges,
  dependsOn: [declaration.key],
    }])
}

export const rootPropertyOperations = createRootPropertyOperations(rootObjectDeclarations)
