import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { InternalInfo, InternalInfoRootXML } from "./types"

export const importInternalInfoFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: InternalInfoRootXML | undefined
): InternalInfo | undefined => {
  if (!xml) return undefined

  //   if (rule?.forReferenceOnly) return undefined

  const items = xml["xr:GeneratedType"]
  if (!items) return undefined

  const result: InternalInfo = {}
  for (const item of items) {
    result[item._name] = {
      typeId: item["xr:TypeId"],
      valueId: item["xr:ValueId"],
    }
  }

  return result
}

registerTypeRule("InternalInfo", "importFromXML", importInternalInfoFromXML)
