import { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { FunctionalOptions, FunctionalOptionsYAML } from "./types"

export const importFunctionalOptionsFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FunctionalOptionsYAML | undefined
): FunctionalOptions | undefined => {
  if (!data || !Array.isArray(data)) return undefined

  return data
}

export const metadataPropertyRule000 = definePropertyTypeRule("FunctionalOptionsProperty", "importFromYAML", importFunctionalOptionsFromYAML)
