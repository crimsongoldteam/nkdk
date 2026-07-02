import { registerMetadataItemCollectionRule } from "../../../orchestration"
import { MetadataTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { ConditionalAppearanceItemRules } from "./rules"

export type ConditionalAppearanceItem = MetadataTypeByRule<typeof ConditionalAppearanceItemRules>

export type ConditionalAppearanceItemYAML = YAMLTypeByRule<typeof ConditionalAppearanceItemRules>

/** Коллекция элементов условного оформления в YAML. */
export type ConditionalAppearanceItemsYAML = ConditionalAppearanceItemYAML[]

export type ConditionalAppearanceItems = ConditionalAppearanceItem[]

registerMetadataItemCollectionRule({
  propertyType: "ConditionalAppearanceItems",
  itemRule: ConditionalAppearanceItemRules,
  xmlElement: "dcsset:item",
  yamlAsArray: true,
})
