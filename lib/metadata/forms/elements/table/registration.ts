import { registerFormat } from "~/lib/format/formatFactory"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importTableFromXML } from "./importFromXML"
import { formatTable } from "./format"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { TTable } from "./types"

registerIsOneLineElementCheck(ZElementType.enum.Table, () => false)
registerFormat<TTable>(
  formatTable,
  (element) => element.elementType === ZElementType.enum.Table
)
registerImport(ZElementType.enum.Table, importTableFromXML)

