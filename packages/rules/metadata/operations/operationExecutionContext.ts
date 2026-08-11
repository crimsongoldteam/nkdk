import { AsyncLocalStorage } from "node:async_hooks"

const storage = new AsyncLocalStorage<object>()

export function withOperationRegistrySet<Registry extends object, Result>(
  operations: Registry,
  execute: () => Result,
): Result {
  return storage.run(operations, execute)
}

export function currentOperationRegistrySet<Registry extends object>(): Registry | undefined {
  return storage.getStore() as Registry | undefined
}
