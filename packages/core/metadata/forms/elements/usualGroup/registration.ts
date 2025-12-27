import { registerFormat } from "~/packages/core/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/packages/core/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatUsualGroup } from "./format"

registerIsOneLineElementCheck(FormElementType.UsualGroup, () => false)
registerFormat(formatUsualGroup, (element) => element.elementType === FormElementType.UsualGroup)
