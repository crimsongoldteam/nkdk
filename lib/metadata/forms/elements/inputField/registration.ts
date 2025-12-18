import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatInputField } from "./format"
import { isMultiline } from "./helpers"
import { InputField } from "./types"

registerFormat<InputField>(
  formatInputField,
  (element: InputField) => element.elementType === FormElementType.InputField
)
registerIsOneLineElementCheck<InputField>(FormElementType.InputField, (element: InputField) => !isMultiline(element))
