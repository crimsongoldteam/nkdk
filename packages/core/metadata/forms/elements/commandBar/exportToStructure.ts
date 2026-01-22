import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { getOperationFunction, registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureFn } from "~/metadata/metadataFactory/types"
import { CommandBarChildItem } from "../../collections/childItems/types"
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

const processCommandBarChildItems = (
  context: ConfigurationContext,
  childItems: CommandBarChildItem[]
): string[] => {
  return childItems.flatMap((item) => {
    const exportFunction = getOperationFunction("ExportToStructureContent", item.elementType)

    if (!exportFunction)
      throw new Error(`ExportToStructureContent function not found for element type: ${item.elementType}`)
    const result = exportFunction(context, item)
    return result.strings
  })
}

export const exportCommandBarContentToStructure = (
  context: ConfigurationContext,
  element: { childItems: CommandBarChildItem[] }
): string => {
  if (!element.childItems || element.childItems.length === 0) {
    return wrapButtonContent("")
  }

  const buttonStrings = processCommandBarChildItems(context, element.childItems)

  const result = buttonStrings.length > 1 ? buttonStrings.join(" | ") : buttonStrings[0] + " |"

  return wrapButtonContent(result)
}

registerMetadata("ExportToStructure", "CommandBar", exportCommandBarToStructure as ExportToStructureFn)
// registerIsOneLineElementCheck<CommandBar>(FormElementType.CommandBar, () => true)
