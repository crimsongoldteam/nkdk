import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { CommonAttributeContent, CommonAttributeContentXML } from "./types"

export const exportCommonAttributeContentToXML = (
  _context: unknown,
  _rule: unknown,
  value: CommonAttributeContent | undefined
): CommonAttributeContentXML | undefined => {
  if (!value) return undefined

  return {
    "xr:Item": value.map((item) => ({
      "xr:Metadata": item.metadata,
      "xr:Use": item.use,
      "xr:ConditionalSeparation": item.conditionalSeparation ?? "",
    })),
  }
}

registerTypeRule("CommonAttributeContent", "exportToXML", exportCommonAttributeContentToXML as never)
