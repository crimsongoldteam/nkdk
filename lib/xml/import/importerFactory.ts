import { ImportFunction } from "./types"
import { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
import { baseElementXMLDecode } from "~/lib/metadata/forms/elements/baseElement/decodeXML"

const importRegistry: Map<string, ImportFunction<TBaseElement>> = new Map()

export const registerImport = <T extends TBaseElement>(key: string, importFunction: ImportFunction<T>): void => {
  importRegistry.set(key, importFunction)
}

export const importElementFromXML = <T extends TBaseElement>(data: any): T => {
  const key = Object.keys(data)[0]

  const importFunction = importRegistry.get(key) as ImportFunction<T>

  if (!importFunction) return baseElementXMLDecode(data) as unknown as T

  return importFunction(data)
}

export const clearImportRegistry = (): void => {
  importRegistry.clear()
}
