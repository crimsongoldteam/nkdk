import { ImportFunction } from "./types"
import { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
import { importBaseElementFromXML } from "~/lib/metadata/forms/elements/baseElement/importFromXML"

const importRegistry: Map<string, ImportFunction<TBaseElement | undefined>> = new Map()

export const registerImport = <T extends TBaseElement | undefined>(
  key: string,
  importFunction: ImportFunction<T>
): void => {
  importRegistry.set(key, importFunction)
}

export const importElementFromXML = <T extends TBaseElement | undefined>(data: any): T => {
  const key = Object.keys(data)[0]

  const importFunction = importRegistry.get(key) as ImportFunction<T>

  if (!importFunction) return importBaseElementFromXML(data) as unknown as T

  return importFunction(data)
}

export const clearImportRegistry = (): void => {
  importRegistry.clear()
}
