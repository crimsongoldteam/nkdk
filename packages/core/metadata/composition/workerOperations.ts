import { registerFullSyncWorkerOperation } from "../fullSyncToXml/worker"
import { registerImportWorkerOperation } from "../importFromXml/worker"
import { registerValidationWorkerOperation } from "../project/registerWorkerOperation"
import { registerMetadataWorkerOperation } from "../workerPool/operationRegistry"
import { registerProjectQueryWorkerOperation } from "../workerPool/projectQueries"

let operationsRegistered = false

export function registerMetadataWorkerOperations(): void {
  if (operationsRegistered) return
  operationsRegistered = true
  registerMetadataWorkerOperation("probe", async (command) => ({ kind: "probeResult", value: command.value }))
  registerValidationWorkerOperation()
  registerImportWorkerOperation()
  registerFullSyncWorkerOperation()
  registerProjectQueryWorkerOperation()
}

export function resetMetadataWorkerOperationsRegistrationForTests(): void {
  operationsRegistered = false
}
