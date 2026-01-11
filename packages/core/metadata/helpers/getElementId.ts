import { ConfigurationContext } from "../context/types"

interface ElementIdContext {
  elementIdCounter?: number
}

export const getElementId = (context: ConfigurationContext): string => {
  if (!context.context) {
    context.context = {}
  }

  const elementContext = context.context as ElementIdContext
  if (elementContext.elementIdCounter === undefined) {
    elementContext.elementIdCounter = 1
  } else {
    elementContext.elementIdCounter++
  }

  return String(elementContext.elementIdCounter)
}
