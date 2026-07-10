import { ConfigurationContextFromXML } from "../../../context/types"
import { importMetadataValueFromXML } from "../fromXML"
import { MetadataFixedArrayValue, MetadataFixedArrayValueXML } from "../types"

export const importFixedArrayFromXML = (
  context: ConfigurationContextFromXML,
  data: MetadataFixedArrayValueXML | { "v8:Value": unknown | unknown[] }
): MetadataFixedArrayValue => {
  const raw = data["v8:Value"]
  const values = Array.isArray(raw) ? raw : [raw]
  return {
    type: "fixedArray",
    value: values.map((v) =>
      typeof v === "object" && v !== null && "_xsi:nil" in v && v["_xsi:nil"] === true
        ? undefined
        : importMetadataValueFromXML({ context, rule: undefined, value: v })!
    ),
  }
}
