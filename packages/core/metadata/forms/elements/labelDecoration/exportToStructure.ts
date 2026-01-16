import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureFn, FormElementType } from "~/metadata/metadataFactory/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { LabelDecoration } from "./types"

export const exportLabelDecorationToStructure = (
  _context: ConfigurationContext,
  element: LabelDecoration
): IFormatElementResult => {
  const titleText = element.title?.items.ru
  const hasTitle = titleText !== undefined && titleText.trim() !== ""

  let resultString: string
  if (hasTitle) {
    resultString = titleText! + " " + formatElementName(element)
  } else {
    resultString = formatElementName(element)
  }

  const result: IFormatElementResult = {
    strings: [resultString],
    haveSimpleHorizontalGroup: false,
  }

  return result
}

registerMetadata("ExportToStructure", "LabelDecoration", exportLabelDecorationToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<LabelDecoration>(FormElementType.LabelDecoration, () => true)
