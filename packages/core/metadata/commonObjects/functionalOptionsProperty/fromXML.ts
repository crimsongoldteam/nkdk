import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { FunctionalOptions, FunctionalOptionsXML } from "./types"

export const importFunctionalOptionsFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: FunctionalOptionsXML | undefined
): FunctionalOptions | undefined => {
  if (!xml || !Object.prototype.hasOwnProperty.call(xml, "Item")) return undefined

  const items = Array.isArray(xml.Item) ? xml.Item : [xml.Item]
  return items.map((item) => item ?? "")
}

registerTypeRule("FunctionalOptionsProperty", "importFromXML", importFunctionalOptionsFromXML)
