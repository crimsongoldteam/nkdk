import { ConfigurationContext } from "~/metadata/context/types"
import { formatDefaultLanguageText, formatElementName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { CheckBoxField } from "./types"

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

const formatCheckBoxFieldContent = (
  context: ConfigurationContext,
  element: CheckBoxField,
  forContent: boolean
): string => {
  const title = formatDefaultLanguageText(context, element.title)
  const symbol = getCheckBoxFieldSymbol(element)
  const name = formatElementName(element)
  const isRightTitled = element.titleLocation == "Right" || forContent

  if (title) {
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
