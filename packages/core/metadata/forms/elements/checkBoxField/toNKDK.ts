import { exportTitleToNKDK } from "~/metadata/commonObjects/title/toNKDK"
import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import { CheckBoxField, TableCheckBoxField } from "./types"

export const exportCheckBoxFieldToNKDK = (params: {
  context: ConfigurationContext
  element: CheckBoxField
}): ToNKDKResult => {
  const { context, element } = params
  const result = formatCheckBoxFieldContent(context, element, false)

  return {
    strings: [result],
    toOneLineGroup: true,
  }
}

export const exportCheckBoxFieldContentToNKDK = (params: {
  context: ConfigurationContext
  element: CheckBoxField
}): ToNKDKResult => {
  const { context, element } = params
  const result = formatCheckBoxFieldContent(context, element, true)

  return {
    strings: [result],
    toOneLineGroup: true,
  }
}

export const exportTableCheckBoxFieldContentToNKDK = (params: {
  context: ConfigurationContext
  element: TableCheckBoxField
}): ToNKDKResult => {
  return exportCheckBoxFieldContentToNKDK({
    context: params.context,
    element: params.element as unknown as Parameters<typeof exportCheckBoxFieldContentToNKDK>[0]["element"],
  })
}

const formatCheckBoxFieldContent = (
  context: ConfigurationContext,
  element: CheckBoxField,
  forContent: boolean
): string => {
  const title = exportTitleToNKDK({ context, title: element.title })
  const symbol = getCheckBoxFieldSymbol(element)
  const name = formatElementName(element)
  const isRightTitled = element.titleLocation == "Right" || forContent

  if (title !== undefined) {
    if (isRightTitled) {
      return `${symbol} ${title} ${name}`
    } else {
      return `${title} ${symbol} ${name}`
    }
  }

  if (isRightTitled) {
    return `${symbol} ${name}`
  }

  return `${name} ${symbol}`
}

const getCheckBoxFieldSymbol = (element: CheckBoxField): string => {
  switch (element.checkBoxType) {
    case "Switch":
      return "[ | ]"
    case "Tumbler":
      return "< | >"
    default:
      return "[ ]"
  }
}
