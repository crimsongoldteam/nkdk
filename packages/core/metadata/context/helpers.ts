export { getChildContextToXML } from "@nkdk/runtime/rule-kit"
import {
  ConfigurationContext,
  ContextElementToEnterprise,
} from "./types"

interface ParentContextElement {
  itemType: string
  name: string
  path: string
}

interface ContextWithItemsTree {
  exportToXML: {
    itemsTree: readonly ParentContextElement[]
  }
}

export const getParentFromContext = (
  context: ContextWithItemsTree,
  itemTypes?: readonly string[]
): ParentContextElement => {
  const elements = context.exportToXML.itemsTree
  if (!elements || elements.length === 0) return { itemType: "MetadataCatalog", name: "", path: "" }

  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i]
    if (!itemTypes || itemTypes.includes(element.itemType)) {
      return element
    }
  }

  return { itemType: "MetadataCatalog", name: "", path: "" }
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
      return element
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
