import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import type { ExportToXMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { DcsMetadataTypedValueRegistry } from "./rules"
import {
  DcsMetadataTypedValue,
  DcsMetadataTypedValueNilXML,
  DcsMetadataTypedValuePropertyRule,
  DcsMetadataTypedValueXML,
} from "./types"

type ExportableDcsMetadataTypedValue = DcsMetadataTypedValue | DcsMetadataTypedValueNilXML
type ExportableDcsMetadataTypedValueOrNil = ExportableDcsMetadataTypedValue | undefined

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isNilXML = (value: unknown): value is DcsMetadataTypedValueNilXML =>
  isObject(value) && (value["_xsi:nil"] === true || value["_xsi:nil"] === "true")

const isDcsMetadataTypedValue = (value: ExportableDcsMetadataTypedValue): value is DcsMetadataTypedValue =>
  isObject(value) && typeof (value as { type?: unknown }).type === "string"

const exportSingle = (
  context: ConfigurationContextWithExportToXML,
  rule: DcsMetadataTypedValuePropertyRule,
  value: ExportableDcsMetadataTypedValue
): DcsMetadataTypedValueXML => {
  if (isNilXML(value)) return value
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

export const exportDcsMetadataTypedValueToXML = (
  context: ConfigurationContextWithExportToXML,
  rule: DcsMetadataTypedValuePropertyRule,
  value: ExportableDcsMetadataTypedValue | ExportableDcsMetadataTypedValueOrNil[] | undefined
): DcsMetadataTypedValueXML | DcsMetadataTypedValueXML[] | undefined => {
  if (value === undefined) return undefined
  if (Array.isArray(value)) {
    const items = value
      .map((item) => item === undefined ? undefined : exportSingle(context, rule, item))
      .filter((item): item is DcsMetadataTypedValueXML => item !== undefined)
    return items.length > 0 ? items : undefined
  }
  return exportSingle(context, rule, value)
}

const exportDcsMetadataTypedValueToXMLDirect: ExportToXMLFunctionNew = ({
  context,
  rule,
  value,
  source,
  propertyKey,
}) => {
  const rawYAML = propertyKey === undefined ? undefined : source?.raw(propertyKey)
  const normalizedValue =
    Array.isArray(value) && Array.isArray(rawYAML)
      ? value.map((item, index) =>
          item === undefined &&
          isObject(rawYAML[index]) &&
          Object.keys(rawYAML[index] as Record<string, unknown>).length === 0
            ? ({ "_xsi:nil": "true" } as DcsMetadataTypedValueNilXML)
            : item
        )
      : value
  return exportDcsMetadataTypedValueToXML(
    context,
    rule as DcsMetadataTypedValuePropertyRule,
    normalizedValue
  )
}

export const metadataPropertyRule000 = definePropertyTypeRule("DcsMetadataTypedValue", "exportToXML", exportDcsMetadataTypedValueToXMLDirect)
