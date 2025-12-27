import { registerFormat } from "~/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatInputField } from "./format"
import { isMultiline } from "./helpers"
import { InputField } from "./types"

registerFormat<InputField>(
  formatInputField,
  (element: InputField) => element.elementType === FormElementType.InputField
)
registerIsOneLineElementCheck<InputField>(FormElementType.InputField, (element: InputField) => !isMultiline(element))
