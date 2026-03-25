import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { DynamicListRules } from "./rules"

/** Внутренняя модель по правилам; `Record<string, unknown>` — для pass-through полей до полного перевода импорта на rules. */
export type DynamicList = MetadataTypeByRule<typeof DynamicListRules> & Record<string, unknown>

export type DynamicListYAML = YAMLTypeByRule<typeof DynamicListRules> & Record<string, unknown>

export type DynamicListXML = {
  [key: string]: unknown
}

registerMetadataItemRule({
  propertyType: "DynamicList",
  itemRule: DynamicListRules,
})
