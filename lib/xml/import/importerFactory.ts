import { TChildItemXML } from "~/lib/metadata/forms/elements/childItems/types"
import { ImportFunction } from "./types"
import { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"

const importRegistry: Map<string, ImportFunction<TBaseElement | undefined>> = new Map()

export const registerImport = <T extends TBaseElement | undefined>(
  key: string,
  importFunction: ImportFunction<T>
): void => {
  if (!key) {
    throw new Error("Key is required")
  }

  importRegistry.set(key.toLowerCase(), importFunction)
}

export const importElementFromXML = <T extends TBaseElement | undefined>(data: TChildItemXML): T => {
  const key = Object.keys(data)[0]

  const importFunction = importRegistry.get(key.toLowerCase()) as ImportFunction<T>

  if (!importFunction) throw new Error(`Import function for key ${key} not found`)

  return importFunction(data[key])
}

export const clearImportRegistry = (): void => {
  importRegistry.clear()
}
