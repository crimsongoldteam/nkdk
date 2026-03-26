import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { DcsMetadataTypedValueRegistry } from "./rules"
import { DcsMetadataTypedValue, DcsMetadataTypedValuePropertyRule, DcsMetadataTypedValueYAML } from "./types"

export const exportDcsMetadataTypedValueToYAML = (
  context: ConfigurationContext,
  rule: DcsMetadataTypedValuePropertyRule,
  value: DcsMetadataTypedValue | undefined
): DcsMetadataTypedValueYAML | undefined => {
  if (value === undefined) return undefined
  const exported = DcsMetadataTypedValueRegistry[value.type].toYAML({ context, rule, item: value })

  if (value.type === "Field" && typeof exported === "string") {
    return exported.startsWith(".") ? exported : `.${exported}`
  }

  if (value.type === "string" && typeof exported === "string") {
    return exported.startsWith("'") && exported.endsWith("'") ? exported : `'${exported}'`
  }

  return exported
}

const exportDcsMetadataTypedValueToYAMLForRule = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown
): DcsMetadataTypedValueYAML | undefined =>
  exportDcsMetadataTypedValueToYAML(
    context,
    rule as DcsMetadataTypedValuePropertyRule,
    value as DcsMetadataTypedValue
  )

registerTypeRule("DcsMetadataTypedValue", "exportToYAML", exportDcsMetadataTypedValueToYAMLForRule)
