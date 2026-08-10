import { ConfigurationContext } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
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
