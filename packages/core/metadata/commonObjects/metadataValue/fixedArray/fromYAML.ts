import { ConfigurationContext } from "~/metadata/context/types"
import { asExplicitYAMLStringIfMarked } from "~/yaml/explicitString"
import { importMetadataValueFromYAML } from "../fromYAML"
import { MetadataFixedArrayValue, MetadataFixedArrayValueYAMLInput } from "../types"

export const importFixedArrayFromYAML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValueYAMLInput
): MetadataFixedArrayValue => ({
  type: "fixedArray",
  value: data.map((v, index) => {
    if (v === undefined || v === null) return undefined
    return importMetadataValueFromYAML(
      context,
      undefined,
      asExplicitYAMLStringIfMarked(data, index, v) as Exclude<MetadataFixedArrayValueYAMLInput[number], null>
    )!
  }),
})
