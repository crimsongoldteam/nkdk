import { ConfigurationContext } from "~/metadata/context/types"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureContentFn } from "~/metadata/metadataFactory/types"
import { formatElementTitleAndName } from "../../format/helpers"
import { Popup } from "./types"

export function exportPopupContentToStructure(context: ConfigurationContext, element: Popup): IFormatElementResult {
  const resultString = "^" + formatContent(context, element)
  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

const formatContent = (context: ConfigurationContext, element: Popup): string => {
  return formatElementTitleAndName(context, element)
}

registerMetadata("ExportToStructureContent", "Popup", exportPopupContentToStructure as ExportToStructureContentFn)
