import { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { FunctionalOptions, FunctionalOptionsXML } from "./types"

export const exportFunctionalOptionsToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FunctionalOptions | undefined
): FunctionalOptionsXML | undefined => {
  if (!data || data.length === 0) return undefined

  return {
    Item: data.length === 1 ? data[0] : data,
  }
}

registerTypeRule("FunctionalOptionsProperty", "exportToXML", exportFunctionalOptionsToXML)
