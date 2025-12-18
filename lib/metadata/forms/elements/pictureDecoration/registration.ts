import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatPictureDecoration } from "./format"
import { PictureDecoration } from "./types"

registerFormat<PictureDecoration>(
  formatPictureDecoration,
  (element: PictureDecoration) => element.elementType === FormElementType.PictureDecoration
)
registerIsOneLineElementCheck<PictureDecoration>(FormElementType.PictureDecoration, () => true)
