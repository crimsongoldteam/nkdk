import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { getOperationFunction, registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { wrapButtonContent } from "../../format/helpers"
import { CommandBar } from "./types"

export const exportCommandBarToStructure = (
  context: ConfigurationContext,
  element: CommandBar
): IFormatElementResult => {
  if (!element.childItems || element.childItems.length === 0) {
    return {
      strings: [wrapButtonContent("")],
      haveSimpleHorizontalGroup: false,
    }
  }

  const buttonStrings = element.childItems.map((item) => {
    const exportFunction = getOperationFunction("ExportToStructureContent", item.elementType)

    if (!exportFunction) throw new Error(`Export function not found for element type: ${item.elementType}`)
    return exportFunction(context, item)
  })

  const resultString = wrapButtonContent(buttonStrings.join("|"))

  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

registerMetadata("ExportToStructure", "CommandBar", exportCommandBarToStructure)
registerIsOneLineElementCheck<CommandBar>(FormElementType.CommandBar, () => true)
