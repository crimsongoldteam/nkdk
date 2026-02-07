import { ConfigurationContext } from "~/metadata/context/types"
import { formatDefaultLanguageText, formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureContentFn, ExportToStructureFn, FormElementType } from "~/metadata/metadataFactory/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { PropertyRule } from "../calendarField/rules"
import { CheckBoxField } from "./types"

export const exportCheckBoxFieldToStructure = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  element: CheckBoxField
): IFormatElementResult => {
  const result = formatCheckBoxFieldContent(context, rule, element, false)

  return {
    strings: [result],
    haveSimpleHorizontalGroup: false,
  }
}

export const exportCheckBoxFieldContentToStructure = (
  context: ConfigurationContext,
  rule: PropertyRule<any>,
  element: CheckBoxField
): IFormatElementResult => {
  const result = formatCheckBoxFieldContent(context, rule, element, true)

  return {
    strings: [result],
    haveSimpleHorizontalGroup: false,
  }
}

const formatCheckBoxFieldContent = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
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

registerMetadata(
  "ExportToStructureContent",
  "CheckBoxField",
  exportCheckBoxFieldContentToStructure as ExportToStructureContentFn
)
registerMetadata("ExportToStructure", "CheckBoxField", exportCheckBoxFieldToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<CheckBoxField>(FormElementType.CheckBoxField, () => true)
