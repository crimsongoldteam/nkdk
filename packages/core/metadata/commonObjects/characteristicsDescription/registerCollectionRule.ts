import { getConfigurationIndexCollectionContext } from "../../configurationIndex/collector/context"
import { yamlIndexUid, yamlPropertyUid } from "../../configurationIndex/logicalAddress"
import { registerMetadataItemCollectionRule, registerTypeRule } from "../../orchestration"
import { CharacteristicsDescriptionRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "CharacteristicsDescriptions",
  itemRule: CharacteristicsDescriptionRules,
  xmlElement: "xr:Characteristic",
  yamlAsArray: true,
})

const preservedDefaultFields = [
  ["xr:CharacteristicTypes", "xr:DataPathField", "ПолеПутиКДанным"],
  ["xr:CharacteristicTypes", "xr:MultipleValuesUseField", "ПолеИспользованияМножественныхЗначений"],
  ["xr:CharacteristicValues", "xr:MultipleValuesKeyField", "ПолеКлючаМножественныхЗначений"],
  ["xr:CharacteristicValues", "xr:MultipleValuesOrderField", "ПолеПорядкаМножественныхЗначений"],
] as const

registerTypeRule("CharacteristicsDescriptions", "collectConfigurationIndexFromXML", ({ context, xml }) => {
  const collection = getConfigurationIndexCollectionContext(context)
  const root = asRecord(xml)
  if (collection === undefined || root === undefined) return

  const source = root["xr:Characteristic"]
  const items = Array.isArray(source) ? source : source === undefined ? [] : [source]
  items.forEach((item, index) => {
    const record = asRecord(item)
    if (record === undefined) return
    const itemAddress = yamlIndexUid(collection.logicalAddress, index)
    for (const [parentKey, xmlKey, yamlKey] of preservedDefaultFields) {
      const parent = asRecord(record[parentKey])
      if (scalarText(parent?.[xmlKey]) !== "-1") continue
      collection.collector.setXmlValue(yamlPropertyUid(itemAddress, yamlKey), "xmlText", "-1")
    }
  })
})

function scalarText(value: unknown): string | undefined {
  if (typeof value === "string") return value
  const record = asRecord(value)
  return typeof record?.["#text"] === "string" ? record["#text"] : undefined
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
