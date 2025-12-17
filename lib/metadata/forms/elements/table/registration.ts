import { registerFormat } from "~/lib/format/formatFactory"
import { FormElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importTableFromXML } from "./importFromXML"
import { formatTable } from "./format"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { Table } from "./types"

registerIsOneLineElementCheck(FormElementType.Table, () => false)
registerFormat<Table>(
  formatTable,
  (element) => element.elementType === FormElementType.Table
)
registerImport(FormElementType.Table, importTableFromXML)

