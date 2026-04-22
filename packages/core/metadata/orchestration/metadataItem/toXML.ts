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

  if (data === undefined || data === null) {
    return undefined
  }

  const result = exportPropertiesToXML({
    context,
    metadata: data,
    referenceMetadata: referenceData,
    rule,
    tag,
  })

  if (Object.keys(result).length === 0) return undefined

  let finalResult: ItemXML = result

  if (rule.xsiType) {
    finalResult = { "_xsi:type": rule.xsiType, ...result }
  }

  // Если правило содержит MetaDataObject-property, оборачиваем результат в
  // { MetaDataObject: { ...rootAttributes, [container]: result } }.
  const metaDataObjectProp = Object.values(rule.properties).find((p) => p.type === "MetaDataObject")
  if (metaDataObjectProp) {
    const container = (metaDataObjectProp as any).container as string
    const rootAttributes = (metaDataObjectProp as any).rootAttributes as Record<string, string>
    return { MetaDataObject: { ...rootAttributes, [container]: finalResult } }
  }

  return finalResult
}
