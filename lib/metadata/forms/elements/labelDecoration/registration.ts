import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { TLabelDecoration } from "./types"
import importLabelDecorationFromXML from "./importFromXML"
import { formatLabelDecoration } from "./format"

registerFormat<TLabelDecoration>(
  formatLabelDecoration,
  (element: TLabelDecoration) => element.type === ElementType.LabelDecoration
)
registerIsOneLineElementCheck<TLabelDecoration>(ElementType.LabelDecoration, () => true)
registerImport<TLabelDecoration>(ElementType.LabelDecoration, importLabelDecorationFromXML)
