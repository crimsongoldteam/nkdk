import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/forms/format/types"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ExportToStructureContentFn } from "~/metadata/metadataFactory/elements/types"
import { formatElementTitleAndName } from "../../format/helpers"
import { ButtonGroup } from "./types"

export function exportButtonGroupContentToStructure(context: ConfigurationContext, element: ButtonGroup): ToNKDKResult {
  const resultString = "#" + formatContent(context, element)
  return {
    strings: [resultString],
    toOneLineGroup: false,
  }
}

const formatContent = (context: ConfigurationContext, element: ButtonGroup): string => {
  return formatElementTitleAndName(context, element)
}

registerElementOperation(
  "ExportToStructureContent",
  "ButtonGroup",
  exportButtonGroupContentToStructure as ExportToStructureContentFn
)
