import { AsyncLocalStorage } from "node:async_hooks"

const storage = new AsyncLocalStorage<object>()
let defaultOperations: object | undefined

export function withOperationRegistrySet<Registry extends object, Result>(
  operations: Registry,
  execute: () => Result,
): Result {
  return storage.run(operations, execute)
}

export function currentOperationRegistrySet<Registry extends object>(): Registry | undefined {
  return (storage.getStore() ?? defaultOperations) as Registry | undefined
}

export function enterOperationRegistrySet<Registry extends object>(operations: Registry): void {
  storage.enterWith(operations)
}

export function setDefaultOperationRegistrySet(operations: object): void {
  defaultOperations = operations
}
