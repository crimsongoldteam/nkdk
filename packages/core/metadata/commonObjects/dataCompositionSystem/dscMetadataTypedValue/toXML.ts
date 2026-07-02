import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { DcsMetadataTypedValueRegistry } from "./rules"
import {
  DcsMetadataTypedValue,
  DcsMetadataTypedValueNilXML,
  DcsMetadataTypedValuePropertyRule,
  DcsMetadataTypedValueUndefinedTypeXML,
  DcsMetadataTypedValueXML,
} from "./types"

const DATA_TYPES_NAMESPACE = "http://v8.1c.ru/8.2/data/types"

type DcsMetadataTypedValueEmptyXML = Record<string, never>
type ExportableDcsMetadataTypedValue = DcsMetadataTypedValue | DcsMetadataTypedValueUndefinedTypeXML
type ExportableDcsMetadataTypedValueOrNil = ExportableDcsMetadataTypedValue | undefined

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isNilXML = (value: unknown): value is DcsMetadataTypedValueNilXML =>
  isObject(value) && (value["_xsi:nil"] === true || value["_xsi:nil"] === "true")

const isNilReferenceSlot = (referenceMetadata: unknown, index: number): boolean =>
  Array.isArray(referenceMetadata) &&
  index in referenceMetadata &&
  (referenceMetadata[index] === undefined || isNilXML(referenceMetadata[index]))

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

const isDcsMetadataTypedValue = (value: ExportableDcsMetadataTypedValue): value is DcsMetadataTypedValue =>
  isObject(value) && typeof (value as { type?: unknown }).type === "string"

const exportSingle = (
  context: ConfigurationContextWithExportToXML,
  rule: DcsMetadataTypedValuePropertyRule,
  value: ExportableDcsMetadataTypedValue
): DcsMetadataTypedValueXML => {
  const valueUndefinedType = getReferenceUndefinedTypeValue(value)
  if (valueUndefinedType !== undefined) return valueUndefinedType
  if (isReferenceTypeValue(value)) {
    throw new Error("DcsMetadataTypedValue XML: unsupported reference v8:Type")
  }
  if (!isDcsMetadataTypedValue(value)) {
    throw new Error("DcsMetadataTypedValue XML: unsupported typed value")
  }
  const modelValue = value as DcsMetadataTypedValue
  const handler = DcsMetadataTypedValueRegistry[modelValue.type]
  if (handler === undefined) {
    throw new Error(
      `DcsMetadataTypedValue: отсутствует toXML-обработчик для типа ${modelValue.type} (rule.type: ${rule.type})`
    )
  }
  return handler.toXML({ context, rule, item: modelValue })
}

const exportArrayItem = (
  context: ConfigurationContextWithExportToXML,
  rule: DcsMetadataTypedValuePropertyRule,
  value: ExportableDcsMetadataTypedValueOrNil,
  referenceMetadata: unknown,
  index: number
): DcsMetadataTypedValueXML | undefined => {
  if (value === undefined) {
    return isNilReferenceSlot(referenceMetadata, index) ? { "_xsi:nil": "true" } : undefined
  }
  return exportSingle(context, rule, value)
}

export const exportDcsMetadataTypedValueToXML = (
  context: ConfigurationContextWithExportToXML,
  rule: DcsMetadataTypedValuePropertyRule,
  value: ExportableDcsMetadataTypedValue | ExportableDcsMetadataTypedValueOrNil[] | undefined,
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
  if (Array.isArray(value)) {
    const items = value
      .map((item, index) => exportArrayItem(context, rule, item, referenceMetadata, index))
      .filter((item): item is DcsMetadataTypedValueXML => item !== undefined)
    return items.length > 0 ? items : undefined
  }
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
    value as ExportableDcsMetadataTypedValue | ExportableDcsMetadataTypedValueOrNil[] | undefined,
    referenceMetadata
  )

registerTypeRule("DcsMetadataTypedValue", "exportToXML", exportDcsMetadataTypedValueToXMLForRule)
