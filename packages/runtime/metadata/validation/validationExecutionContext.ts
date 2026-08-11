import { AsyncLocalStorage } from "node:async_hooks"
import {
  enterDataPathRegistrySet,
  setDefaultDataPathRegistrySet,
  withDataPathRegistrySet,
} from "./dataPath/dataPathExecutionContext"

const storage = new AsyncLocalStorage<object>()
let defaultValidation: object | undefined

export function withValidationRegistrySet<Registry extends { readonly dataPaths: object }, Result>(
  validation: Registry,
  execute: () => Result,
): Result {
  return withDataPathRegistrySet(validation.dataPaths, () => storage.run(validation, execute))
}

export function currentValidationRegistrySet<Registry extends object>(): Registry | undefined {
  return (storage.getStore() ?? defaultValidation) as Registry | undefined
}

export function enterValidationRegistrySet<Registry extends { readonly dataPaths: object }>(validation: Registry): void {
  enterDataPathRegistrySet(validation.dataPaths)
  storage.enterWith(validation)
}

export function setDefaultValidationRegistrySet<Registry extends { readonly dataPaths: object }>(validation: Registry): void {
  setDefaultDataPathRegistrySet(validation.dataPaths)
  defaultValidation = validation
}
