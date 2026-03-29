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
}): ItemXML | undefined => {
  const { context, data, rule, referenceData, tag } = params

  const result = exportPropertiesToXML({
    context,
    metadata: data,
    referenceMetadata: referenceData,
    rule,
    tag,
  })

  if (Object.keys(result).length === 0) return undefined

  return result
}
