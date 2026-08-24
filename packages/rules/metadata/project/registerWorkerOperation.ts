import type { MetadataWorkerOperationRegistry } from "../workerPool/operationRegistry"
import {
  prepareYamlWorkerResultForTransport,
  runPreparedYamlProjectWorkerTask,
} from "./preparedYamlProjectWorker"

export function registerValidationWorkerOperation(
  registry: MetadataWorkerOperationRegistry,
): void {
  registry.register("validation", async (command, state) => {
    const result = await runPreparedYamlProjectWorkerTask(command.task, {
      persistentValidationState: {
        schemaCache: state.schemaCache,
        rulesSnapshot: state.rulesSnapshot,
      },
      validationRuntime: state.validationRuntime,
    })
    return prepareYamlWorkerResultForTransport(result)
  })
}
