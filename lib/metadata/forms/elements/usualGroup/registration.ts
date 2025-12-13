import { registerFormat } from "~/lib/format/formatFactory"
import { FormElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importUsualGroupFromXML } from "./importFromXML"
import { formatUsualGroup } from "./format"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"

registerIsOneLineElementCheck(FormElementType.UsualGroup, () => false)
registerFormat(formatUsualGroup, (element) => element.elementType === FormElementType.UsualGroup)
registerImport(FormElementType.UsualGroup, importUsualGroupFromXML)
