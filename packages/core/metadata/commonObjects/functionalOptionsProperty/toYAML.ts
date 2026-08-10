import { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { FunctionalOptions, FunctionalOptionsYAML } from "./types"

export const exportFunctionalOptionsToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FunctionalOptions | undefined
): FunctionalOptionsYAML | undefined => {
  if (!data || data.length === 0) return undefined

  return data
}

export const metadataPropertyRule000 = definePropertyTypeRule("FunctionalOptionsProperty", "exportToYAML", exportFunctionalOptionsToYAML)
