import { createXmlImportWorkerPoolHandle, type XmlImportWorkerPoolHandle } from "../metadata/importFromXml/workerPool"
import { createImportWorkerCommandRunner } from "../metadata/importFromXml/worker"
import type { ImportWorkerCommand, ImportWorkerCommandResult } from "../metadata/importFromXml/types"
import { createProjectStateService, type CreateProjectStateServiceOptions } from "../metadata/projectState/service"
import { createBinaryProjectStateStore } from "../metadata/projectState/binary/store"
import type { ProjectStateSharedBuffers } from "../metadata/projectState/binary/snapshot"
import { createProjectStateWriterHandle } from "../metadata/projectState/writerHandle"
import { createProjectStateDependencyValidator } from "../metadata/validation/projectStateDependencyValidation"
import { createMockWorkerThreadPoolFactory } from "./mockWorkerThreadPool"
import { permissiveValidationSchemaCache } from "./permissiveValidationSchemaCache"
import { metadataRules } from "../metadata/composition/metadataRules"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../metadata/composition/metadataExecutionContext"

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
  const registries = Array.from(
    { length: concurrency },
    () => createMetadataExecutionRegistrySets(metadataRules),
  )
  const threadPools = createMockWorkerThreadPoolFactory<ImportWorkerCommand, ImportWorkerCommandResult>(
    async (command, workerIndex) => {
      const worker = workers.get(workerIndex) ?? createImportWorkerCommandRunner()
      workers.set(workerIndex, worker)
      return withMetadataExecutionRegistrySets(registries[workerIndex]!, async () => {
        if (command.kind !== "initialize") return worker.run(command)
        worker.setSchemaCacheForTests(permissiveValidationSchemaCache)
        try {
          return await worker.run(command)
        } finally {
          worker.setSchemaCacheForTests(undefined)
        }
      })
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
