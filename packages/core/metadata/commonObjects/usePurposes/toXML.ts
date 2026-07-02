import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"
import type { UsePurposes, UsePurposesXML } from "./types"

export const exportUsePurposesToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: UsePurposes | undefined
): UsePurposesXML | undefined => {
  if (!data || data.length === 0) return undefined

  const values: MetadataPrimitiveValueXML[] = data.map((value) => ({
    "_xsi:type": "app:ApplicationUsePurpose",
    "#text": value,
  }))

  return {
    "v8:Value": values.length === 1 ? values[0] : values,
  }
}

registerTypeRule("UsePurposes", "exportToXML", exportUsePurposesToXML)
