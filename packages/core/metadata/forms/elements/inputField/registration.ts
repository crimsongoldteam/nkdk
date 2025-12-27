import { registerFormat } from "~/packages/core/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/packages/core/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatInputField } from "./format"
import { isMultiline } from "./helpers"
import { InputField } from "./types"

registerFormat<InputField>(
  formatInputField,
  (element: InputField) => element.elementType === FormElementType.InputField
)
registerIsOneLineElementCheck<InputField>(FormElementType.InputField, (element: InputField) => !isMultiline(element))
