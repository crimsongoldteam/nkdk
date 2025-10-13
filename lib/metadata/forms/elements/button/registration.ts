import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { TButton } from "./types"
import importButtonFromXML from "./importFromXML"
import { formatButton } from "./format"

registerFormat<TButton>(formatButton, (element: TButton) => element.type === ElementType.Button)
registerIsOneLineElementCheck<TButton>(ElementType.Button, () => true)
registerImport<TButton>(ElementType.Button, importButtonFromXML)
