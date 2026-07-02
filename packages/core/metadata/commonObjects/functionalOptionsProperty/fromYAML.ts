import { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { FunctionalOptions, FunctionalOptionsYAML } from "./types"

export const importFunctionalOptionsFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FunctionalOptionsYAML | undefined
): FunctionalOptions | undefined => {
  if (!data || !Array.isArray(data)) return undefined

  return data
}

registerTypeRule("FunctionalOptionsProperty", "importFromYAML", importFunctionalOptionsFromYAML)
