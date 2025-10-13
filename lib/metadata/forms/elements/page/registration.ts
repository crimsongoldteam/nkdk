import { registerFormat } from "~/lib/format/formatFactory"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importPageFromXML } from "./importFromXML"
import { formatPage } from "./format"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"

registerIsOneLineElementCheck(ElementType.Page, () => false)
registerFormat(formatPage, (element) => element.type === ElementType.Page)
registerImport(ElementType.Page, importPageFromXML)
