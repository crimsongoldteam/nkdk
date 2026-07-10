import { ConfigurationContext } from "../../context/types"
import { PropertyRule, registerTypeRule } from "../../orchestration"
import { CommonAttributeContent, CommonAttributeContentXML } from "./types"

export const exportCommonAttributeContentToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: CommonAttributeContent | undefined
): CommonAttributeContentXML | undefined => {
  if (!value || value.length === 0) return undefined

  return {
    "xr:Item": value.map((item) => ({
      "xr:Metadata": item.metadata,
      "xr:Use": item.use,
      "xr:ConditionalSeparation": item.conditionalSeparation ?? "",
    })),
  }
}

registerTypeRule("CommonAttributeContent", "exportToXML", exportCommonAttributeContentToXML)
