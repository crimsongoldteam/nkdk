import type { ConfigurationContext, ConfigurationContextFromXML } from "../../../context/types"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { PropertyRule } from "../../../orchestration/property/types"
import { importDcsMetadataValueFromDcsXML } from "../dcsMetadataValue/fromXML"
import { importDcsMetadataValueFromYAML } from "../dcsMetadataValue/fromYAML"
import { exportDcsMetadataValueToDcsXML } from "../dcsMetadataValue/toXML"
import { exportDcsMetadataValueToYAML } from "../dcsMetadataValue/toYAML"

type DcsValueXml = string | { "_xsi:type"?: string; "#text"?: string; [key: string]: unknown }

const fieldRule = { type: "MetadataDcsMetadataValue", valueType: "Field" } as const
const localStringRule = { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue" } as const
const primitiveRule = { type: "MetadataDcsMetadataValue", valueType: "Primitive" } as const

const exportFilterItemFieldValueToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
): DcsValueXml | undefined => {
  if (value === undefined) return undefined
  return exportDcsMetadataValueToDcsXML({ context, rule: fieldRule as any, data: value })["dcscor:value"] as any
}

const importFilterItemFieldValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: unknown
): string | undefined => {
  if (xml === undefined) return undefined
  return importDcsMetadataValueFromDcsXML(context, fieldRule as any, { "dcscor:value": xml as any }) as any
}

const exportFilterItemFieldValueToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
) => {
  if (value === undefined) return undefined
  // В DCS FilterItem поля в YAML идут с ведущей точкой: ".Поле"
  return `.${value}`
}

const importFilterItemFieldValueFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: unknown
) => {
  if (typeof value !== "string") return undefined
  return value.startsWith(".") ? value.slice(1) : value
}

const exportFilterItemLocalStringTypeToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: unknown
): DcsValueXml | undefined => {
  if (value === undefined) return undefined
  return exportDcsMetadataValueToDcsXML({ context, rule: localStringRule as any, data: value as any })[
    "dcscor:value"
  ] as any
}

const importFilterItemLocalStringTypeFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: unknown
) => {
  if (xml === undefined) return undefined
  return importDcsMetadataValueFromDcsXML(context, localStringRule as any, { "dcscor:value": xml as any }) as any
}

const exportFilterItemLocalStringTypeToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: unknown
) => exportDcsMetadataValueToYAML(context, localStringRule as any, value as any)

const importFilterItemLocalStringTypeFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: unknown,
  sourceValue?: unknown
) => {
  if (typeof value === "string" && typeof sourceValue === "object" && sourceValue !== null) {
    if ("items" in sourceValue) return { items: { [context.defaultLanguage]: value } }
    if ("type" in sourceValue && (sourceValue as Record<string, unknown>).type === "string") {
      return { type: "string", value }
    }
  }
  return importDcsMetadataValueFromYAML(context, localStringRule as any, value as any, sourceValue as any)
}

registerTypeRule("FilterItemFieldValue", "exportToXML", exportFilterItemFieldValueToXML as any)
registerTypeRule("FilterItemFieldValue", "importFromXML", importFilterItemFieldValueFromXML as any)
registerTypeRule("FilterItemFieldValue", "exportToYAML", exportFilterItemFieldValueToYAML as any)
registerTypeRule("FilterItemFieldValue", "importFromYAML", importFilterItemFieldValueFromYAML as any)

registerTypeRule("FilterItemLocalStringTypeValue", "exportToXML", exportFilterItemLocalStringTypeToXML as any)
registerTypeRule("FilterItemLocalStringTypeValue", "importFromXML", importFilterItemLocalStringTypeFromXML as any)
registerTypeRule("FilterItemLocalStringTypeValue", "exportToYAML", exportFilterItemLocalStringTypeToYAML as any)
registerTypeRule("FilterItemLocalStringTypeValue", "importFromYAML", importFilterItemLocalStringTypeFromYAML as any)

// Alias для `dcsset:presentation` в FilterItem (тот же смысл/формат, что и LocalStringType).
registerTypeRule("FilterItemPresentationValue", "exportToXML", exportFilterItemLocalStringTypeToXML as any)
registerTypeRule("FilterItemPresentationValue", "importFromXML", importFilterItemLocalStringTypeFromXML as any)
registerTypeRule("FilterItemPresentationValue", "exportToYAML", exportFilterItemLocalStringTypeToYAML as any)
registerTypeRule("FilterItemPresentationValue", "importFromYAML", importFilterItemLocalStringTypeFromYAML as any)

const exportFilterItemPrimitiveValueToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: unknown
): DcsValueXml | undefined => {
  if (value === undefined) return undefined
  return exportDcsMetadataValueToDcsXML({ context, rule: primitiveRule as any, data: value as any })[
    "dcscor:value"
  ] as any
}

const importFilterItemPrimitiveValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: unknown
) => {
  if (xml === undefined) return undefined
  return importDcsMetadataValueFromDcsXML(context, primitiveRule as any, { "dcscor:value": xml as any }) as any
}

const exportFilterItemPrimitiveValueToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: unknown
) => exportDcsMetadataValueToYAML(context, primitiveRule as any, value as any)

const importFilterItemPrimitiveValueFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: unknown
) => importDcsMetadataValueFromYAML(context, primitiveRule as any, value as any)

registerTypeRule("FilterItemPrimitiveValue", "exportToXML", exportFilterItemPrimitiveValueToXML as any)
registerTypeRule("FilterItemPrimitiveValue", "importFromXML", importFilterItemPrimitiveValueFromXML as any)
registerTypeRule("FilterItemPrimitiveValue", "exportToYAML", exportFilterItemPrimitiveValueToYAML as any)
registerTypeRule("FilterItemPrimitiveValue", "importFromYAML", importFilterItemPrimitiveValueFromYAML as any)
