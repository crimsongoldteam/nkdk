import { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataValueFromYAML } from "../fromYAML"
import { MetadataFixedArrayValue, MetadataFixedArrayValueYAMLInput } from "../types"

export const importFixedArrayFromYAML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValueYAMLInput
): MetadataFixedArrayValue => ({
  type: "fixedArray",
  value: data.map((v) => {
    if (v === undefined || v === null) return undefined
    return importMetadataValueFromYAML(context, undefined, v)!
  }),
})
