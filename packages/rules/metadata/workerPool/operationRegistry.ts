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

export interface MetadataWorkerOperationRegistry {
  register<K extends keyof MetadataWorkerOperationTypeMap>(
    kind: K,
    handler: MetadataWorkerOperationHandler<K>,
    reset?: MetadataWorkerOperationResetHandler,
  ): void
  run(
    command: MetadataWorkerOperationCommand,
    state: MetadataWorkerPersistentState,
  ): Promise<MetadataWorkerOperationResult>
  reset(
    state: MetadataWorkerPersistentState,
    outcome: MetadataWorkerOperationOutcome,
  ): Promise<void>
}

export function createMetadataWorkerOperationRegistry(): MetadataWorkerOperationRegistry {
  const instanceHandlers = new Map<PropertyKey, ErasedMetadataWorkerOperationHandler>()
  const instanceResetHandlers = new Map<PropertyKey, MetadataWorkerOperationResetHandler>()

  return {
    register(kind, handler, reset) {
      if (instanceHandlers.has(kind)) {
        throw new Error(`Worker operation уже зарегистрирована: ${String(kind)}`)
      }
      instanceHandlers.set(kind, eraseMetadataWorkerOperationHandler(kind, handler))
      if (reset !== undefined) instanceResetHandlers.set(kind, reset)
    },
    async run(command, state) {
      const handler = instanceHandlers.get(command.kind)
      if (handler === undefined) {
        throw new Error(`Worker operation не зарегистрирована: ${command.kind}`)
      }
      return handler(command, state)
    },
    async reset(state, outcome) {
      await Promise.all([...instanceResetHandlers.values()].map((reset) => reset(state, outcome)))
    },
  }
}

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

export const legacyMetadataWorkerOperationRegistry: MetadataWorkerOperationRegistry = {
  register: registerMetadataWorkerOperation,
  run: runRegisteredMetadataWorkerOperation,
  reset: resetRegisteredMetadataWorkerOperations,
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
