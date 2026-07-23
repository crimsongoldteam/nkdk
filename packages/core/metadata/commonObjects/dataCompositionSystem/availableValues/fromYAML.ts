import { ConfigurationContext } from "../../../context/types"
import { callAtomicFromYAML, PropertyRule, registerTypeRule } from "../../../orchestration"
import { restoreExplicitMetadataValueYAMLString } from "../../metadataValue/explicitYAMLString"
import { importDcsMetadataValueFromYAML } from "../dcsMetadataValue/fromYAML"
import type { DcsMetadataValuePropertyRule } from "../dcsMetadataValue/types"
import type { DcsAvailableValue, DcsAvailableValueYAML, DcsAvailableValues, DcsAvailableValuesYAML } from "./types"

const valueRule = {
  type: "MetadataDcsMetadataValue",
  valueType: "Primitive",
} as const satisfies DcsMetadataValuePropertyRule
const presentationRule = { type: "DcsLocalStringType" } as const

export const importDcsAvailableValuesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: DcsAvailableValuesYAML | undefined
): DcsAvailableValues | undefined => {
  if (yaml === undefined) return undefined

  return yaml.map((item): DcsAvailableValue => {
    const value = importDcsMetadataValueFromYAML(
      context,
      valueRule,
      restoreExplicitMetadataValueYAMLString(item, "Значение", item.Значение) as DcsAvailableValueYAML["Значение"]
    )
    const presentation = callAtomicFromYAML({
      context,
      rule: presentationRule,
      value: item.Представление,
    }) as DcsAvailableValue["presentation"]

    return {
      itemType: "DcsAvailableValue",
      ...(value !== undefined && value !== null ? { value } : {}),
      ...(presentation !== undefined ? { presentation } : {}),
    }
  })
}

registerTypeRule("DcsAvailableValues", "importFromYAML", importDcsAvailableValuesFromYAML)
