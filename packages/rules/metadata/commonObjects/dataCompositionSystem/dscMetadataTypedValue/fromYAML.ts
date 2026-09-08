import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { ConfigurationContext } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { DcsMetadataTypedValueRegistry } from "./rules"
import {
  DcsMetadataTypedValue,
  DcsMetadataTypedValueArrayItemYAML,
  DcsMetadataTypedValuePropertyRule,
  DcsMetadataTypedValueYAML,
} from "./types"

const isNilArrayItemYAML = (value: DcsMetadataTypedValueArrayItemYAML): value is Record<string, never> =>
  typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0

const detectTypeFromYAML = (
  context: ConfigurationContext,
  value: DcsMetadataTypedValueYAML,
): DcsMetadataTypedValue["type"] => {
  if (typeof value === "string" && value.startsWith(".")) return "Field"
  if (typeof value === "number") return "decimal"
  if (value === "Истина" || value === "Ложь") return "boolean"
  if (value === "Порядок") return "Order"
  if (value === "СписокЗначений") return "EmptyValueList"
  if (typeof value === "object" && value !== null && !Array.isArray(value) && "Вариант" in value)
    return "StandardBeginningDate"
  if (typeof value === "string" && value.startsWith("'") && value.endsWith("'")) return "string"
  if (DcsMetadataTypedValueRegistry.dateTime.detect({ context, yaml: value })) return "dateTime"
  if (DcsMetadataTypedValueRegistry.DesignTimeValue.detect({ context, yaml: value })) return "DesignTimeValue"
  if (DcsMetadataTypedValueRegistry.string.detect({ context, yaml: value })) return "string"

  throw new Error(`DcsMetadataTypedValue YAML: unsupported value ${JSON.stringify(value)}`)
}

const importSingle = (
  context: ConfigurationContext,
  rule: DcsMetadataTypedValuePropertyRule,
  value: DcsMetadataTypedValueYAML,
): DcsMetadataTypedValue => {
  const type = detectTypeFromYAML(context, value)

  if (type === "string" && typeof value === "string" && value.startsWith("'") && value.endsWith("'")) {
    return { type: "string", value: value.slice(1, -1) }
  }

  const imported = DcsMetadataTypedValueRegistry[type].fromYAML({ context, rule, yaml: value })

  if (imported.type === "Field") {
    return { type: "Field", value: imported.value.startsWith(".") ? imported.value.slice(1) : imported.value }
  }

  if (imported.type === "DesignTimeValue" && typeof value === "string") {
    return { type: "DesignTimeValue", value }
  }

  return imported
}

export const importDcsMetadataTypedValueFromYAML = (
  context: ConfigurationContext,
  rule: DcsMetadataTypedValuePropertyRule,
  value: DcsMetadataTypedValueYAML | DcsMetadataTypedValueArrayItemYAML[] | undefined,
): DcsMetadataTypedValue | (DcsMetadataTypedValue | undefined)[] | undefined => {
  if (value === undefined) return undefined
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (isNilArrayItemYAML(item)) return undefined
      return importSingle(context, rule, item)
    })
  }
  return importSingle(context, rule, value)
}

const importDcsMetadataTypedValueFromYAMLForRule = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown,
): DcsMetadataTypedValue | (DcsMetadataTypedValue | undefined)[] | undefined =>
  importDcsMetadataTypedValueFromYAML(
    context,
    rule as DcsMetadataTypedValuePropertyRule,
    value as DcsMetadataTypedValueYAML | DcsMetadataTypedValueArrayItemYAML[],
  )

export const metadataPropertyRule000 = definePropertyTypeRule("DcsMetadataTypedValue", "importFromYAML", importDcsMetadataTypedValueFromYAMLForRule)
