import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { CommonAttributeContent, CommonAttributeContentXML } from "./types"

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export const importCommonAttributeContentFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: CommonAttributeContentXML | undefined
): CommonAttributeContent | undefined => {
  if (!xml) return undefined

  const items = toArray(xml["xr:Item"])
  if (items.length === 0) return undefined

  return items.map((item) => ({
    metadata: item["xr:Metadata"],
    use: item["xr:Use"],
    conditionalSeparation: item["xr:ConditionalSeparation"] ?? "",
  }))
}

registerTypeRule("CommonAttributeContent", "importFromXML", importCommonAttributeContentFromXML)
