import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { DcsMetadataTypedValueRegistry, DcsMetadataTypedValueTypeFromXML } from "./rules"
import {
  DcsMetadataTypedValueNilXML,
  DcsMetadataTypedValuePropertyRule,
  DcsMetadataTypedValueReference,
  DcsMetadataTypedValueReferenceOrNil,
  DcsMetadataTypedValueUndefinedTypeXML,
  DcsMetadataTypedValueXML,
} from "./types"

const DATA_TYPES_NAMESPACE = "http://v8.1c.ru/8.2/data/types"

const getUndefinedTypePrefix = (xml: DcsMetadataTypedValueXML): string | undefined => {
  if (!("_xsi:type" in xml) || xml["_xsi:type"] !== "v8:Type") return undefined

  const text = "#text" in xml ? xml["#text"] : undefined
  if (typeof text !== "string") return undefined

  const parts = text.split(":")
  if (parts.length !== 2) return undefined

  const [prefix, name] = parts
  if (prefix === "" || name !== "Undefined") return undefined

  return prefix
}

const isUndefinedTypeXML = (xml: DcsMetadataTypedValueXML): xml is DcsMetadataTypedValueUndefinedTypeXML => {
  const prefix = getUndefinedTypePrefix(xml)
  if (prefix === undefined) return false

  return (xml as Record<`_xmlns:${string}`, unknown>)[`_xmlns:${prefix}`] === DATA_TYPES_NAMESPACE
}

const isNilXML = (xml: DcsMetadataTypedValueXML | undefined): xml is DcsMetadataTypedValueNilXML | undefined =>
  xml === undefined || ("_xsi:nil" in xml && (xml["_xsi:nil"] === true || xml["_xsi:nil"] === "true"))

const importSingle = (
  context: ConfigurationContextFromXML,
  rule: DcsMetadataTypedValuePropertyRule,
  xml: DcsMetadataTypedValueXML | undefined
): DcsMetadataTypedValueReferenceOrNil => {
  if (isNilXML(xml)) return undefined
  if (isUndefinedTypeXML(xml)) {
    return context.fromXML.forReference ? xml : undefined
  }

  const type = DcsMetadataTypedValueTypeFromXML(xml["_xsi:type"])
  return DcsMetadataTypedValueRegistry[type].fromXML({ context, rule, xml })
}

export const importDcsMetadataTypedValueFromXML = (
  context: ConfigurationContextFromXML,
  rule: DcsMetadataTypedValuePropertyRule,
  xml: DcsMetadataTypedValueXML | (DcsMetadataTypedValueXML | undefined)[] | undefined
): DcsMetadataTypedValueReference | DcsMetadataTypedValueReferenceOrNil[] | undefined => {
  if (xml === undefined) return undefined
  if (Array.isArray(xml)) {
    const items = xml.map((item) => importSingle(context, rule, item))
    return items.length > 0 ? items : undefined
  }
  return importSingle(context, rule, xml)
}

const importDcsMetadataTypedValueFromXMLForRule = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  value: unknown
): DcsMetadataTypedValueReference | DcsMetadataTypedValueReferenceOrNil[] | undefined =>
  importDcsMetadataTypedValueFromXML(
    context,
    rule as DcsMetadataTypedValuePropertyRule,
    value as DcsMetadataTypedValueXML | (DcsMetadataTypedValueXML | undefined)[]
  )

registerTypeRule("DcsMetadataTypedValue", "importFromXML", importDcsMetadataTypedValueFromXMLForRule)
