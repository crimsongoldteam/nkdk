import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportPropertiesToXML } from "../property/toXML"
import { ItemXML, MetadataItemRule } from "../property/types"
import { ToMetadata } from "./registry"

export const exportMetadataItemToXML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextWithExportToXML
  data: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
  referenceData?: ToMetadata<Rule["itemType"]> | undefined
  tag?: string[]
}): ItemXML => {
  const { context, data, rule, referenceData, tag } = params

  return exportPropertiesToXML({
    context,
    metadata: data ? ({ ...data, itemType: rule.itemType } as ToMetadata<Rule["itemType"]>) : undefined,
    referenceMetadata: referenceData
      ? ({ ...referenceData, itemType: rule.itemType } as ToMetadata<Rule["itemType"]>)
      : undefined,
    rule,
    tag,
  })
}
