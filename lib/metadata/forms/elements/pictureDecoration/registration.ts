import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { TPictureDecoration } from "./types"
import { importPictureDecorationFromXML } from "./importFromXML"
import { formatPictureDecoration } from "./format"

registerFormat<TPictureDecoration>(
  formatPictureDecoration,
  (element: TPictureDecoration) => element.elementType === ZElementType.enum.PictureDecoration
)
registerIsOneLineElementCheck<TPictureDecoration>(ZElementType.enum.PictureDecoration, () => true)
registerImport<TPictureDecoration>(ZElementType.enum.PictureDecoration, importPictureDecorationFromXML)
