import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { TLabelDecoration } from "./types"
import { importLabelDecorationFromXML } from "./importFromXML"
import { formatLabelDecoration } from "./format"

registerFormat<TLabelDecoration>(
  formatLabelDecoration,
  (element: TLabelDecoration) => element.elementType === ZElementType.enum.LabelDecoration
)
registerIsOneLineElementCheck<TLabelDecoration>(ZElementType.enum.LabelDecoration, () => true)
registerImport<TLabelDecoration | undefined>(ZElementType.enum.LabelDecoration, importLabelDecorationFromXML)
