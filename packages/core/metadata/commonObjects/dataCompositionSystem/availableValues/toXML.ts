import { ConfigurationContext } from "../../../context/types"
import { PropertyRule, registerTypeRule } from "../../../orchestration"
import { exportDcsLocalStringTypeToXML } from "../dcsLocalStringType/toXML"
import { exportDcsMetadataValueToDcsXML } from "../dcsMetadataValue/toXML"
import type { DcsMetadataValuePropertyRule } from "../dcsMetadataValue/types"
import type { DcsAvailableValues } from "./types"

const valueRule = {
  type: "MetadataDcsMetadataValue",
  valueType: "Primitive",
} as const satisfies DcsMetadataValuePropertyRule

export const exportDcsAvailableValuesToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  values: DcsAvailableValues | undefined,
  referenceMetadata?: DcsAvailableValues
): unknown[] | undefined => {
  if (!values || values.length === 0) return undefined

  return values.map((item, index) => {
    const referenceItem = referenceMetadata?.[index]
    const valueXML =
      item.value === undefined
        ? { "_xsi:nil": true }
        : exportDcsMetadataValueToDcsXML({ context, rule: valueRule, data: item.value })["dcscor:value"]
    const presentationXML = exportDcsLocalStringTypeToXML(
      context,
      { type: "DcsLocalStringType" },
      item.presentation,
      referenceItem?.presentation
    )

    return {
      "dcssch:value": valueXML,
      ...(presentationXML !== undefined ? { "dcssch:presentation": presentationXML } : {}),
    }
  })
}

registerTypeRule("DcsAvailableValues", "exportToXML", exportDcsAvailableValuesToXML)
