import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ExportToXMLFunction } from "../../orchestration/property/fn"
import { XDTOPackages, XDTOPackagesXML } from "./types"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const getXDTOPackageXMLType = (value: string): "xr:MDObjectRef" | "xs:string" =>
  value.startsWith("XDTOPackage.") || UUID_PATTERN.test(value) ? "xr:MDObjectRef" : "xs:string"

export const exportXDTOPackagesToXML: ExportToXMLFunction = (
  context,
  _rule,
  value: XDTOPackages | undefined
): XDTOPackagesXML | undefined => {
  if (!value || value.length === 0) return undefined

  return {
    "xr:Item": value.map((item) => ({
      ...(context.exportToXML ? { "xr:Presentation": "" } : undefined),
      "xr:CheckState": 0,
      "xr:Value": {
        "_xsi:type": getXDTOPackageXMLType(item),
        "#text": item,
      },
    })),
  }
}

registerTypeRule("XDTOPackages", "exportToXML", exportXDTOPackagesToXML)
