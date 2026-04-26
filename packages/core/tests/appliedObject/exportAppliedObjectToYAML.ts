import { exportMetadataItemToYAML, MetadataItemRule } from "~/metadata/orchestration"
import { mockContextToYAML } from "~/tests/mockContext"

type Params<T> = {
  rule: MetadataItemRule
  data: T | undefined
}

export const testExportAppliedObjectToYAML = <T>(params: Params<T>): unknown => {
  return exportMetadataItemToYAML({
    context: mockContextToYAML,
    data: params.data as never,
    rule: params.rule,
  })
}
