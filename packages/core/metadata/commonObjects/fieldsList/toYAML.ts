import { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { FieldsList, FieldsListYAML } from "./types"

export const exportFieldsListToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FieldsList | undefined
): FieldsListYAML | undefined => {
  if (!data || data.length === 0) return undefined

  return data
}

export const metadataPropertyRule000 = definePropertyTypeRule("FieldsList", "exportToYAML", exportFieldsListToYAML)
