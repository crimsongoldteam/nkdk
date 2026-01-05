import { registerFormat } from "~/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatTable } from "./format"
import { Table } from "./types"

registerIsOneLineElementCheck(FormElementType.Table, () => false)
registerFormat<Table>(formatTable, (element) => element.elementType === FormElementType.Table)
