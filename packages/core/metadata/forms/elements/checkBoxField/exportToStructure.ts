import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureFn, FormElementType } from "~/metadata/metadataFactory/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
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
        resultString = "[|1] " + title + " " + formatElementName(element)
      } else {
        resultString = "[ ] " + title + " " + formatElementName(element)
      }
    } else {
      if (isSwitch) {
        resultString = title + " [ |1] " + formatElementName(element)
      } else {
        resultString = title + " [ ] " + formatElementName(element)
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

registerMetadata("ExportToStructure", "CheckBoxField", exportCheckBoxFieldToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<CheckBoxField>(FormElementType.CheckBoxField, () => true)
