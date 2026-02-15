import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureContentFn, ExportToStructureFn } from "~/metadata/metadataFactory/types"
import { formatElementTitleAndName, wrapButtonContent } from "../../format/helpers"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { Button } from "./types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

export function exportButtonToStructure(context: ConfigurationContext, element: Button): IFormatElementResult {
  const resultString = wrapButtonContent(formatContent(context, element))
  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

export function exportButtonContentToStructure(context: ConfigurationContext, element: Button): IFormatElementResult {
  const resultString = formatContent(context, element)
  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

const formatContent = (context: ConfigurationContext, element: Button): string => {
  return formatElementTitleAndName(context, element)
}

registerMetadata("ExportToStructureContent", "Button", exportButtonContentToStructure as ExportToStructureContentFn)
registerMetadata("ExportToStructure", "Button", exportButtonToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<Button>(CollectionFormElementType.Button, () => true)
