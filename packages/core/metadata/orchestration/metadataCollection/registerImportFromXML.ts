import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "../formElement/factory"
import { importMetadataItemFromXML } from "../metadataItem/fromXML"
import { ToMetadata } from "../metadataItem/registry"
import { NamedElementXML, NamedMetadataItem } from "./types"

export const registerImportFromXML = <
  Rule extends MetadataItemRule,
  CollectionType extends PropertyRuleType,
  XMLKey extends string,
>(
  propertyType: CollectionType,
  itemRule: Rule,
  xmlElement: XMLKey
): void => {
  registerTypeRule(
    propertyType,
    "importFromXML",
    (
      context: ConfigurationContextFromXML,
      _rule: PropertyRule | undefined,
      xml: Record<XMLKey, NamedElementXML | NamedElementXML[]> | undefined
    ): (ToMetadata<Rule["itemType"]> & NamedMetadataItem)[] | undefined => {
      if (!xml || !xml[xmlElement]) return undefined

      const xmlArray = Array.isArray(xml[xmlElement]) ? xml[xmlElement] : [xml[xmlElement]]

      const imported = xmlArray
        .map((item) => {
          const properties = importMetadataItemFromXML({
            context,
            xml: item,
            rule: itemRule,
          })
          if (!properties) return undefined
          // If imported item has no explicit properties (only technical itemType),
          // do not include it into collection result.
          const propertyKeys = Object.keys(properties)
          const hasNoMeaningfulProperties = propertyKeys.every((key) => key === "itemType" || key === "name")
          if (hasNoMeaningfulProperties) return undefined
          return {
            ...properties,
            name: item._name,
          } as ToMetadata<Rule["itemType"]> & NamedMetadataItem
        })
        .filter((item): item is ToMetadata<Rule["itemType"]> & NamedMetadataItem => item !== undefined)

      return imported.length > 0 ? imported : undefined
    }
  )
}
