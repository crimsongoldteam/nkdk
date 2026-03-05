import { ElementType } from "../orchestration"
import { ConfigurationContext, ContextElementToEnterprise, ContextElementToXML } from "./types"

export const getParentFromContext = (context: ConfigurationContext, itemTypes?: ElementType[]): ContextElementToXML => {
  const elements = context.elementsTree
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
