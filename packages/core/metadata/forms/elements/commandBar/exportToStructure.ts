import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureFn } from "~/metadata/metadataFactory/types"
import { exportCommandBarItemsToStructure, formatCommandBarContent } from "../../format/commandBarHelpers"
import { formatElementName } from "../../format/helpers"
import { PropertyRule } from "../calendarField/rules"
import { CommandBar } from "./types"

export const exportCommandBarToStructure = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  element: CommandBar
): IFormatElementResult => {
  const content = exportCommandBarContentToStructure(context, rule, element)
  const resultString = `${content} ${formatElementName(element)}`

  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

export const exportCommandBarContentToStructure = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  element: Pick<CommandBar, "childItems" | "autofill">
): string => {
  const buttonStrings = exportCommandBarItemsToStructure(context, rule, element.childItems || [])
  const autofill = !!element.autofill

  return formatCommandBarContent(buttonStrings, autofill)
}

registerMetadata("ExportToStructure", "CommandBar", exportCommandBarToStructure as ExportToStructureFn)
