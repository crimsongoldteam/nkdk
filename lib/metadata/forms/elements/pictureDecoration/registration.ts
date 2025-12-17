import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"
import { formatPictureDecoration } from "./format"
import { importPictureDecorationFromXML } from "./importFromXML"
import { PictureDecoration } from "./types"

registerFormat<PictureDecoration>(
  formatPictureDecoration,
  (element: PictureDecoration) => element.elementType === FormElementType.PictureDecoration
)
registerIsOneLineElementCheck<PictureDecoration>(FormElementType.PictureDecoration, () => true)
registerImport<PictureDecoration | undefined>(FormElementType.PictureDecoration, importPictureDecorationFromXML)
