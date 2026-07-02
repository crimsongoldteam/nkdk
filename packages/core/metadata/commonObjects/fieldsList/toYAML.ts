import { ConfigurationContext } from "~/metadata/context/types"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { FieldsList, FieldsListYAML } from "./types"

export const exportFieldsListToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FieldsList | undefined
): FieldsListYAML | undefined => {
  if (!data || data.length === 0) return undefined

  return data
}

registerTypeRule("FieldsList", "exportToYAML", exportFieldsListToYAML)
