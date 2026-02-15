import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureFn } from "~/metadata/metadataFactory/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { PropertyRule } from "../calendarField/rules"
import { LabelDecoration } from "./types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

export const exportLabelDecorationToStructure = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
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
registerIsOneLineElementCheck<LabelDecoration>(CollectionFormElementType.LabelDecoration, () => true)
