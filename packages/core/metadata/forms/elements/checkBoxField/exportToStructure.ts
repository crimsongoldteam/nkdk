import { ConfigurationContext } from "~/metadata/context/types"
import { formatDefaultLanguageText, formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ExportToStructureContentFn, ExportToStructureFn } from "~/metadata/metadataFactory/elements/types"
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
  const isRightTitled = element.headerHorizontalAlign === "Right" || forContent

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

registerElementOperation(
  "ExportToStructureContent",
  "CheckBoxField",
  exportCheckBoxFieldContentToStructure as ExportToStructureContentFn
)
registerElementOperation("ExportToStructure", "CheckBoxField", exportCheckBoxFieldToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<CheckBoxField>(CollectionFormElementType.CheckBoxField, () => true)
