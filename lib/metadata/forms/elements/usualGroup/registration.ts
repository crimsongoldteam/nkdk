import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatUsualGroup } from "./format"

registerIsOneLineElementCheck(FormElementType.UsualGroup, () => false)
registerFormat(formatUsualGroup, (element) => element.elementType === FormElementType.UsualGroup)
