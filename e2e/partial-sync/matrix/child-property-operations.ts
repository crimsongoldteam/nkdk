import { childDeclarations } from "./children"
import type { ScenarioOperation } from "./types"

export const childPropertyOperations = childDeclarations.map((declaration): ScenarioOperation => ({
  key: `change:${declaration.key}:property`,
  kind: "change",
  ownerKey: declaration.ownerKey,
  targetKey: declaration.key,
  changes: declaration.propertyChanges,
  dependsOn: [declaration.key],
}))
