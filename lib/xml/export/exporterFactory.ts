import { ChildItemXML } from "~/lib/metadata/forms/elements/childItems/types"
import { BaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
import { BaseElementXML } from "~/lib/metadata/forms/elements/baseElement/types"

type ExportFunction<T extends BaseElement | undefined> = (data: T) => any

const exportRegistry: Map<string, ExportFunction<BaseElement | undefined>> = new Map()

export const registerExport = <T extends BaseElement | undefined>(
  key: string,
  exportFunction: ExportFunction<T>
): void => {
  if (!key) {
    throw new Error("Key is required")
  }

  exportRegistry.set(key.toLowerCase(), exportFunction as ExportFunction<BaseElement | undefined>)
}

export const exportElementToXML = <T extends BaseElement | undefined>(data: T): ChildItemXML => {
  if (!data) {
    throw new Error("Element is required")
  }

  const exportFunction = exportRegistry.get(data.elementType.toLowerCase())

  if (!exportFunction) {
    throw new Error(`Export function for element type ${data.elementType} not found`)
  }

  const exported = exportFunction(data)
  const baseXML: BaseElementXML = {
    _id: data.id ?? "",
    _name: data.name,
  }

  return {
    [data.elementType]: {
      ...baseXML,
      ...exported,
    },
  } as ChildItemXML
}

export const clearExportRegistry = (): void => {
  exportRegistry.clear()
}
