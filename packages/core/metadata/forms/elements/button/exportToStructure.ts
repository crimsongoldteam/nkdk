import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { ExportToStructureContentFn, ExportToStructureFn } from "~/metadata/metadataFactory/elements/types"
import { formatElementTitleAndName, wrapButtonContent } from "../../format/helpers"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { Button } from "./types"

export function exportButtonToStructure(context: ConfigurationContext, element: Button): ToNKDKResult {
  const resultString = wrapButtonContent(formatContent(context, element))
  return {
    strings: [resultString],
    toOneLineGroup: false,
  }
}

export function exportButtonContentToStructure(context: ConfigurationContext, element: Button): ToNKDKResult {
  const resultString = formatContent(context, element)
  return {
    strings: [resultString],
    toOneLineGroup: false,
  }
}

const formatContent = (context: ConfigurationContext, element: Button): string => {
  return formatElementTitleAndName(context, element)
}

registerElementOperation(
  "ExportToStructureContent",
  "Button",
  exportButtonContentToStructure as ExportToStructureContentFn
)
registerElementOperation("ExportToStructure", "Button", exportButtonToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<Button>(CollectionFormElementType.Button, () => true)
