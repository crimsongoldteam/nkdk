import { registerFormat } from "~/lib/format/formatFactory"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importPagesFromXML } from "./importFromXML"
import { formatPages } from "./format"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"

registerIsOneLineElementCheck(ElementType.Pages, () => false)
registerFormat(formatPages, (element) => element.type === ElementType.Pages)
registerImport(ElementType.Pages, importPagesFromXML)
