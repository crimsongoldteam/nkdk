import { registerFullSyncWorkerOperation } from "../fullSyncToXml/worker"
import { registerImportWorkerOperation } from "../importFromXml/worker"
import { registerValidationWorkerOperation } from "../project/registerWorkerOperation"
import {
  createMetadataWorkerOperationRegistry,
  legacyMetadataWorkerOperationRegistry,
  type MetadataWorkerOperationRegistry,
} from "../workerPool/operationRegistry"
import { registerProjectQueryWorkerOperation } from "../workerPool/projectQueries"

let operationsRegistered = false

export function registerMetadataWorkerOperations(): void {
  if (operationsRegistered) return
  operationsRegistered = true
  registerOperations(legacyMetadataWorkerOperationRegistry)
}

export function createMetadataWorkerOperations(): MetadataWorkerOperationRegistry {
  const registry = createMetadataWorkerOperationRegistry()
  registerOperations(registry)
  return registry
}

function registerOperations(registry: MetadataWorkerOperationRegistry): void {
  registry.register("probe", async (command) => ({ kind: "probeResult", value: command.value }))
  registerValidationWorkerOperation(registry)
  registerImportWorkerOperation(registry)
  registerFullSyncWorkerOperation(registry)
  registerProjectQueryWorkerOperation(registry)
}

export function resetMetadataWorkerOperationsRegistrationForTests(): void {
  operationsRegistered = false
}
