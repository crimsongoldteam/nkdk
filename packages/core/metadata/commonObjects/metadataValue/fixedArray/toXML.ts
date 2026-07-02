import { ConfigurationContext } from "../../../context/types"
import { exportMetadataValueToXML } from "../toXML"
import { MetadataFixedArrayValue, MetadataFixedArrayValueXML, MetadataValuePropertyRule } from "../types"

export const exportFixedArrayToXML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValue
): MetadataFixedArrayValueXML => {
  const rule: MetadataValuePropertyRule = { type: "MetadataValue" }
  const values = data.value.map((v) =>
    v === undefined ? { "_xsi:nil": true } : exportMetadataValueToXML({ context, rule, value: v })
  )
  return {
    "_xsi:type": "v8:FixedArray",
    "v8:Value": values.length === 1 ? values[0] : values,
  } as MetadataFixedArrayValueXML
}
