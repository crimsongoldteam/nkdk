import { AsyncLocalStorage } from "node:async_hooks"

const storage = new AsyncLocalStorage<object>()

export function withDataPathRegistrySet<Registry extends object, Result>(
  dataPaths: Registry,
  execute: () => Result,
): Result {
  return storage.run(dataPaths, execute)
}

export function currentDataPathRegistrySet<Registry extends object>(): Registry | undefined {
  return storage.getStore() as Registry | undefined
}

export function enterDataPathRegistrySet<Registry extends object>(dataPaths: Registry): void {
  storage.enterWith(dataPaths)
}
