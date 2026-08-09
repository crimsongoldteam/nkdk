import { createPreparedYamlProjectRefreshExecutor, createPreparedYamlProjectWorkerPool } from "../project/preparedYamlProjectWorkerPool"
import { createProjectStateDependencyValidator } from "../validation/projectStateDependencyValidation"
import { createMetadataWorkerPoolHandle } from "../workerPool/handle"
import { openBinaryProjectStateReadSession } from "../projectState/binary/readSession"
import type { ProjectStateReadToken } from "../projectState/contracts"
import { createProjectStateWriterHandle } from "../projectState/writerHandle"
import {
  createProjectStateService,
  type CreateProjectStateServiceOptions,
  type ProjectStateService,
} from "../projectState/service"

export const openProjectStateReadSession = (token: ProjectStateReadToken) =>
  openBinaryProjectStateReadSession(token, createProjectStateDependencyValidator())

export function createDefaultProjectStateService(
  options: CreateProjectStateServiceOptions = {},
): ProjectStateService {
  const workers = options.workerPool ?? createMetadataWorkerPoolHandle()
  const dependencyValidator = createProjectStateDependencyValidator()
  return createProjectStateService({
    ...options,
    workerPool: workers,
    useWorkerOperation: options.createPool === undefined ? true : options.useWorkerOperation,
    createWriter: options.createWriter ?? (() => createProjectStateWriterHandle({ dependencyValidator })),
    openReadSession: options.openReadSession ?? openProjectStateReadSession,
    createPool: options.createPool ?? ((concurrency, operation, context) => {
      if (operation === undefined || context === undefined) {
        throw new Error("ProjectState refresh composition is incomplete")
      }
      const pool = createPreparedYamlProjectWorkerPool({ concurrency, operation })
      const executor = createPreparedYamlProjectRefreshExecutor(pool, context)
      return {
        ...executor,
        initValidation: (validationContext) => pool.initValidation(validationContext),
      }
    }),
  })
}
