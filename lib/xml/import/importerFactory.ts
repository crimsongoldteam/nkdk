import { ImportFunction } from "./types"
import { TElement } from "~/lib/metadata/forms/elements/element/types"
import { importNamedElementFromXML } from "~/lib/metadata/forms/elements/element/importFromXML"

const importRegistry: Map<string, ImportFunction<TElement>> = new Map()

export const registerImport = <T extends TElement>(key: string, importFunction: ImportFunction<T>): void => {
  importRegistry.set(key, importFunction)
}

export const importElementFromXML = <T extends TElement>(data: any): T => {
  const key = Object.keys(data)[0]

  const importFunction = importRegistry.get(key) as ImportFunction<T>

  if (!importFunction) return importNamedElementFromXML(data) as unknown as T

  return importFunction(data)
}

export const clearImportRegistry = (): void => {
  importRegistry.clear()
}
