import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "~/metadata/context/types"
import { FunctionalOptions, FunctionalOptionsXML } from "./types"

export const _importFunctionalOptionsFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  xml: FunctionalOptionsXML | undefined
): FunctionalOptions | undefined => {
  if (!xml || !xml.Item) return undefined

  return Array.isArray(xml.Item) ? xml.Item : [xml.Item]
}
