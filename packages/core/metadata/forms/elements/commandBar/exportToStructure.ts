import { ConfigurationContext } from "~/metadata/context/types"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { ExportToStructureFn } from "~/metadata/metadataFactory/elements/types"
import { exportCommandBarItemsToStructure, formatCommandBarContent } from "../../format/commandBarHelpers"
import { formatElementName } from "../../format/helpers"
import { CommandBar } from "./types"

export const exportCommandBarToStructure = (context: ConfigurationContext, element: CommandBar): ToNKDKResult => {
  const content = exportCommandBarContentToStructure(context, element)
  const resultString = `${content} ${formatElementName(element)}`

  return {
    strings: [resultString],
    toOneLineGroup: true,
  }
}

export const exportCommandBarContentToStructure = (
  context: ConfigurationContext,
  element: Pick<CommandBar, "childItems" | "autofill">
): string => {
  const buttonStrings = exportCommandBarItemsToStructure(context, element.childItems || [])
  const autofill = !!element.autofill

  return formatCommandBarContent(buttonStrings, autofill)
}

registerElementOperation("ExportToStructure", "CommandBar", exportCommandBarToStructure as ExportToStructureFn)
