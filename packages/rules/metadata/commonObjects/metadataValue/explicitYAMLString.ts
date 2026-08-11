import { YAMLStyleKey, asExplicitYAMLStringIfMarked } from "@nkdk/runtime"

export const restoreExplicitMetadataValueYAMLString = (parent: unknown, key: YAMLStyleKey, value: unknown): unknown =>
  asExplicitYAMLStringIfMarked(parent, key, value)
