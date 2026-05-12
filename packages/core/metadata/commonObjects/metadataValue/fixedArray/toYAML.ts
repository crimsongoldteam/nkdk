import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataValueToYAML } from "../toYAML"
import { MetadataFixedArrayValue, MetadataFixedArrayValueYAML } from "../types"

export const exportFixedArrayToYAML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValue
): MetadataFixedArrayValueYAML =>
  data.value.map(
    (v) => (v === undefined ? undefined : exportMetadataValueToYAML(context, undefined, v)!)
  ) as MetadataFixedArrayValueYAML
