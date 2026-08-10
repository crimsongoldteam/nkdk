import { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { FieldsList, FieldsListYAML } from "./types"

export const importFieldsListFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  enterprise: FieldsListYAML | undefined
): FieldsList | undefined => {
  if (!enterprise || enterprise.length === 0) return undefined

  return enterprise
}

export const metadataPropertyRule000 = definePropertyTypeRule("FieldsList", "importFromYAML", importFieldsListFromYAML)
