import { defineMetadataItemCollectionRule } from "../../../ruleRuntime"
import { MetadataTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import { ConditionalAppearanceItemRules } from "./rules"

export type ConditionalAppearanceItem = MetadataTypeByRule<typeof ConditionalAppearanceItemRules>

export type ConditionalAppearanceItemYAML = YAMLTypeByRule<typeof ConditionalAppearanceItemRules>

/** Коллекция элементов условного оформления в YAML. */
export type ConditionalAppearanceItemsYAML = ConditionalAppearanceItemYAML[]

export type ConditionalAppearanceItems = ConditionalAppearanceItem[]

export const metadataRuleLayer000 = defineMetadataItemCollectionRule({
  propertyType: "ConditionalAppearanceItems",
  itemRule: ConditionalAppearanceItemRules,
  xmlElement: "dcsset:item",
  yamlAsArray: true,
  configurationIndexAddressing: "yamlPath",
})
