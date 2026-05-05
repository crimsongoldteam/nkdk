import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataValueToXML } from "../toXML"
import { MetadataFixedArrayValue, MetadataFixedArrayValueXML, MetadataTypedValue, MetadataValuePropertyRule } from "../types"

export const exportFixedArrayToXML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValue
): MetadataFixedArrayValueXML => {
  const rule: MetadataValuePropertyRule = { type: "MetadataValue" }
  const values = data.value.map((v) => exportMetadataValueToXML({ context, rule, value: v as MetadataTypedValue }))
  return {
    "_xsi:type": "v8:FixedArray",
    "v8:Value": values.length === 1 ? values[0] : values,
  } as MetadataFixedArrayValueXML
}
