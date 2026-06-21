import { YAMLStyleKey, asExplicitYAMLStringIfMarked } from "~/yaml/explicitString"

export const restoreExplicitMetadataValueYAMLString = (
  parent: unknown,
  key: YAMLStyleKey,
  value: unknown
): unknown => asExplicitYAMLStringIfMarked(parent, key, value)
