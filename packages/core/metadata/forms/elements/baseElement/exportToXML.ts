import { ConfigurationContext } from "~/metadata/context/types"
import { ImportExportReturn } from "../types"
import { BaseElement, BaseElementXML } from "./types"

interface ElementIdContext {
  elementIdCounter?: number
}

const getElementId = (context: ConfigurationContext): string => {
  if (context.testMode) {
    return "1"
  }

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

export const exportBaseElementToXML = <T extends BaseElement | undefined>(
  context: ConfigurationContext,
  data: T
): ImportExportReturn<T, BaseElementXML> => {
  if (!data) return undefined as ImportExportReturn<T, BaseElementXML>

  const result: BaseElementXML = {
    _name: data.name,
    _id: getElementId(context),
  }

  return result as ImportExportReturn<T, BaseElementXML>
}
