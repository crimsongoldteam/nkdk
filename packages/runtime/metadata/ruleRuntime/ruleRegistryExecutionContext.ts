import { AsyncLocalStorage } from "node:async_hooks"

const storage = new AsyncLocalStorage<object>()
let defaultRules: object | undefined

export function withRuleRegistrySet<Registry extends object, Result>(
  rules: Registry,
  execute: () => Result,
): Result {
  return storage.run(rules, execute)
}

export function currentRuleRegistrySet<Registry extends object>(): Registry | undefined {
  return (storage.getStore() ?? defaultRules) as Registry | undefined
}

export function enterRuleRegistrySet<Registry extends object>(rules: Registry): void {
  storage.enterWith(rules)
}

export function setDefaultRuleRegistrySet(rules: object): void {
  defaultRules = rules
}
