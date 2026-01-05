import { registerFormat } from "~/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatPages } from "./format"

registerIsOneLineElementCheck(FormElementType.Pages, () => false)
registerFormat(formatPages, (element) => element.elementType === FormElementType.Pages)
