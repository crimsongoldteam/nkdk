import type { ScenarioMatrix } from "./types"
import { childDeclarations } from "./children"
import { formDeclarations } from "./forms"
import { rootObjectDeclarations } from "./root-objects"

export const partialSyncMatrix = {
  roots: rootObjectDeclarations,
  children: childDeclarations,
  forms: formDeclarations,
} as const satisfies ScenarioMatrix

export * from "./types"
export { rootObjectDeclarations } from "./root-objects"
