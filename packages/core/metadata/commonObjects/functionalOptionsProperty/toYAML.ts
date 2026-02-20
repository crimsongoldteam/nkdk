import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { FunctionalOptions, FunctionalOptionsYAML } from "./types"

export const exportFunctionalOptionsToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FunctionalOptions | undefined
): FunctionalOptionsYAML | undefined => {
  if (!data || data.length === 0) return undefined

  return data
}

registerTypeRule("FunctionalOptionsProperty", "exportToYAML", exportFunctionalOptionsToYAML)
