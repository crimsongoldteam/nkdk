import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importMetadataItemFromXML } from "~/metadata/orchestration/metadataItem/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import "./inlineTypes"
import "./typedValues"

export const importFilterItemFromXML = (
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

registerTypeRule("FilterItem", "importFromXML", importFilterItemFromXML)
