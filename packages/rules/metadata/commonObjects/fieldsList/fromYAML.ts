import { ConfigurationContext } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { FieldsList, FieldsListYAML } from "./types"

export const importFieldsListFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  enterprise: FieldsListYAML | Record<string, never> | undefined
): FieldsList | undefined => {
  if (enterprise === undefined) return undefined
  if (!Array.isArray(enterprise)) return Object.keys(enterprise).length === 0 ? [] : undefined
  if (enterprise.length === 0) return undefined

  return enterprise
}

export const metadataPropertyRule000 = definePropertyTypeRule("FieldsList", "importFromYAML", importFieldsListFromYAML)
