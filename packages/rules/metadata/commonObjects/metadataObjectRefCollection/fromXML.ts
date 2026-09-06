import { ConfigurationContextFromXML, isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { importMetadataValueFromXML } from "../metadataValue/fromXML"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"
import type { MetadataObjectRefCollection, MetadataObjectRefCollectionXML } from "./types"

export const importMetadataObjectRefCollectionFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: MetadataObjectRefCollectionXML | XmlElementNode | undefined
): MetadataObjectRefCollection | undefined => {
  if (!data) return undefined
  if (isXmlElementNode(data) && data.attributes.length === 0 && !data.content.some(node => node.type === "element") && xmlTextValue(data) === "") return undefined

  const xrItems = isXmlElementNode(data) ? xmlElementChildren(data, "xr:Item") : data["xr:Item"]

  const items = Array.isArray(xrItems) ? xrItems : [xrItems]

  if (items.length === 0) throw new Error("MetadataObjectRefCollection: отсутствует xr:Item")
  const result: MetadataObjectRefCollection = items.map((item: MetadataPrimitiveValueXML | XmlElementNode) => {
    const metadataValue = importMetadataValueFromXML({ context, rule: undefined, value: item })!
    if (!("value" in metadataValue)) {
      throw new Error(`MetadataObjectRefCollection: ожидался примитив, получен ${metadataValue.type}`)
    }
    return String(metadataValue.value)
  })

  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataObjectRefCollection", "importFromXML", importMetadataObjectRefCollectionFromXML)
