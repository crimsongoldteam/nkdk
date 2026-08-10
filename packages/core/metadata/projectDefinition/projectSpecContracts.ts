import type { TSchema } from "typebox"
import type {
  ConfigurationContext,
  JSONSchemaExportMode,
} from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { MetadataResourceTopologySpec } from "@nkdk/runtime/rule-kit"

export interface RegisteredProjectSpec extends MetadataResourceTopologySpec {
  dir: string
  kind: string
  rule: MetadataItemRule
  exportSchema: (params: {
    context: ConfigurationContext
    mode?: JSONSchemaExportMode
    name?: string
  }) => TSchema
  nesting?: ProjectSpecNesting
}

export type ProjectSpecNesting = {
  kind: "recursiveChildDir"
  childDir: string
  itemRole: string
  collectionRole: string
  logicalAddressSegment: string
}
