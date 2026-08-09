import type {
  PreparedYamlProjectWorkerTask,
  PreparedYamlProjectWorkerTaskResult,
} from "./preparedYamlProjectWorker"

declare module "../workerPool/types" {
  interface MetadataWorkerOperationTypeMap {
    validation: {
      command: { readonly kind: "validation"; readonly task: PreparedYamlProjectWorkerTask }
      result: PreparedYamlProjectWorkerTaskResult
    }
  }
}
