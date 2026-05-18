import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { DcsMetadataTypedValueRegistry } from "./rules"
import { DcsMetadataTypedValue, DcsMetadataTypedValuePropertyRule, DcsMetadataTypedValueYAML } from "./types"

const NIL_XML_ONLY_ERROR = "DcsMetadataTypedValue YAML: xsi:nil is XML-only"

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
): DcsMetadataTypedValueYAML | DcsMetadataTypedValueYAML[] | undefined => {
  if (value === undefined) return undefined
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item === undefined) throw new Error(NIL_XML_ONLY_ERROR)
      return exportSingle(context, rule, item)
    })
  }
  return exportSingle(context, rule, value)
}

const exportDcsMetadataTypedValueToYAMLForRule = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown
): DcsMetadataTypedValueYAML | DcsMetadataTypedValueYAML[] | undefined =>
  exportDcsMetadataTypedValueToYAML(
    context,
    rule as DcsMetadataTypedValuePropertyRule,
    value as DcsMetadataTypedValue | (DcsMetadataTypedValue | undefined)[]
  )

registerTypeRule("DcsMetadataTypedValue", "exportToYAML", exportDcsMetadataTypedValueToYAMLForRule)
