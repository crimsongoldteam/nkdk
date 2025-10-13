import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { TPictureDecoration } from "./types"
import importPictureDecorationFromXML from "./importFromXML"
import { formatPictureDecoration } from "./format"

registerFormat<TPictureDecoration>(
  formatPictureDecoration,
  (element: TPictureDecoration) => element.type === ElementType.PictureDecoration
)
registerIsOneLineElementCheck<TPictureDecoration>(ElementType.PictureDecoration, () => true)
registerImport<TPictureDecoration>(ElementType.PictureDecoration, importPictureDecorationFromXML)
