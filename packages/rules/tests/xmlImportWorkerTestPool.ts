import { createXmlImportWorkerPoolHandle, type XmlImportWorkerPoolHandle } from "../metadata/importFromXml/workerPool"
import { createImportWorkerCommandRunner } from "../metadata/importFromXml/worker"
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
  return createInspectableXmlImportWorkerTestPool(concurrency).handle
}

export function createInspectableXmlImportWorkerTestPool(concurrency = 1): {
  readonly handle: XmlImportWorkerPoolHandle
  commands(workerIndex: number): readonly ImportWorkerCommand[]
} {
  const workers = new Map<number, ReturnType<typeof createImportWorkerCommandRunner>>()
  const threadPools = createMockWorkerThreadPoolFactory<ImportWorkerCommand, ImportWorkerCommandResult>(
    async (command, workerIndex) => {
      const worker = workers.get(workerIndex) ?? createImportWorkerCommandRunner()
      workers.set(workerIndex, worker)
      if (command.kind !== "initialize") return worker.run(command)
      worker.setSchemaCacheForTests(fastSchemaCache)
      try {
        return await worker.run(command)
      } finally {
        worker.setSchemaCacheForTests(undefined)
      }
    },
  )
  return {
    handle: createXmlImportWorkerPoolHandle({
      concurrency,
      createWorkerPool: threadPools.factory,
    }),
    commands: threadPools.commands,
  }
}
