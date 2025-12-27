import { registerFormat } from "~/packages/core/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/packages/core/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatTable } from "./format"
import { Table } from "./types"

registerIsOneLineElementCheck(FormElementType.Table, () => false)
registerFormat<Table>(formatTable, (element) => element.elementType === FormElementType.Table)
