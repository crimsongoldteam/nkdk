import { AsyncLocalStorage } from "node:async_hooks"

const storage = new AsyncLocalStorage<object>()

export function withRuleRegistrySet<Registry extends object, Result>(
  rules: Registry,
  execute: () => Result,
): Result {
  return storage.run(rules, execute)
}

export function currentRuleRegistrySet<Registry extends object>(): Registry | undefined {
  return storage.getStore() as Registry | undefined
}

export function enterRuleRegistrySet<Registry extends object>(rules: Registry): void {
  storage.enterWith(rules)
}
