import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { DcsMetadataTypedValueRegistry } from "./rules"
import {
  DcsMetadataTypedValue,
  DcsMetadataTypedValuePropertyRule,
  DcsMetadataTypedValueUndefinedTypeXML,
  DcsMetadataTypedValueXML,
} from "./types"

const DATA_TYPES_NAMESPACE = "http://v8.1c.ru/8.2/data/types"

type DcsMetadataTypedValueEmptyXML = Record<string, never>

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isReferenceTypeValue = (value: unknown): value is Record<string, unknown> =>
  isObject(value) && value["_xsi:type"] === "v8:Type"

const getReferenceUndefinedTypeValue = (value: unknown): DcsMetadataTypedValueUndefinedTypeXML | undefined => {
  if (!isReferenceTypeValue(value)) return undefined

  const text = value["#text"]
  if (typeof text !== "string") return undefined

  const parts = text.split(":")
  if (parts.length !== 2) return undefined

  const [prefix, name] = parts
  if (prefix === "" || name !== "Undefined") return undefined

  const namespaceKey = `_xmlns:${prefix}`
  if (value[namespaceKey] !== DATA_TYPES_NAMESPACE) return undefined

  return value as DcsMetadataTypedValueUndefinedTypeXML
}

const exportSingle = (
  context: ConfigurationContextWithExportToXML,
  rule: DcsMetadataTypedValuePropertyRule,
  value: DcsMetadataTypedValue
): DcsMetadataTypedValueXML =>
  DcsMetadataTypedValueRegistry[value.type].toXML({ context, rule, item: value })

export const exportDcsMetadataTypedValueToXML = (
  context: ConfigurationContextWithExportToXML,
  rule: DcsMetadataTypedValuePropertyRule,
  value: DcsMetadataTypedValue | DcsMetadataTypedValue[] | undefined,
  referenceMetadata?: unknown
): DcsMetadataTypedValueXML | DcsMetadataTypedValueEmptyXML | DcsMetadataTypedValueXML[] | undefined => {
  if (value === undefined) {
    const referenceUndefinedValue = getReferenceUndefinedTypeValue(referenceMetadata)
    if (referenceUndefinedValue !== undefined) return referenceUndefinedValue
    if (isReferenceTypeValue(referenceMetadata)) {
      throw new Error("DcsMetadataTypedValue XML: unsupported reference v8:Type")
    }
    if (isObject(referenceMetadata)) return {}
    return undefined
  }
  const valueUndefinedType = getReferenceUndefinedTypeValue(value)
  if (valueUndefinedType !== undefined) return valueUndefinedType
  if (isReferenceTypeValue(value)) {
    throw new Error("DcsMetadataTypedValue XML: unsupported reference v8:Type")
  }
  if (Array.isArray(value)) return value.map((item) => exportSingle(context, rule, item))
  return exportSingle(context, rule, value)
}

const exportDcsMetadataTypedValueToXMLForRule = (
  context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  value: unknown,
  referenceMetadata?: unknown
): DcsMetadataTypedValueXML | DcsMetadataTypedValueEmptyXML | DcsMetadataTypedValueXML[] | undefined =>
  exportDcsMetadataTypedValueToXML(
    context,
    rule as DcsMetadataTypedValuePropertyRule,
    value as DcsMetadataTypedValue | DcsMetadataTypedValue[] | undefined,
    referenceMetadata
  )

registerTypeRule("DcsMetadataTypedValue", "exportToXML", exportDcsMetadataTypedValueToXMLForRule)
