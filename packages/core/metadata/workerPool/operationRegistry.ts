import type { MetadataWorkerPersistentState } from "./workerState"
import type {
  MetadataWorkerOperationCommand,
  MetadataWorkerOperationOutcome,
  MetadataWorkerOperationResult,
  MetadataWorkerOperationTypeMap,
} from "./types"

export type MetadataWorkerOperationHandler<K extends keyof MetadataWorkerOperationTypeMap> = (
  command: MetadataWorkerOperationTypeMap[K]["command"],
  state: MetadataWorkerPersistentState,
) => Promise<MetadataWorkerOperationTypeMap[K]["result"]>

export type MetadataWorkerOperationResetHandler = (
  state: MetadataWorkerPersistentState,
  outcome: MetadataWorkerOperationOutcome,
) => Promise<void>

type ErasedMetadataWorkerOperationHandler = (
  command: MetadataWorkerOperationCommand,
  state: MetadataWorkerPersistentState,
) => Promise<MetadataWorkerOperationResult>

const handlers = new Map<PropertyKey, ErasedMetadataWorkerOperationHandler>()
const resetHandlers = new Map<PropertyKey, MetadataWorkerOperationResetHandler>()

export function registerMetadataWorkerOperation<K extends keyof MetadataWorkerOperationTypeMap>(
  kind: K,
  handler: MetadataWorkerOperationHandler<K>,
  reset?: MetadataWorkerOperationResetHandler,
): void {
  if (handlers.has(kind)) throw new Error(`Worker operation уже зарегистрирована: ${String(kind)}`)
  handlers.set(kind, eraseMetadataWorkerOperationHandler(kind, handler))
  if (reset !== undefined) resetHandlers.set(kind, reset)
}

export async function runRegisteredMetadataWorkerOperation(
  command: MetadataWorkerOperationCommand,
  state: MetadataWorkerPersistentState,
): Promise<MetadataWorkerOperationResult> {
  const handler = handlers.get(command.kind)
  if (handler === undefined) throw new Error(`Worker operation не зарегистрирована: ${command.kind}`)
  return handler(command, state)
}

export async function resetRegisteredMetadataWorkerOperations(
  state: MetadataWorkerPersistentState,
  outcome: MetadataWorkerOperationOutcome,
): Promise<void> {
  await Promise.all([...resetHandlers.values()].map((reset) => reset(state, outcome)))
}

export function resetMetadataWorkerOperationRegistryForTests(): void {
  handlers.clear()
  resetHandlers.clear()
}

function eraseMetadataWorkerOperationHandler<K extends keyof MetadataWorkerOperationTypeMap>(
  kind: K,
  handler: MetadataWorkerOperationHandler<K>,
): ErasedMetadataWorkerOperationHandler {
  return async (command, state) => {
    if (command.kind !== kind) throw new Error(`Worker operation kind не соответствует обработчику: ${command.kind}`)
    return handler(command as MetadataWorkerOperationTypeMap[K]["command"], state)
  }
}
