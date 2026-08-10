import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { IndexFields, IndexFieldsXML } from "./types"

export const exportIndexFieldsToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: IndexFields | undefined
): IndexFieldsXML | undefined => {
  if (!data || data.length === 0) return undefined
  return { Field: data.length === 1 ? data[0]! : data }
}

export const metadataPropertyRule000 = definePropertyTypeRule("IndexField", "exportToXML", exportIndexFieldsToXML)
