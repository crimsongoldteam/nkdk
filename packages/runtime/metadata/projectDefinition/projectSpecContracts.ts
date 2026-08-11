import type { TSchema } from "typebox"
import type {
  ConfigurationContext,
  JSONSchemaExportMode,
} from "../context/types"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import type { PropertyRuleExecution } from "../ruleRuntime/property/fn"
import type { MetadataResourceTopologySpec } from "../resourceTopology/core/types"

export interface RegisteredProjectSpec extends MetadataResourceTopologySpec {
  dir: string
  kind: string
  rule: MetadataItemRule
  exportSchema: (params: {
    context: ConfigurationContext
    mode?: JSONSchemaExportMode
    name?: string
    execution?: PropertyRuleExecution
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
