import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { TButton } from "./types"
import { importButtonFromXML } from "./importFromXML"
import { formatButton } from "./format"

registerFormat<TButton>(formatButton, (element: TButton) => element.elementType === ZElementType.enum.Button)
registerIsOneLineElementCheck<TButton>(ZElementType.enum.Button, () => true)
registerImport<TButton>(ZElementType.enum.Button, importButtonFromXML)
