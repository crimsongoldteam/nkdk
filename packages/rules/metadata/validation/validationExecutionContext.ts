import { AsyncLocalStorage } from "node:async_hooks"
import { withDataPathRegistrySet } from "@nkdk/runtime/rule-kit"

const storage = new AsyncLocalStorage<object>()

export function withValidationRegistrySet<Registry extends { readonly dataPaths: object }, Result>(
  validation: Registry,
  execute: () => Result,
): Result {
  return withDataPathRegistrySet(validation.dataPaths, () => storage.run(validation, execute))
}

export function currentValidationRegistrySet<Registry extends object>(): Registry | undefined {
  return storage.getStore() as Registry | undefined
}
