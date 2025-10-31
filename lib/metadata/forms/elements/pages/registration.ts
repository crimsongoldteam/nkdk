import { registerFormat } from "~/lib/format/formatFactory"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importPagesFromXML } from "./importFromXML"
import { formatPages } from "./format"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"

registerIsOneLineElementCheck(ZElementType.enum.Pages, () => false)
registerFormat(formatPages, (element) => element.type === ZElementType.enum.Pages)
registerImport(ZElementType.enum.Pages, importPagesFromXML)
