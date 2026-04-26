import { importMetadataItemFromYAML, MetadataItemRule } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"

type Params = {
  rule: MetadataItemRule
  yaml: unknown
  name?: string
}

export const importAppliedObjectFromYAML = <T>(params: Params): T | undefined => {
  return importMetadataItemFromYAML({
    context: mockContext,
    yaml: params.yaml as never,
    rule: params.rule,
    name: params.name,
  }) as T | undefined
}
