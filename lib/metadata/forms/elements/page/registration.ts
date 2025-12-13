import { registerFormat } from "~/lib/format/formatFactory"
import { FormElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importPageFromXML } from "./importFromXML"
import { formatPage } from "./format"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"

registerIsOneLineElementCheck(FormElementType.Page, () => false)
registerFormat(formatPage, (element) => element.elementType === FormElementType.Page)
registerImport(FormElementType.Page, importPageFromXML)
