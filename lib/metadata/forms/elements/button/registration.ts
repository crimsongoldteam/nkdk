import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { FormElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { Button } from "./types"
import { importButtonFromXML } from "./importFromXML"
import { formatButton } from "./format"

registerFormat<Button>(formatButton, (element: Button) => element.elementType === FormElementType.Button)
registerIsOneLineElementCheck<Button>(FormElementType.Button, () => true)
registerImport<Button | undefined>(FormElementType.Button, importButtonFromXML)
