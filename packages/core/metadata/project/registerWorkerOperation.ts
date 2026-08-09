import { registerMetadataWorkerOperation } from "../workerPool/operationRegistry"
import { runPreparedYamlProjectWorkerTask } from "./preparedYamlProjectWorker"

export function registerValidationWorkerOperation(): void {
  registerMetadataWorkerOperation("validation", async (command, state) =>
    runPreparedYamlProjectWorkerTask(command.task, {
      persistentValidationState: {
        schemaCache: state.schemaCache,
        rulesSnapshot: state.rulesSnapshot,
      },
    }))
}
