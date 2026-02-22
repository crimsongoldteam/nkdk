import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/forms/format/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerElementOperation } from "~/metadata/metadataFactory/elements/elementOperationFactory"
import { ExportToStructureFn } from "~/metadata/metadataFactory/elements/types"
import { registerIsOneLineElementCheck } from "../../format/isOneLineElementCheckFactory"
import { PropertyRule } from "../calendarField/rules"
import { LabelDecoration } from "./types"

export const exportLabelDecorationToStructure = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  element: LabelDecoration
): ToNKDKResult => {
  const titleText = formatElementTitleAndName(context, element)

  const result: ToNKDKResult = {
    strings: [titleText],
    haveSimpleHorizontalGroup: false,
  }

  return result
}

registerElementOperation(
  "ExportToStructure",
  "LabelDecoration",
  exportLabelDecorationToStructure as ExportToStructureFn
)
registerIsOneLineElementCheck<LabelDecoration>(CollectionFormElementType.LabelDecoration, () => true)
