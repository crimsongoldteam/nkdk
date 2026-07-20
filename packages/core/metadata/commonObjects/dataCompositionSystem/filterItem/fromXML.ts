import { ConfigurationContextFromXML } from "../../../context/types"
import { withConfigurationIndexYamlCollectionItemContext } from "../../../configurationIndex/collector/context"
import { importMetadataItemFromXML } from "../../../orchestration/metadataItem/fromXML"
import type { PropertyRule } from "../../../orchestration/property/types"
import type { FilterItem } from "./types"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import "./inlineTypes"
import "./typedValues"

const importFilterItemElementFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: unknown
) => {
  if (!xml || typeof xml !== "object") return undefined
  const xsiType = (xml as Record<string, unknown>)["_xsi:type"]
  if (typeof xsiType !== "string") return undefined
  if (xsiType === "dcsset:FilterItemComparison") {
    return importMetadataItemFromXML({ context, xml, rule: FilterItemComparisonRules })
  }
  if (xsiType === "dcsset:FilterItemGroup") {
    return importMetadataItemFromXML({ context, xml, rule: FilterItemGroupRules })
  }
  return undefined
}

export const importFilterItemFromXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule | undefined,
  xml: unknown | unknown[] | undefined
): FilterItem | undefined => {
  if (!xml) return undefined
  const items = Array.isArray(xml) ? xml : [xml]
  const imported = items.flatMap((item, index) => {
    const itemContext = withConfigurationIndexYamlCollectionItemContext(context, { index, yamlAsArray: true })
    const importedItem = importFilterItemElementFromXML(itemContext, rule, item)
    return importedItem ? [importedItem] : []
  })
  return imported.length > 0 ? imported : undefined
}
