import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { formatInputField } from "./format"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { registerFormat } from "~/lib/format/formatFactory"
import { isMultiline } from "./helpers"
import importInputFieldFromXML from "./importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { TInputField } from "./types"

registerFormat<TInputField>(formatInputField, (element: TInputField) => element.type === ElementType.InputField)
registerIsOneLineElementCheck<TInputField>(ElementType.InputField, (element: TInputField) => !isMultiline(element))
registerImport<TInputField>(ElementType.InputField, importInputFieldFromXML)
