import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { IFormatElementResult } from "~/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { formatElementTitleAndName, wrapButtonContent } from "../../format/helpers"
import { Button } from "./types"

export const exportButtonToStructure = (context: ConfigurationContext, element: Button): IFormatElementResult => {
  const resultString = wrapButtonContent(formatContent(context, element))
  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

export const exportButtonContentToStructure = (
  context: ConfigurationContext,
  element: Button
): IFormatElementResult => {
  const resultString = formatContent(context, element)
  return {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }
}

const formatContent = (context: ConfigurationContext, element: Button): string => {
  return formatElementTitleAndName(context, element)
}

registerMetadata("ExportToStructureContent", "Button", exportButtonContentToStructure)
registerMetadata("ExportToStructure", "Button", exportButtonToStructure)
registerIsOneLineElementCheck<Button>(FormElementType.Button, () => true)
