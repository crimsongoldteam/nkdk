import { registerFormat } from "~/lib/format/formatFactory"
import { FormElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importPagesFromXML } from "./importFromXML"
import { formatPages } from "./format"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"

registerIsOneLineElementCheck(FormElementType.Pages, () => false)
registerFormat(formatPages, (element) => element.elementType === FormElementType.Pages)
registerImport(FormElementType.Pages, importPagesFromXML)
