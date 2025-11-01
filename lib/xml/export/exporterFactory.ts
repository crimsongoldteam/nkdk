import { TChildItemXML } from "~/lib/metadata/forms/elements/childItems/types"
import { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
import { TBaseElementXML } from "~/lib/metadata/forms/elements/baseElement/types"

type ExportFunction<T extends TBaseElement | undefined> = (data: T) => any

const exportRegistry: Map<string, ExportFunction<TBaseElement | undefined>> = new Map()

export const registerExport = <T extends TBaseElement | undefined>(
  key: string,
  exportFunction: ExportFunction<T>
): void => {
  if (!key) {
    throw new Error("Key is required")
  }

  exportRegistry.set(key.toLowerCase(), exportFunction as ExportFunction<TBaseElement | undefined>)
}

export const exportElementToXML = <T extends TBaseElement | undefined>(data: T): TChildItemXML => {
  if (!data) {
    throw new Error("Element is required")
  }

  const exportFunction = exportRegistry.get(data.elementType.toLowerCase())

  if (!exportFunction) {
    throw new Error(`Export function for element type ${data.elementType} not found`)
  }

  const exported = exportFunction(data)
  const baseXML: TBaseElementXML = {
    _id: data.id ?? "",
    _name: data.name,
  }

  return {
    [data.elementType]: {
      ...baseXML,
      ...exported,
    },
  } as TChildItemXML
}

export const clearExportRegistry = (): void => {
  exportRegistry.clear()
}
