import { registerCoreMetadata } from "../register"
import preparedYamlProjectWorkerEntryPoint, {
  type PreparedYamlProjectWorkerTask,
  type PreparedYamlProjectWorkerTaskResult,
} from "../project/preparedYamlProjectWorker"

registerCoreMetadata()

export default function preparedYamlProjectEntry(
  message: PreparedYamlProjectWorkerTask
): Promise<PreparedYamlProjectWorkerTaskResult> {
  return preparedYamlProjectWorkerEntryPoint(message)
}
