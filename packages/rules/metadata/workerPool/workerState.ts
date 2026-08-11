import type { ConfigurationContext } from "@nkdk/runtime"
import type { ProjectStateReadToken } from "../projectState/contracts"
import type { ProjectStateReadSession } from "../projectState/readSession"
import { openBinaryProjectStateReadSession } from "../projectState/binary/readSession"
import { createProjectStateDependencyValidator } from "../validation/projectStateDependencyValidation"
import {
  createProjectValidationWorkerSchemaCache,
} from "../validation/projectValidationWorkerSchemaCache"
import type { ValidationSchemaCache } from "../validation/projectValidationPasses"
import {
  createValidationRulesSnapshot,
  type ValidationRulesSnapshot,
} from "../validation/rulesSnapshot"
import type { ValidationRegistrySet } from "../validation/validationRegistrySet"

export interface MetadataWorkerPersistentState {
  readonly workerIndex: number
  readonly context: ConfigurationContext
  readonly schemaCache: ValidationSchemaCache
  readonly rulesSnapshot: ValidationRulesSnapshot
  readonly validationRuntime?: ValidationRegistrySet
  readonly projectState: ProjectStateReadSession | undefined
  installProjectState(token: ProjectStateReadToken): void
  clearProjectState(): void
  beginOperation(operationId: string): void
  resetOperation(operationId: string): void
}

export interface MetadataWorkerStateDependencies {
  readonly createSchemaCache?: typeof createProjectValidationWorkerSchemaCache
  readonly createRulesSnapshot?: typeof createValidationRulesSnapshot
  readonly openReadSession?: (token: ProjectStateReadToken) => ProjectStateReadSession
  readonly validationRuntime?: ValidationRegistrySet
}

export async function createMetadataWorkerPersistentState(
  params: { readonly workerIndex: number; readonly context: ConfigurationContext },
  dependencies: MetadataWorkerStateDependencies = {},
): Promise<MetadataWorkerPersistentState> {
  const schemaCache = await (dependencies.createSchemaCache ?? createProjectValidationWorkerSchemaCache)({
    context: params.context,
  })
  const rulesSnapshot = (dependencies.createRulesSnapshot ?? createValidationRulesSnapshot)(params.context)
  const openReadSession = dependencies.openReadSession
    ?? ((token) => openBinaryProjectStateReadSession(token, createProjectStateDependencyValidator()))
  let projectState: ProjectStateReadSession | undefined
  let activeOperationId: string | undefined

  return {
    workerIndex: params.workerIndex,
    context: params.context,
    schemaCache,
    rulesSnapshot,
    validationRuntime: dependencies.validationRuntime,
    get projectState() {
      return projectState
    },
    installProjectState(token) {
      const next = openReadSession(token)
      projectState?.close()
      projectState = next
    },
    clearProjectState() {
      projectState?.close()
      projectState = undefined
    },
    beginOperation(operationId) {
      if (activeOperationId !== undefined && activeOperationId !== operationId) {
        throw new Error(`Worker уже выполняет операцию ${activeOperationId}`)
      }
      activeOperationId = operationId
    },
    resetOperation(operationId) {
      if (activeOperationId !== undefined && activeOperationId !== operationId) {
        throw new Error(`Нельзя очистить чужую операцию ${operationId}`)
      }
      activeOperationId = undefined
    },
  }
}
