import type { ConfigurationContext } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../../../../ruleRuntime/property/typeRuleRegistry"
import type { GroupItemAuto, GroupItemAutoYAML } from "./types"

export const importGroupItemAutoFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: GroupItemAutoYAML | undefined
): GroupItemAuto | undefined => {
  if (value === "[Авто]") return { itemType: "GroupItemAuto" }
  if (value === "([Авто])") return { itemType: "GroupItemAuto", use: false }
  return undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("GroupItemAuto", "importFromYAML", importGroupItemAutoFromYAML)
