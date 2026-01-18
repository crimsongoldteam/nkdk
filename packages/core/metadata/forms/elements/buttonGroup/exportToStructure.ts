import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureContentFn, ExportToStructureFn } from "~/metadata/metadataFactory/types"
import { formatElementTitleAndName, wrapButtonContent } from "../../format/helpers"
import { ButtonGroup } from "./types"

export function exportButtonGroupToStructure(
  context: ConfigurationContext,
  element: ButtonGroup
): IFormatElementResult {
  const resultString = wrapButtonContent(formatContent(context, element))
  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

export function exportButtonGroupContentToStructure(
  context: ConfigurationContext,
  element: ButtonGroup
): IFormatElementResult {
  const resultString = "#" + formatContent(context, element)
  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

const formatContent = (context: ConfigurationContext, element: ButtonGroup): string => {
  return formatElementTitleAndName(context, element)
}

registerMetadata(
  "ExportToStructureContent",
  "ButtonGroup",
  exportButtonGroupContentToStructure as ExportToStructureContentFn
)
registerMetadata("ExportToStructure", "ButtonGroup", exportButtonGroupToStructure as ExportToStructureFn)
