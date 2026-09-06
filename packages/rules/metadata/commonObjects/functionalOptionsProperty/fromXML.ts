import { ConfigurationContext, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { FunctionalOptions, FunctionalOptionsXML } from "./types"

export const importFunctionalOptionsFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: FunctionalOptionsXML | XmlElementNode | undefined
): FunctionalOptions | undefined => {
  if (isXmlElementNode(xml)) {
    const items = xmlElementChildren(xml, "Item")
    return items.length === 0 ? undefined : items.map(xmlTextValue)
  }
  if (!xml || !Object.prototype.hasOwnProperty.call(xml, "Item")) return undefined

  const items = Array.isArray(xml.Item) ? xml.Item : [xml.Item]
  return items.map((item) => item ?? "")
}

export const metadataPropertyRule000 = definePropertyTypeRule("FunctionalOptionsProperty", "importFromXML", importFunctionalOptionsFromXML)
