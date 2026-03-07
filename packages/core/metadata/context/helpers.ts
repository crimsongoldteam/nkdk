import { MetadataItemType } from "../orchestration"
import {
  ConfigurationContext,
  ConfigurationContextWithExportToXML,
  ContextElementToEnterprise,
  ContextElementToXML,
} from "./types"

export const getChildContextToXML = (params: {
  context: ConfigurationContextWithExportToXML
  itemType: MetadataItemType
  path: string
  name: string
}): ConfigurationContextWithExportToXML => {
  const { context, itemType, path, name } = params
  const elements = context.exportToXML.itemsTree

  return {
    ...params.context,
    exportToXML: {
      ...params.context.exportToXML,
      itemsTree: [
        ...elements,
        {
          name: name,
          itemType: itemType,
          path: path,
        },
      ],
    },
  }
}

export const getParentFromContext = (
  context: ConfigurationContextWithExportToXML,
  itemTypes?: MetadataItemType[]
): ContextElementToXML => {
  const elements = context.exportToXML.itemsTree
  if (!elements || elements.length === 0) throw new Error("Parent element not found in context")

  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i]
    if (!itemTypes || itemTypes.includes(element.itemType)) {
      return element
    }
  }

  throw new Error("Parent element not found in context")
}

/** Возвращает таблицу, ближайшую к концу массива. Если таблица — последний элемент, возвращает undefined. */
export const getCurrentTableFromContext = (context: ConfigurationContext): ContextElementToEnterprise | undefined => {
  if (!context.enterprise) throw new Error("Enterprise context is not defined")

  const elements = context.enterprise.elementsTree
  if (!elements || elements.length === 0) {
    return undefined
  }

  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i]
    if (element.itemType === "Table") {
      return i === elements.length - 1 ? undefined : element
    }
  }

  return undefined
}

export const getCurrentElementFromContext = (context: ConfigurationContext): ContextElementToEnterprise | undefined => {
  if (!context.enterprise) throw new Error("Enterprise context is not defined")

  const elements = context.enterprise.elementsTree
  if (!elements || elements.length === 0) {
    return undefined
  }

  return elements[elements.length - 1]
}
