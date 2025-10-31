import { registerFormat } from "~/lib/format/formatFactory"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importUsualGroupFromXML } from "./importFromXML"
import { formatUsualGroup } from "./format"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"

registerIsOneLineElementCheck(ZElementType.enum.UsualGroup, () => false)
registerFormat(formatUsualGroup, (element) => element.type === ZElementType.enum.UsualGroup)
registerImport(ZElementType.enum.UsualGroup, importUsualGroupFromXML)
