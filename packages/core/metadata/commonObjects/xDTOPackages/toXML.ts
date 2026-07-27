import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ExportToXMLFunction } from "../../orchestration/property/fn"
import { XDTOPackages, XDTOPackagesXML } from "./types"

const getXDTOPackageXMLType = (value: string): "xr:MDObjectRef" | "xs:string" =>
  value.startsWith("XDTOPackage.") ? "xr:MDObjectRef" : "xs:string"

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
