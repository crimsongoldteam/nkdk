import type { ScenarioMatrix } from "./types"
import { childDeclarations } from "./children"
import { formDeclarations } from "./forms"
import { rootObjectDeclarations } from "./root-objects"
import { createInitialScenarioLayers } from "./layers"
import { configurationOperations } from "./configuration-operations"
import { structuralPropertyOperations } from "./structural-property-operations"

const declarations = {
  configurationOperations,
  structuralOperations: structuralPropertyOperations,
  roots: rootObjectDeclarations,
  children: childDeclarations,
  forms: formDeclarations,
} as const

export const partialSyncMatrix = {
  ...declarations,
  layers: createInitialScenarioLayers(declarations),
} as const satisfies ScenarioMatrix

export * from "./types"
export { rootObjectDeclarations } from "./root-objects"
export { createInitialScenarioLayers } from "./layers"
