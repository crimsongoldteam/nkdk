import { ConfigurationContext } from "../../../context/types"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { PropertyRule } from "../../../orchestration/property/types"
import { DcsMetadataTypedValueRegistry } from "./rules"
import {
  DcsMetadataTypedValue,
  DcsMetadataTypedValueArrayItemYAML,
  DcsMetadataTypedValuePropertyRule,
  DcsMetadataTypedValueYAML,
} from "./types"

const exportSingle = (
  context: ConfigurationContext,
  rule: DcsMetadataTypedValuePropertyRule,
  value: DcsMetadataTypedValue
): DcsMetadataTypedValueYAML => {
  const exported = DcsMetadataTypedValueRegistry[value.type].toYAML({ context, rule, item: value })

  if (value.type === "Field" && typeof exported === "string") {
    return exported.startsWith(".") ? exported : `.${exported}`
  }

  if (value.type === "string" && typeof exported === "string") {
    return exported.startsWith("'") && exported.endsWith("'") ? exported : `'${exported}'`
  }

  return exported
}

export const exportDcsMetadataTypedValueToYAML = (
  context: ConfigurationContext,
  rule: DcsMetadataTypedValuePropertyRule,
  value: DcsMetadataTypedValue | (DcsMetadataTypedValue | undefined)[] | undefined
): DcsMetadataTypedValueYAML | DcsMetadataTypedValueArrayItemYAML[] | undefined => {
  if (value === undefined) return undefined
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item === undefined) return {}
      return exportSingle(context, rule, item)
    })
  }
  return exportSingle(context, rule, value)
}

const exportDcsMetadataTypedValueToYAMLForRule = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown
): DcsMetadataTypedValueYAML | DcsMetadataTypedValueArrayItemYAML[] | undefined =>
  exportDcsMetadataTypedValueToYAML(
    context,
    rule as DcsMetadataTypedValuePropertyRule,
    value as DcsMetadataTypedValue | (DcsMetadataTypedValue | undefined)[]
  )

registerTypeRule("DcsMetadataTypedValue", "exportToYAML", exportDcsMetadataTypedValueToYAMLForRule)
