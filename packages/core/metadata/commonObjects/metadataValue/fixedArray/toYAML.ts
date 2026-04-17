import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataValueToYAML } from "../toYAML"
import { MetadataFixedArrayValue, MetadataFixedArrayValueYAML, MetadataTypedValue } from "../types"

export const exportFixedArrayToYAML = (
  context: ConfigurationContext,
  data: MetadataFixedArrayValue
): MetadataFixedArrayValueYAML =>
  data.value.map(
    (v) => exportMetadataValueToYAML(context, undefined, v as MetadataTypedValue)!
  ) as MetadataFixedArrayValueYAML
