import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { formatInputField } from "./format"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { registerFormat } from "~/lib/format/formatFactory"
import { isMultiline } from "./helpers"

registerFormat(formatInputField, (element) => element.type === ElementType.InputField)
registerIsOneLineElementCheck(ElementType.InputField, (element) => !isMultiline(element))
