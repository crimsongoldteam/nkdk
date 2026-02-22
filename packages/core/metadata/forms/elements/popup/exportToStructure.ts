import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/forms/format/types"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ExportToStructureContentFn } from "~/metadata/metadataFactory/elements/types"
import { formatElementTitleAndName } from "../../format/helpers"
import { Popup } from "./types"

export function exportPopupContentToStructure(context: ConfigurationContext, element: Popup): ToNKDKResult {
  const resultString = "^" + formatContent(context, element)
  return resultString
}

const formatContent = (context: ConfigurationContext, element: Popup): string => {
  return formatElementTitleAndName(context, element)
}

registerElementOperation(
  "ExportToStructureContent",
  "Popup",
  exportPopupContentToStructure as ExportToStructureContentFn
)
