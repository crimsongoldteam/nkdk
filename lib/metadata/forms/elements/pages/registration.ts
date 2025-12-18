import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatPages } from "./format"

registerIsOneLineElementCheck(FormElementType.Pages, () => false)
registerFormat(formatPages, (element) => element.elementType === FormElementType.Pages)
