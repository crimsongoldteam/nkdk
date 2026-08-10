import { ConfigurationContextFromXML } from "../../context/types"
import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { importMetadataValueFromXML } from "../metadataValue/fromXML"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"
import type { MetadataObjectRefCollection, MetadataObjectRefCollectionXML } from "./types"

export const importMetadataObjectRefCollectionFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: MetadataObjectRefCollectionXML | undefined
): MetadataObjectRefCollection | undefined => {
  if (!data) return undefined

  const xrItems = data["xr:Item"]

  const items = Array.isArray(xrItems) ? xrItems : [xrItems]

  const result: MetadataObjectRefCollection = items.map((item: MetadataPrimitiveValueXML) => {
    const metadataValue = importMetadataValueFromXML({ context, rule: undefined, value: item })!
    if (!("value" in metadataValue)) {
      throw new Error(`MetadataObjectRefCollection: ожидался примитив, получен ${metadataValue.type}`)
    }
    return String(metadataValue.value)
  })

  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataObjectRefCollection", "importFromXML", importMetadataObjectRefCollectionFromXML)
