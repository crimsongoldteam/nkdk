import { isEmptyXmlElement, isXmlElementNode, xmlAttributeValue, xmlElementChildren, type XmlElementNode, type ConfigurationContextFromXML } from "@nkdk/runtime"
import { withConfigurationIndexYamlCollectionItemContext } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import { importDcsLocalStringTypeFromXML } from "../dcsLocalStringType/fromXML"
import { importDcsMetadataValuePayload } from "../dcsMetadataValue/fromXML"
import type { DcsLocalStringTypeXML } from "../dcsLocalStringType/types"
import type { DcsMetadataValuePropertyRule, MetadataDcsMetadataValueDcsRootXML } from "../dcsMetadataValue/types"
import type { DcsAvailableValue, DcsAvailableValues } from "./types"

const valueRule = {
  type: "MetadataDcsMetadataValue",
  valueType: "Primitive",
} as const satisfies DcsMetadataValuePropertyRule

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

const isNilValueXML = (value: unknown): boolean =>
  isXmlElementNode(value) ? xmlAttributeValue(value, "xsi:nil") === "true" : typeof value === "object" &&
  value !== null &&
  ((value as { "_xsi:nil"?: unknown })["_xsi:nil"] === true ||
    (value as { "_xsi:nil"?: unknown })["_xsi:nil"] === "true")

export const importDcsAvailableValuesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: unknown
): DcsAvailableValues | undefined => {
  const items = toArray(xml as Record<string, unknown> | XmlElementNode | (Record<string, unknown> | XmlElementNode)[] | undefined)
  if (items.length === 0) return undefined
  if (items.length === 1 && isXmlElementNode(items[0]) && isEmptyXmlElement(items[0])) return undefined

  return items.map((item, index): DcsAvailableValue => {
    const itemContext = withConfigurationIndexYamlCollectionItemContext(context, { index, yamlAsArray: true })
    if (isXmlElementNode(item) && isEmptyXmlElement(item)) throw new TypeError("Пустой элемент списка доступных значений")
    const valueXML = isXmlElementNode(item) ? xmlElementChildren(item, "dcssch:value")[0] : item["dcssch:value"]
    const value =
      valueXML !== undefined && !(isXmlElementNode(valueXML) && isEmptyXmlElement(valueXML)) && !isNilValueXML(valueXML)
        ? importDcsMetadataValuePayload(itemContext, valueRule, valueXML as MetadataDcsMetadataValueDcsRootXML["dcscor:value"] | XmlElementNode)
        : undefined
    const presentation = importDcsLocalStringTypeFromXML(
      itemContext,
      { type: "DcsLocalStringType" },
      isXmlElementNode(item) ? xmlElementChildren(item, "dcssch:presentation")[0] : item["dcssch:presentation"] as DcsLocalStringTypeXML
    )

    return {
      itemType: "DcsAvailableValue",
      ...(value !== undefined ? { value } : {}),
      ...(presentation !== undefined ? { presentation } : {}),
    }
  })
}

export const metadataPropertyRule000 = definePropertyTypeRule("DcsAvailableValues", "importFromXML", importDcsAvailableValuesFromXML)

export const metadataPropertyRule001 = definePropertyTypeRule(
  "DcsAvailableValues",
  "xmlImportPropertyBehavior",
  { repeatedXMLNodes: true },
)
