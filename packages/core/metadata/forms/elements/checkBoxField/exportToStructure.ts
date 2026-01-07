import { registerFormat } from "~/format/formatFactory"
import { formatElementName } from "~/format/helpers"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { IFormatElementResult } from "~/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { CheckBoxField } from "./types"

export const exportCheckBoxFieldToStructure = (
  _context: ConfigurationContext,
  element: CheckBoxField
): IFormatElementResult => {
  const hasTitle = element.title?.items.ru !== undefined
  const isRightTitled = element.headerHorizontalAlign === "Right"
  const isSwitch = element.checkBoxType === "Switch"

  let resultString: string

  if (hasTitle) {
    const title = element.title!.items.ru
    if (isRightTitled) {
      if (isSwitch) {
        resultString = "[|1]" + title
      } else {
        resultString = "[]" + title
      }
    } else {
      if (isSwitch) {
        resultString = title + "[|1]"
      } else {
        resultString = title + "[]"
      }
    }
  } else {
    resultString = formatElementName(element)
  }

  const result: IFormatElementResult = {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }

  return result
}

registerFormat<CheckBoxField>(
  exportCheckBoxFieldToStructure,
  (element: CheckBoxField) => element.elementType === FormElementType.CheckBoxField
)
registerIsOneLineElementCheck<CheckBoxField>(FormElementType.CheckBoxField, () => true)
