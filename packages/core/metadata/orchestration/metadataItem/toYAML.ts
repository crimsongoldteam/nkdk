import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertiesToYAML } from "../property/toYAML"
import { MetadataItemRule } from "../property/types"
import { ToMetadata, ToYAML } from "./registry"

export const exportMetadataItemToYAML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  data: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
}): ToYAML<Rule["itemType"]> | undefined => {
  const { context, data, rule } = params
  if (!data) return undefined

  return exportPropertiesToYAML({
    context,
    data: { ...data, itemType: rule.itemType } as ToMetadata<Rule["itemType"]>,
    rule,
  })
}
