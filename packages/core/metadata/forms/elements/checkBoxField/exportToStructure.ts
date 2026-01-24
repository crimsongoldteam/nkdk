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
  const title = formatDefaultLanguageText(context, element.title)
  const isSwitch = element.checkBoxType === "Switch" && !forContent
  const symbol = isSwitch ? "[ |1]" : "[ ]"
  const name = formatElementName(element)

  if (title) {
    const isRightTitled = element.headerHorizontalAlign === "Right" || forContent
    if (isRightTitled) {
      return `${symbol} ${title} ${name}`
    } else {
      return `${title} ${symbol} ${name}`
    }
  }

  if (isSwitch) {
    return `${symbol} ${name}`
  }

  return `${name} ${symbol}`
}

registerMetadata(
  "ExportToStructureContent",
  "CheckBoxField",
  exportCheckBoxFieldContentToStructure as ExportToStructureContentFn
)
registerMetadata("ExportToStructure", "CheckBoxField", exportCheckBoxFieldToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<CheckBoxField>(FormElementType.CheckBoxField, () => true)
