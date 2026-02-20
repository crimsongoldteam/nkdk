import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { FunctionalOptions, FunctionalOptionsYAML } from "./types"

export const importFunctionalOptionsFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FunctionalOptionsYAML | undefined
): FunctionalOptions | undefined => {
  if (!data || !Array.isArray(data)) return undefined

  return data
}

registerTypeRule("FunctionalOptionsProperty", "importFromYAML", importFunctionalOptionsFromYAML)
