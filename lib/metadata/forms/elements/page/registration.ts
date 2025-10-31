import { registerFormat } from "~/lib/format/formatFactory"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importPageFromXML } from "./importFromXML"
import { formatPage } from "./format"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"

registerIsOneLineElementCheck(ZElementType.enum.Page, () => false)
registerFormat(formatPage, (element) => element.type === ZElementType.enum.Page)
registerImport(ZElementType.enum.Page, importPageFromXML)
