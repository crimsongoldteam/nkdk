import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
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

export const metadataPropertyRule000 = definePropertyTypeRule("UsePurposes", "exportToXML", exportUsePurposesToXML)
