import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureFn, FormElementType } from "~/metadata/metadataFactory/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { LabelDecoration } from "./types"

export const exportLabelDecorationToStructure = (
  context: ConfigurationContext,
  element: LabelDecoration
): IFormatElementResult => {
  const titleText = formatElementTitleAndName(context, element)

  const result: IFormatElementResult = {
    strings: [titleText],
    haveSimpleHorizontalGroup: false,
  }

  return result
}

registerMetadata("ExportToStructure", "LabelDecoration", exportLabelDecorationToStructure as ExportToStructureFn)
registerIsOneLineElementCheck<LabelDecoration>(FormElementType.LabelDecoration, () => true)
