import { registerFormat } from "~/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatLabelDecoration } from "./format"
import { LabelDecoration } from "./types"

registerFormat<LabelDecoration>(
  formatLabelDecoration,
  (element: LabelDecoration) => element.elementType === FormElementType.LabelDecoration
)
registerIsOneLineElementCheck<LabelDecoration>(FormElementType.LabelDecoration, () => true)
