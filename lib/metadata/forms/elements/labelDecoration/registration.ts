import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { FormElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { TLabelDecoration } from "./types"
import { importLabelDecorationFromXML } from "./importFromXML"
import { formatLabelDecoration } from "./format"

registerFormat<TLabelDecoration>(
  formatLabelDecoration,
  (element: TLabelDecoration) => element.elementType === FormElementType.LabelDecoration
)
registerIsOneLineElementCheck<TLabelDecoration>(FormElementType.LabelDecoration, () => true)
registerImport<TLabelDecoration | undefined>(FormElementType.LabelDecoration, importLabelDecorationFromXML)
