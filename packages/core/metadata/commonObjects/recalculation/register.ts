import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import { ExportToXMLFunctionNew } from "~/metadata/orchestration/property/fn"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { RecalculationRules } from "./rules"
import { Recalculation, RecalculationYAML, Recalculations, RecalculationsYAML } from "./types"

registerTypeRule("Recalculations", "importFromXML", (_context: ConfigurationContextFromXML, _rule, xml) => {
  if (xml === undefined || xml === null) return undefined
  const names = Array.isArray(xml) ? xml : [xml]
  const result = names
    .filter((name): name is string => typeof name === "string" && name.length > 0)
    .map((name) => ({ itemType: RecalculationRules.itemType, name }) as Recalculation)

  return result.length > 0 ? result : undefined
})

const exportRecalculationsToXML: ExportToXMLFunctionNew = ({ context, value, referenceMetadata }) => {
  const items = (value as Recalculations | undefined) ?? (referenceMetadata as Recalculations | undefined)
  if (!items || items.length === 0) return undefined

  return items.map((item) => {
    const exported = exportMetadataItemToXML({
      context,
      data: item,
      referenceData: item,
      rule: RecalculationRules,
    })
    return (exported?.Properties as { Name?: string } | undefined)?.Name ?? item.name
  })
}

registerTypeRule("Recalculations", "exportToXML", exportRecalculationsToXML)

registerTypeRule(
  "Recalculations",
  "importFromYAML",
  (context: ConfigurationContext, _rule: PropertyRule | undefined, data: RecalculationsYAML | undefined) => {
    if (!data) return undefined
    const result = Object.entries(data).map(([name, value]) => ({
      ...importMetadataItemFromYAML({ context, yaml: value as RecalculationYAML, rule: RecalculationRules, name }),
      name,
    })) as Recalculations
    return result.length > 0 ? result : undefined
  }
)

registerTypeRule(
  "Recalculations",
  "exportToYAML",
  (context: ConfigurationContext, _rule: PropertyRule | undefined, data: Recalculations | undefined) =>
    exportMetadataCollectionToYAMLAsRecord({
      context,
      data,
      itemRule: RecalculationRules,
      keyField: "name",
    }) as RecalculationsYAML | undefined
)
