import type { ConfigurationContext } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../../../../ruleRuntime/property/typeRuleRegistry"
import type { GroupItemAuto, GroupItemAutoYAML } from "./types"

export const exportGroupItemAutoToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: GroupItemAuto | undefined
): GroupItemAutoYAML | undefined => {
  if (value == null) return undefined
  return value.use === false ? "([Авто])" : "[Авто]"
}

export const metadataPropertyRule000 = definePropertyTypeRule("GroupItemAuto", "exportToYAML", exportGroupItemAutoToYAML)
