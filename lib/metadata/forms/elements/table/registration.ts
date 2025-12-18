import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatTable } from "./format"
import { Table } from "./types"

registerIsOneLineElementCheck(FormElementType.Table, () => false)
registerFormat<Table>(formatTable, (element) => element.elementType === FormElementType.Table)
