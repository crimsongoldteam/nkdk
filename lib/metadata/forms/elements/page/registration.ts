import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatPage } from "./format"

registerIsOneLineElementCheck(FormElementType.Page, () => false)
registerFormat(formatPage, (element) => element.elementType === FormElementType.Page)
