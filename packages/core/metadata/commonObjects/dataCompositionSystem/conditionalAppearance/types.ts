import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ConditionalAppearanceItemRules } from "./rules"

export type ConditionalAppearanceItem = FormTypeByRule<typeof ConditionalAppearanceItemRules>

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
