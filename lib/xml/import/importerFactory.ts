import { ChildItemXML } from "~/lib/metadata/forms/elements/childItems/types"
import { ImportFunction } from "./types"
import { BaseElement } from "~/lib/metadata/forms/elements/baseElement/types"

const importRegistry: Map<
  string,
  ImportFunction<BaseElement | undefined>
> = new Map()

export const registerImport = <T extends BaseElement | undefined>(
  key: string,
  importFunction: ImportFunction<T>
): void => {
  if (!key) {
    throw new Error("Key is required")
  }

  importRegistry.set(key.toLowerCase(), importFunction)
}

export const importElementFromXML = <T extends BaseElement | undefined>(
  data: ChildItemXML
): T => {
  const key = Object.keys(data)[0] as string | undefined

  if (!key) {
    throw new Error("Empty child item object: no keys found")
  }

  const importFunction = importRegistry.get(
    key.toLowerCase()
  ) as ImportFunction<T>

  if (!importFunction)
    throw new Error(`Import function for key ${key} not found`)

  return importFunction(data[key as keyof typeof data])
}

export const clearImportRegistry = (): void => {
  importRegistry.clear()
}
