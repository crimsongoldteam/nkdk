import type { ScenarioMatrix } from "./types"
import { rootObjectDeclarations } from "./root-objects"

export const partialSyncMatrix = {
  roots: rootObjectDeclarations,
  children: [],
  forms: [],
} as const satisfies ScenarioMatrix

export * from "./types"
export { rootObjectDeclarations } from "./root-objects"
