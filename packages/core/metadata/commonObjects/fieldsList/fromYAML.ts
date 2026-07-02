import { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { FieldsList, FieldsListYAML } from "./types"

export const importFieldsListFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  enterprise: FieldsListYAML | undefined
): FieldsList | undefined => {
  if (!enterprise || enterprise.length === 0) return undefined

  return enterprise
}

registerTypeRule("FieldsList", "importFromYAML", importFieldsListFromYAML)
