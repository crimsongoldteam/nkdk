import type { ScenarioMatrix } from "./types"
import { childDeclarations } from "./children"
import { formDeclarations, formLifecycleOperations } from "./forms"
import { rootObjectDeclarations } from "./root-objects"
import { createInitialScenarioLayers } from "./layers"
import { configurationOperations } from "./configuration-operations"
import { structuralPropertyOperations } from "./structural-property-operations"
import { childPropertyOperations } from "./child-property-operations"
import { orderOperations, orderSetupOperations } from "./order-operations"
import { templateChangeOperations, templateDeclarations, templateRemovalOperations } from "./templates"
import { moduleOperations, moduleRestoreOperations, moduleSupplementalOperations } from "./module-operations"
import { externalFileOperations, externalFileRestoreOperations } from "./external-file-operations"

const declarations = {
  configurationOperations,
  structuralOperations: structuralPropertyOperations,
  childPropertyOperations,
  orderSetupOperations,
  orderOperations,
  formLifecycleOperations,
  roots: rootObjectDeclarations,
  children: childDeclarations,
  forms: formDeclarations,
  templates: templateDeclarations,
  templateChangeOperations,
  templateRemovalOperations,
  moduleOperations,
  moduleSupplementalOperations,
  moduleRestoreOperations,
  externalFileOperations,
  externalFileRestoreOperations,
} as const

export const partialSyncMatrix = {
  ...declarations,
  layers: createInitialScenarioLayers(declarations),
} as const satisfies ScenarioMatrix

export * from "./types"
export { rootObjectDeclarations } from "./root-objects"
export { createInitialScenarioLayers } from "./layers"
