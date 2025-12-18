import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { LabelDecoration } from "./types"
import { formatLabelDecoration } from "./format"

registerFormat<LabelDecoration>(
  formatLabelDecoration,
  (element: LabelDecoration) => element.elementType === FormElementType.LabelDecoration
)
registerIsOneLineElementCheck<LabelDecoration>(FormElementType.LabelDecoration, () => true)
