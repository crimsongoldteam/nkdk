import { ImportFunction } from "./types"
import { TElement } from "~/lib/metadata/forms/elements/element/types"

const importRegistry: Map<string, ImportFunction> = new Map()

export const registerImport = (key: string, importFunction: ImportFunction): void => {
  importRegistry.set(key, importFunction)
}

export const importElementFromXML = <T extends TElement>(key: string, value: any): T => {
  const importFunction = importRegistry.get(key)

  if (!importFunction) throw new Error(`Import function for key ${key} not found`)

  return importFunction(value) as T
}

export const clearImportRegistry = (): void => {
  importRegistry.clear()
}
