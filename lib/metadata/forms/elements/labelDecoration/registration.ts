import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { FormElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { LabelDecoration } from "./types"
import { importLabelDecorationFromXML } from "./importFromXML"
import { formatLabelDecoration } from "./format"

registerFormat<LabelDecoration>(
  formatLabelDecoration,
  (element: LabelDecoration) => element.elementType === FormElementType.LabelDecoration
)
registerIsOneLineElementCheck<LabelDecoration>(FormElementType.LabelDecoration, () => true)
registerImport<LabelDecoration | undefined>(FormElementType.LabelDecoration, importLabelDecorationFromXML)
