import { defineMetadataItemCollectionRule, defineMetadataItemRule, defineMetadataRules } from "../../ruleRuntime"
import { configurationIndexCollectionItemContext } from "@nkdk/runtime/rule-kit"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { PredefinedItemRules } from "./rules"

export type PredefinedItem = MetadataTypeByRule<typeof PredefinedItemRules>
export type PredefinedItemYAML = YAMLTypeByRule<typeof PredefinedItemRules>

export type PredefinedItemCollection = PredefinedItem[]
export type PredefinedItemCollectionYAML = Record<string, PredefinedItemYAML>

const CURRENT_CONFIG_NAMESPACE = "http://v8.1c.ru/8.1/data/enterprise/current-config"

declare module "@nkdk/runtime" {
  interface ToXMLConfigurationContext {
    readonly predefinedItemXMLDepth?: number
  }
}

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "PredefinedItem",
  itemRule: PredefinedItemRules,
})

const collection = defineMetadataItemCollectionRule({
  propertyType: "PredefinedItemCollection",
  itemRule: PredefinedItemRules,
  xmlElement: "Item",
  keyField: "name",
  configurationIndexUidSegment: "Предопределенный",
})
const nested = collection.propertyTypes.PredefinedItemCollection?.yamlToXMLNestedRule
if (nested?.kind !== "collection") throw new Error("Не подготовлено правило коллекции предопределённых элементов")
const collectionRule = nested

export const metadataRuleLayer001 = defineMetadataRules({
  ...collection,
  propertyTypes: {
    ...collection.propertyTypes,
    PredefinedItemCollection: {
      ...collection.propertyTypes.PredefinedItemCollection,
      yamlToXMLNestedRule: {
        ...collectionRule,
        resolveItemContext({ context, yaml, name, index }: Parameters<NonNullable<typeof collectionRule.resolveItemContext>>[0]) {
          const indexed = configurationIndexCollectionItemContext({ context, yaml, name, index, descriptor: collectionRule })
          const depth = (context.exportToXML.predefinedItemXMLDepth ?? -1) + 1
          return {
            ...indexed,
            exportToXML: {
              ...indexed.exportToXML,
              predefinedItemXMLDepth: depth,
              typeDescriptionXMLPrefixByNamespace: {
                ...indexed.exportToXML.typeDescriptionXMLPrefixByNamespace,
                [CURRENT_CONFIG_NAMESPACE]: `d${4 + depth * 2}p1`,
              },
            },
          }
        },
      },
    },
  },
})
