import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ImportFromXMLFunction } from "@nkdk/runtime/rule-kit"
import { XDTOPackages, XDTOPackagesXML } from "./types"

export const importXDTOPackagesFromXML: ImportFromXMLFunction = (_context, _rule, xml: XDTOPackagesXML | undefined) => {
  if (!xml?.["xr:Item"]) return undefined

  const items = Array.isArray(xml["xr:Item"]) ? xml["xr:Item"] : [xml["xr:Item"]]
  const result = items.map((item) => item["xr:Value"]?.["#text"] ?? "")

  return result.length > 0 ? (result as XDTOPackages) : undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("XDTOPackages", "importFromXML", importXDTOPackagesFromXML)
