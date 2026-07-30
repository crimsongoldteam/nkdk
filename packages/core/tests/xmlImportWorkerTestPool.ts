import { createXmlImportWorkerPoolHandle, type XmlImportWorkerPoolHandle } from "../metadata/importFromXml/workerPool"
import { runImportWorkerCommand } from "../metadata/importFromXml/worker"
import type { ImportWorkerCommand, ImportWorkerCommandResult } from "../metadata/importFromXml/types"
import { createMockWorkerThreadPoolFactory } from "./mockWorkerThreadPool"

export function createXmlImportWorkerTestPool(concurrency = 1): XmlImportWorkerPoolHandle {
  const threadPools = createMockWorkerThreadPoolFactory<ImportWorkerCommand, ImportWorkerCommandResult>((command) =>
    runImportWorkerCommand(command)
  )
  return createXmlImportWorkerPoolHandle({
    concurrency,
    createWorkerPool: threadPools.factory,
  })
}
