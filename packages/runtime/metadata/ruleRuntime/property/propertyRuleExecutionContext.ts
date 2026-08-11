import { AsyncLocalStorage } from "node:async_hooks"

const storage = new AsyncLocalStorage<object>()

export function withPropertyRuleRegistrySet<Registry extends object, Result>(
  registries: Registry,
  execute: () => Result,
): Result {
  return storage.run(registries, execute)
}

export function currentPropertyRuleRegistrySet<Registry extends object>(): Registry | undefined {
  return storage.getStore() as Registry | undefined
}
