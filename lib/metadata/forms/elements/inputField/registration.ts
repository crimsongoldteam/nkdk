import { FormElementType } from "../types"
import { formatInputField } from "./format"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { registerFormat } from "~/lib/format/formatFactory"
import { isMultiline } from "./helpers"
import { importInputFieldFromXML } from "./importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { InputField } from "./types"

registerFormat<InputField>(
  formatInputField,
  (element: InputField) => element.elementType === FormElementType.InputField
)
registerIsOneLineElementCheck<InputField>(
  FormElementType.InputField,
  (element: InputField) => !isMultiline(element)
)
registerImport<InputField | undefined>(FormElementType.InputField, importInputFieldFromXML)
