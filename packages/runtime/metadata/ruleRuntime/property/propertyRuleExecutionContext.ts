import { AsyncLocalStorage } from "node:async_hooks"

const storage = new AsyncLocalStorage<object>()
let defaultRegistries: object | undefined

export function withPropertyRuleRegistrySet<Registry extends object, Result>(
  registries: Registry,
  execute: () => Result,
): Result {
  return storage.run(registries, execute)
}

export function currentPropertyRuleRegistrySet<Registry extends object>(): Registry | undefined {
  return (storage.getStore() ?? defaultRegistries) as Registry | undefined
}

export function enterPropertyRuleRegistrySet<Registry extends object>(registries: Registry): void {
  storage.enterWith(registries)
}

export function setDefaultPropertyRuleRegistrySet(registries: object): void {
  defaultRegistries = registries
}
