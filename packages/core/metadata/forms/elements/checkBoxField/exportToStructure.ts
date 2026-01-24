import { ConfigurationContext } from "~/metadata/context/types"
import { formatDefaultLanguageText, formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureContentFn, ExportToStructureFn, FormElementType } from "~/metadata/metadataFactory/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { CheckBoxField } from "./types"

export const exportCheckBoxFieldToStructure = (
  context: ConfigurationContext,
  element: CheckBoxField
): IFormatElementResult => {
  const result = formatCheckBoxFieldContent(context, element, false)

  return {
    strings: [result],
    haveSimpleHorizontalGroup: false,
  }
}

export const exportCheckBoxFieldContentToStructure = (
  context: ConfigurationContext,
  element: CheckBoxField
): IFormatElementResult => {
  const result = formatCheckBoxFieldContent(context, element, true)

  return {
    strings: [result],
    haveSimpleHorizontalGroup: false,
  }
}

const formatCheckBoxFieldContent = (
  context: ConfigurationContext,
  element: CheckBoxField,
  forContent: boolean
): string => {
  const result = []
  const titleParts = getCheckBoxTitle(context, element, forContent)
  result.push(...titleParts)

  const name = formatElementName(element)
  result.push(name)

  return result.join(" ")
}

const getCheckBoxTitle = (context: ConfigurationContext, element: CheckBoxField, forContent: boolean): string[] => {
  const title = formatDefaultLanguageText(context, element.title)

  const isRightTitled = element.headerHorizontalAlign === "Right" || forContent
  const isSwitch = element.checkBoxType === "Switch" && !forContent

  const parts = []

  const symbol = isSwitch ? "[ |1]" : "[ ]"

  if (isRightTitled) {
    parts.push(symbol)
    if (title) parts.push(title)
  } else {
    parts.push(title ?? '""')
    parts.push(symbol)
  }

  return parts
}

registerMetadata(
  "ExportToStructureContent",
  "CheckBoxField",
  exportCheckBoxFieldContentToStructure as ExportToStructureContentFn
)
registerMetadata("ExportToStructure", "CheckBoxField", exportCheckBoxFieldToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<CheckBoxField>(FormElementType.CheckBoxField, () => true)
