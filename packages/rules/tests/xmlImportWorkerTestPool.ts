import { createXmlImportWorkerPoolHandle, type XmlImportWorkerPoolHandle } from "../metadata/importFromXml/workerPool"
import { runImportWorkerCommand, setImportWorkerSchemaCacheForTests } from "../metadata/importFromXml/worker"
import type { ImportWorkerCommand, ImportWorkerCommandResult } from "../metadata/importFromXml/types"
import { createProjectStateService, type CreateProjectStateServiceOptions } from "../metadata/projectState/service"
import { createBinaryProjectStateStore } from "../metadata/projectState/binary/store"
import type { ProjectStateSharedBuffers } from "../metadata/projectState/binary/snapshot"
import { createProjectStateWriterHandle } from "../metadata/projectState/writerHandle"
import type { ValidationSchemaCache } from "../metadata/validation/projectValidationPasses"
import { createProjectStateDependencyValidator } from "../metadata/validation/projectStateDependencyValidation"
import { createMockWorkerThreadPoolFactory } from "./mockWorkerThreadPool"

const validSchema = {
  Check: () => true,
  Errors: (): [boolean, []] => [true, []],
}

const fastSchemaCache: ValidationSchemaCache = {
  form: () => validSchema,
  properties: () => validSchema,
  compileAll: () => ({ formMs: 0, propertiesMs: 0, totalMs: 0 }),
}

export function createImportProjectStateTestService(
  options: Pick<CreateProjectStateServiceOptions, "createPool"> = {},
) {
  const snapshots = new Map<string, ProjectStateSharedBuffers>()
  return createProjectStateService({
    ...options,
    createWriter: () => createProjectStateWriterHandle({
      openStore: async (projectDir) => createBinaryProjectStateStore({
        dependencyValidator: createProjectStateDependencyValidator(),
        projectDir,
        initial: snapshots.get(projectDir),
      }).store,
      save: async (projectDir, buffers) => {
        snapshots.set(projectDir, buffers)
      },
    }),
  })
}

export function createXmlImportWorkerTestPool(concurrency = 1): XmlImportWorkerPoolHandle {
  const threadPools = createMockWorkerThreadPoolFactory<ImportWorkerCommand, ImportWorkerCommandResult>(async (command) => {
    if (command.kind !== "initialize") return runImportWorkerCommand(command)
    setImportWorkerSchemaCacheForTests(fastSchemaCache)
    try {
      return await runImportWorkerCommand(command)
    } finally {
      setImportWorkerSchemaCacheForTests(undefined)
    }
  })
  return createXmlImportWorkerPoolHandle({
    concurrency,
    createWorkerPool: threadPools.factory,
  })
}
