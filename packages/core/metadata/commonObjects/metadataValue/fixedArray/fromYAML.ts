import { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataValueFromYAML } from "../fromYAML"
import { MetadataFixedArrayValue, MetadataFixedArrayValueYAML } from "../types"

export const importFixedArrayFromYAML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValueYAML
): MetadataFixedArrayValue => ({
  type: "fixedArray",
  value: data.map((v) => importMetadataValueFromYAML(context, undefined, v)!),
})
