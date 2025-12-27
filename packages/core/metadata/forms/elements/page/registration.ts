import { registerFormat } from "~/packages/core/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/packages/core/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatPage } from "./format"

registerIsOneLineElementCheck(FormElementType.Page, () => false)
registerFormat(formatPage, (element) => element.elementType === FormElementType.Page)
