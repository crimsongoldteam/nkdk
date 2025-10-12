import { registerFormat } from "~/lib/format/formatFactory"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import importUsualGroupFromXML from "./importFromXML"
import { formatUsualGroup } from "./format"

registerFormat(formatUsualGroup, (element) => element.type === ElementType.UsualGroup)
registerImport(ElementType.UsualGroup, importUsualGroupFromXML)
