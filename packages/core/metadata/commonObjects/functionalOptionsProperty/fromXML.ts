import { ConfigurationContext } from "../../context/types"
import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { FunctionalOptions, FunctionalOptionsXML } from "./types"

export const importFunctionalOptionsFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: FunctionalOptionsXML | undefined
): FunctionalOptions | undefined => {
  if (!xml || !Object.prototype.hasOwnProperty.call(xml, "Item")) return undefined

  const items = Array.isArray(xml.Item) ? xml.Item : [xml.Item]
  return items.map((item) => item ?? "")
}

export const metadataPropertyRule000 = definePropertyTypeRule("FunctionalOptionsProperty", "importFromXML", importFunctionalOptionsFromXML)
