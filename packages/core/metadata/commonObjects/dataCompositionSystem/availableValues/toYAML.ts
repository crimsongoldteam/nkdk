import { ConfigurationContext } from "../../../context/types"
import { exportPropertyToYAML, PropertyRule, registerTypeRule } from "../../../orchestration"
import { exportDcsMetadataValueToYAML } from "../dcsMetadataValue/toYAML"
import type { DcsMetadataValuePropertyRule } from "../dcsMetadataValue/types"
import type { DcsAvailableValues, DcsAvailableValuesYAML } from "./types"

const valueRule = {
  type: "MetadataDcsMetadataValue",
  valueType: "Primitive",
} as const satisfies DcsMetadataValuePropertyRule
const presentationRule = { type: "DcsLocalStringType", yaml: "Представление" } as const

export const exportDcsAvailableValuesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  values: DcsAvailableValues | undefined
): DcsAvailableValuesYAML | undefined => {
  if (values === undefined) return undefined

  return values.map((item) => {
    const value = exportDcsMetadataValueToYAML(context, valueRule, item.value)
    const presentation =
      item.presentation === undefined
        ? undefined
        : exportPropertyToYAML({ context, rule: presentationRule, value: item.presentation })?.Представление

    return {
      ...(value !== undefined ? { Значение: value } : {}),
      ...(presentation !== undefined ? { Представление: presentation } : {}),
    }
  })
}

registerTypeRule("DcsAvailableValues", "exportToYAML", exportDcsAvailableValuesToYAML)
