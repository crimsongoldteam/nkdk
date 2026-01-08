import { registerFormat } from "~/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { IFormatElementResult } from "~/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { getOperationFunction } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { BaseElement } from "../baseElement/types"
import { exportOtherElementToStructure } from "../baseElement/exportToStructure"
import { CommandBar } from "./types"

export const exportCommandBarToStructure = (
  context: ConfigurationContext,
  element: CommandBar
): IFormatElementResult => {
  if (!element.childItems || element.childItems.length === 0) {
    return {
      strings: ["<>"],
      haveSimpleHorizontalGroup: false,
    }
  }

  const buttonStrings = element.childItems
    .filter((item) => item.elementType === FormElementType.Button)
    .map((button) => {
      const exportFunction = getOperationFunction("ExportToStructure", button.elementType)
      let formatted: IFormatElementResult
      if (!exportFunction) {
        formatted = exportOtherElementToStructure(context, button as BaseElement)
      } else {
        formatted = exportFunction(context, button) as IFormatElementResult
      }
      return formatted.strings[0]?.replace(/^<|>$/g, "") || button.name
    })
    .filter((str) => str.length > 0)

  const resultString = "<" + buttonStrings.join("|") + ">"

  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

registerFormat<CommandBar>(
  exportCommandBarToStructure,
  (element: CommandBar) => element.elementType === FormElementType.CommandBar
)
registerIsOneLineElementCheck<CommandBar>(FormElementType.CommandBar, () => true)

