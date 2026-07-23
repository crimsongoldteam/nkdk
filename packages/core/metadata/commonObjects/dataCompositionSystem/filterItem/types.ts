import { registerMetadataItemCollectionRule, registerTypeRule } from "../../../orchestration"
import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { importFilterItemFromXMLToYAML } from "./fromXMLToYAML"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import { exportFilterItemToJSONSchema } from "./toJSONSchema"
import "./typedValues"

export type FilterItemComparison = FormTypeByRule<typeof FilterItemComparisonRules>
export type FilterItemComparisonYAML = YAMLTypeByRule<typeof FilterItemComparisonRules>

export type FilterItemGroup = FormTypeByRule<typeof FilterItemGroupRules>
export type FilterItemGroupYAML = YAMLTypeByRule<typeof FilterItemGroupRules>

export type FilterItem = (FilterItemComparison | FilterItemGroup)[]
export type FilterItemYAML = (FilterItemComparisonYAML | FilterItemGroupYAML)[]

const referenceIdentity = {
  fromYAML: ({ yaml }: { yaml: unknown }): string | undefined => {
    if (!isRecord(yaml)) return undefined
    if (typeof yaml.ТипГруппы === "string") {
      const groupType =
        yaml.ТипГруппы === "ГруппаИ" ? "AndGroup" : yaml.ТипГруппы === "ГруппаИли" ? "OrGroup" : undefined
      return groupType === undefined ? undefined : `group:${groupType}`
    }
    const left = typeof yaml.ЛевоеЗначение === "string" ? yaml.ЛевоеЗначение.replace(/^\./, "") : undefined
    if (left === undefined) return undefined
    const comparison =
      yaml.ВидСравнения === undefined ? "Equal" : yaml.ВидСравнения === "Равно" ? "Equal" : String(yaml.ВидСравнения)
    return `comparison:${left}:${comparison}`
  },
  fromXML: ({ xml }: { xml: Record<string, unknown> }): string | undefined => {
    if (xml["_xsi:type"] === "dcsset:FilterItemGroup") {
      const groupType = textValue(xml["dcsset:groupType"])
      return groupType === undefined ? undefined : `group:${groupType}`
    }
    if (xml["_xsi:type"] !== "dcsset:FilterItemComparison") return undefined
    const left = textValue(xml["dcsset:left"])?.replace(/^\./, "")
    if (left === undefined) return undefined
    const comparison = textValue(xml["dcsset:comparisonType"]) ?? "Equal"
    return `comparison:${left}:${comparison}`
  },
}

registerMetadataItemCollectionRule({
  propertyType: "FilterItem",
  itemRule: FilterItemComparisonRules,
  xmlElement: "dcsset:item",
  fromXMLToYAML: importFilterItemFromXMLToYAML,
  toJSONSchema: exportFilterItemToJSONSchema,
  yamlAsArray: true,
  configurationIndexAddressing: "yamlPath",
  schemaName: "FilterItem",
  schemaShape: "schema",
  referenceIdentity,
})

registerTypeRule("FilterItem", "yamlToXMLNestedRule", {
  kind: "collection",
  itemRule: FilterItemComparisonRules,
  resolveItemRule: ({ yaml }) =>
    yaml !== null && typeof yaml === "object" && !Array.isArray(yaml) && "ТипГруппы" in yaml
      ? FilterItemGroupRules
      : FilterItemComparisonRules,
  yamlShape: "array",
  xmlElement: "dcsset:item",
  referenceIdentity,
  configurationIndexAddressing: "yamlPath",
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function textValue(value: unknown): string | undefined {
  if (typeof value === "string") return value
  return isRecord(value) && typeof value["#text"] === "string" ? value["#text"] : undefined
}
