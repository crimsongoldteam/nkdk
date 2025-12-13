import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { FormElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { TButton } from "./types"
import { importButtonFromXML } from "./importFromXML"
import { formatButton } from "./format"

registerFormat<TButton>(formatButton, (element: TButton) => element.elementType === FormElementType.Button)
registerIsOneLineElementCheck<TButton>(FormElementType.Button, () => true)
registerImport<TButton | undefined>(FormElementType.Button, importButtonFromXML)
