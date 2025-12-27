import { registerFormat } from "~/packages/core/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/packages/core/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatLabelDecoration } from "./format"
import { LabelDecoration } from "./types"

registerFormat<LabelDecoration>(
  formatLabelDecoration,
  (element: LabelDecoration) => element.elementType === FormElementType.LabelDecoration
)
registerIsOneLineElementCheck<LabelDecoration>(FormElementType.LabelDecoration, () => true)
