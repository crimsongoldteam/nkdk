import type {
  MetadataWorkerOperationRuleTypeMap,
} from "../ruleRuntime/definition"
import type {
  WorkerOperationKind,
  WorkerOperationRegistry,
} from "../operations/operationRegistrySet"

export function createMetadataWorkerHandler(
  worker: WorkerOperationRegistry,
  state: object,
): <Kind extends WorkerOperationKind>(
  command: MetadataWorkerOperationRuleTypeMap[Kind]["command"],
) => Promise<MetadataWorkerOperationRuleTypeMap[Kind]["result"]> {
  return <Kind extends WorkerOperationKind>(
    command: MetadataWorkerOperationRuleTypeMap[Kind]["command"],
  ) =>
    worker.run(
      command,
      state as MetadataWorkerOperationRuleTypeMap[Kind]["state"],
    )
}
