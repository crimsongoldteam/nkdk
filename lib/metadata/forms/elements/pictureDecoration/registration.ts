import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { FormElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { TPictureDecoration } from "./types"
import { importPictureDecorationFromXML } from "./importFromXML"
import { formatPictureDecoration } from "./format"

registerFormat<TPictureDecoration>(
  formatPictureDecoration,
  (element: TPictureDecoration) => element.elementType === FormElementType.PictureDecoration
)
registerIsOneLineElementCheck<TPictureDecoration>(FormElementType.PictureDecoration, () => true)
registerImport<TPictureDecoration | undefined>(FormElementType.PictureDecoration, importPictureDecorationFromXML)
