import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { InternalInfo, InternalInfoRootXML } from "./types"

export const importInternalInfoFromXML = (
  _context: ConfigurationContextFromXML,
  rule: PropertyRule | undefined,
  xml: InternalInfoRootXML | undefined
): InternalInfo | undefined => {
  if (!xml) return undefined

  if (rule?.forReferenceOnly !== true) return undefined

  const rawItems = xml["xr:GeneratedType"]
  const thisNode = xml["xr:ThisNode"]
  if (!rawItems && !thisNode) return undefined

  const items = rawItems === undefined ? [] : Array.isArray(rawItems) ? rawItems : [rawItems]

  const result: InternalInfo = {}
  for (const item of items) {
    const name = item._name.split(".")[0]
    result[name] = {
      typeId: item["xr:TypeId"],
      valueId: item["xr:ValueId"],
    }
  }
  if (thisNode !== undefined) {
    result.thisNode = thisNode
  }

  return result
}

registerTypeRule("InternalInfo", "importFromXML", importInternalInfoFromXML)
