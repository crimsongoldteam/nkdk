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

  const items = xml["xr:GeneratedType"]
  if (!items) return undefined

  const result: InternalInfo = {}
  for (const item of items) {
    const name = item._name.split(".")[0]
    result[name] = {
      typeId: item["xr:TypeId"],
      valueId: item["xr:ValueId"],
    }
  }

  return result
}

registerTypeRule("InternalInfo", "importFromXML", importInternalInfoFromXML)
