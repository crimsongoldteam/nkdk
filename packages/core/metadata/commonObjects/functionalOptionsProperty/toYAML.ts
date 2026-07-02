import { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { FunctionalOptions, FunctionalOptionsYAML } from "./types"

export const exportFunctionalOptionsToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FunctionalOptions | undefined
): FunctionalOptionsYAML | undefined => {
  if (!data || data.length === 0) return undefined

  return data
}

registerTypeRule("FunctionalOptionsProperty", "exportToYAML", exportFunctionalOptionsToYAML)
