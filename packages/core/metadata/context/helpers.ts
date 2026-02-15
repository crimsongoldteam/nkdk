import { FormElementType } from "../metadataFactory"
import { ConfigurationContext, ContextElementTreeItem } from "./types"

export const getParentFromContext = (
  context: ConfigurationContext,
  itemType?: FormElementType
): ContextElementTreeItem => {
  const elements = context.elementsTree
  if (!elements || elements.length === 0) {
    throw new Error("Parent element not found in context")
  }

  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i]
    if (!itemType || element.itemType === itemType) {
      return element
    }
  }

  throw new Error("Parent element not found in context")
}
