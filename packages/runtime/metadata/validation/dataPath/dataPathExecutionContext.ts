import { AsyncLocalStorage } from "node:async_hooks"

const storage = new AsyncLocalStorage<object>()
let defaultDataPaths: object | undefined

export function withDataPathRegistrySet<Registry extends object, Result>(
  dataPaths: Registry,
  execute: () => Result,
): Result {
  return storage.run(dataPaths, execute)
}

export function currentDataPathRegistrySet<Registry extends object>(): Registry | undefined {
  return (storage.getStore() ?? defaultDataPaths) as Registry | undefined
}

export function enterDataPathRegistrySet<Registry extends object>(dataPaths: Registry): void {
  storage.enterWith(dataPaths)
}

export function setDefaultDataPathRegistrySet(dataPaths: object): void {
  defaultDataPaths = dataPaths
}
