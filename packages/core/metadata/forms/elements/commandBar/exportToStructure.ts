import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { getOperationFunction, registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ButtonGroupChildItem } from "../../collections/buttonGroupChildItems/types"
import { formatElementName, wrapButtonContent } from "../../format/helpers"
import { CommandBar } from "./types"

export const exportCommandBarToStructure = (
  context: ConfigurationContext,
  element: CommandBar
): IFormatElementResult => {
  const content = exportCommandBarContentToStructure(context, element)
  const resultString = `${content} ${formatElementName(element)}`

  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

export const exportCommandBarContentToStructure = (
  context: ConfigurationContext,
  element: { childItems: ButtonGroupChildItem[] }
): string => {
  if (!element.childItems || element.childItems.length === 0) {
    return wrapButtonContent("")
  }

  const buttonStrings = element.childItems.flatMap((item) => {
    const exportFunction = getOperationFunction("ExportToStructureContent", item.elementType)

    if (!exportFunction) throw new Error(`Export function not found for element type: ${item.elementType}`)
    const result = exportFunction(context, item)
    return result.strings
  })

  return wrapButtonContent(buttonStrings.join("|"))
}

registerMetadata("ExportToStructure", "CommandBar", exportCommandBarToStructure)
// registerIsOneLineElementCheck<CommandBar>(FormElementType.CommandBar, () => true)
