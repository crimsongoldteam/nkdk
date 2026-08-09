import type { PropertyRule } from "../../ruleRuntime/property/types"
import { registerTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContextFromXML } from "../../context/types"
import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexPropertyValueLogicalAddress,
} from "../../configurationIndex/collector/context"
import type { IndexFields, IndexFieldsXML } from "./types"

export const importIndexFieldsFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: IndexFieldsXML | undefined
): IndexFields | undefined => {
  if (!xml) return undefined
  const fields = xml.Field
  if (fields === undefined) return []
  return Array.isArray(fields) ? fields : [fields]
}

registerTypeRule("IndexField", "importFromXML", importIndexFieldsFromXML)
registerTypeRule("IndexField", "collectConfigurationIndexFromXML", ({ context, xml, propertyKey }) => {
  const collection = getConfigurationIndexCollectionContext(context)
  if (
    collection === undefined ||
    xml === null ||
    typeof xml !== "object" ||
    Array.isArray(xml) ||
    Object.keys(xml).length > 0
  ) {
    return
  }
  collection.collector.setXmlFlag(
    getConfigurationIndexPropertyValueLogicalAddress(collection, propertyKey),
    "explicitEmpty"
  )
})
