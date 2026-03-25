import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ConditionalAppearanceItemRules } from "./rules"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"

export type ConditionalAppearanceItem = MetadataTypeByRule<typeof ConditionalAppearanceItemRules>

export type ConditionalAppearanceItemYAML = YAMLTypeByRule<typeof ConditionalAppearanceItemRules>

/** Коллекция условного оформления в YAML: объект по имени элемента. */
export type ConditionalAppearanceYAML = Record<string, ConditionalAppearanceItemYAML>

export type ConditionalAppearance = ConditionalAppearanceItem[]

registerMetadataItemCollectionRule({
  propertyType: "ConditionalAppearance",
  itemRule: ConditionalAppearanceItemRules,
  xmlElement: "dcsset:item",
  omitIdAttributeInXML: true,
})
