import { createXmlImportWorkerPoolHandle, type XmlImportWorkerPoolHandle } from "../metadata/importFromXml/workerPool"
import { runImportWorkerCommand, setImportWorkerSchemaCacheForTests } from "../metadata/importFromXml/worker"
import type { ImportWorkerCommand, ImportWorkerCommandResult } from "../metadata/importFromXml/types"
import type { ProjectStateCompatibility } from "../metadata/projectState/compatibility"
import { createProjectStateService, type CreateProjectStateServiceOptions } from "../metadata/projectState/service"
import { createProjectStateWriterHandle } from "../metadata/projectState/writerHandle"
import type { ValidationSchemaCache } from "../metadata/validation/projectValidationPasses"
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

const projectStateCompatibility: ProjectStateCompatibility = {
  schemaVersion: 1,
  producerVersion: "xml-import-test",
  rulesFingerprint: "xml-import-test-rules",
  hashAlgorithm: "xxhash64-be-v1",
}

export function createImportProjectStateTestService(
  options: Pick<CreateProjectStateServiceOptions, "createPool"> = {},
) {
  return createProjectStateService({
    ...options,
    createWriter: () => createProjectStateWriterHandle({ compatibility: projectStateCompatibility }),
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
