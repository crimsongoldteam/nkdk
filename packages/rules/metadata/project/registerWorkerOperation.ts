import {
  legacyMetadataWorkerOperationRegistry,
  type MetadataWorkerOperationRegistry,
} from "../workerPool/operationRegistry"
import { runPreparedYamlProjectWorkerTask } from "./preparedYamlProjectWorker"

export function registerValidationWorkerOperation(
  registry: MetadataWorkerOperationRegistry = legacyMetadataWorkerOperationRegistry,
): void {
  registry.register("validation", async (command, state) =>
    runPreparedYamlProjectWorkerTask(command.task, {
      persistentValidationState: {
        schemaCache: state.schemaCache,
        rulesSnapshot: state.rulesSnapshot,
      },
    }))
}
