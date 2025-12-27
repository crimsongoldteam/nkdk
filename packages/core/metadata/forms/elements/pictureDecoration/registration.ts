import { registerFormat } from "~/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatPictureDecoration } from "./format"
import { PictureDecoration } from "./types"

registerFormat<PictureDecoration>(
  formatPictureDecoration,
  (element: PictureDecoration) => element.elementType === FormElementType.PictureDecoration
)
registerIsOneLineElementCheck<PictureDecoration>(FormElementType.PictureDecoration, () => true)
