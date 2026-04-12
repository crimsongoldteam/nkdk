import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { DcsMetadataTypedValueRegistry } from "./rules"
import { DcsMetadataTypedValue, DcsMetadataTypedValuePropertyRule, DcsMetadataTypedValueYAML } from "./types"

const detectTypeFromYAML = (context: ConfigurationContext, value: DcsMetadataTypedValueYAML): DcsMetadataTypedValue["type"] => {
  if (typeof value === "string" && value.startsWith(".")) return "Field"
  if (typeof value === "number") return "decimal"
  if (value === "Истина" || value === "Ложь") return "boolean"
  if (typeof value === "object" && value !== null && !Array.isArray(value) && "Вариант" in value)
    return "StandardBeginningDate"
  if (typeof value === "string" && value.startsWith("'") && value.endsWith("'")) return "string"
  if (DcsMetadataTypedValueRegistry.DesignTimeValue.detect({ context, yaml: value })) return "DesignTimeValue"
  if (DcsMetadataTypedValueRegistry.string.detect({ context, yaml: value })) return "string"

  throw new Error(`DcsMetadataTypedValue YAML: unsupported value ${JSON.stringify(value)}`)
}

export const importDcsMetadataTypedValueFromYAML = (
  context: ConfigurationContext,
  rule: DcsMetadataTypedValuePropertyRule,
  value: DcsMetadataTypedValueYAML | undefined
): DcsMetadataTypedValue | undefined => {
  if (value === undefined) return undefined

  const type = detectTypeFromYAML(context, value)
  const imported = DcsMetadataTypedValueRegistry[type].fromYAML({ context, rule, yaml: value })

  if (imported.type === "Field") {
    return { type: "Field", value: imported.value.startsWith(".") ? imported.value.slice(1) : imported.value }
  }

  if (imported.type === "DesignTimeValue" && typeof value === "string") {
    return { type: "DesignTimeValue", value }
  }

  if (imported.type === "string" && typeof value === "string" && value.startsWith("'") && value.endsWith("'")) {
    return { type: "string", value: value.slice(1, -1) }
  }

  return imported
}

const importDcsMetadataTypedValueFromYAMLForRule = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown
): DcsMetadataTypedValue | undefined =>
  importDcsMetadataTypedValueFromYAML(
    context,
    rule as DcsMetadataTypedValuePropertyRule,
    value as DcsMetadataTypedValueYAML
  )

registerTypeRule("DcsMetadataTypedValue", "importFromYAML", importDcsMetadataTypedValueFromYAMLForRule)
