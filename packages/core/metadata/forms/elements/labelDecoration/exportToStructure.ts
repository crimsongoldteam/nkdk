import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { formatElementName } from "~/format/helpers"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { LabelDecoration } from "./types"

export const exportLabelDecorationToStructure = (
  _context: ConfigurationContext,
  element: LabelDecoration
): IFormatElementResult => {
  const hasTitle = element.title?.items.ru !== undefined

  let resultString: string
  if (hasTitle) {
    resultString = element.title!.items.ru + " " + formatElementName(element)
  } else {
    resultString = formatElementName(element)
  }

  const result: IFormatElementResult = {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }

  return result
}

registerMetadata("ExportToStructure", "LabelDecoration", exportLabelDecorationToStructure)
registerIsOneLineElementCheck<LabelDecoration>(FormElementType.LabelDecoration, () => true)
