import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContextFromXML } from "@nkdk/runtime"
import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexPropertyValueLogicalAddress,
} from "@nkdk/runtime"
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

export const metadataPropertyRule000 = definePropertyTypeRule("IndexField", "importFromXML", importIndexFieldsFromXML)
export const metadataPropertyRule001 = definePropertyTypeRule("IndexField", "collectConfigurationIndexFromXML", ({ context, xml, propertyKey }) => {
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
