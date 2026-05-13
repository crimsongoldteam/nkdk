import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { CommonAttributeContent, CommonAttributeContentXML } from "./types"

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export const importCommonAttributeContentFromXML = (
  _context: unknown,
  _rule: unknown,
  xml: CommonAttributeContentXML | undefined
): CommonAttributeContent | undefined => {
  if (!xml) return undefined

  return toArray(xml["xr:Item"]).map((item) => ({
    metadata: item["xr:Metadata"],
    use: item["xr:Use"],
    conditionalSeparation: item["xr:ConditionalSeparation"] ?? "",
  }))
}

registerTypeRule("CommonAttributeContent", "importFromXML", importCommonAttributeContentFromXML as never)
