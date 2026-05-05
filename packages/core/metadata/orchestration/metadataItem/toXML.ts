import { getChildContextToXML } from "~/metadata/context/helpers"
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

  const itemName = typeof (data as any).name === "string" ? ((data as any).name as string) : undefined
  const effectiveContext: ConfigurationContextWithExportToXML = itemName
    ? getChildContextToXML({ context, itemType: rule.itemType, path: `${rule.itemType}.${itemName}`, name: itemName })
    : context

  const result = exportPropertiesToXML({
    context: effectiveContext,
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

  // Если правило содержит XMLRoot-property, оборачиваем результат:
  // - по умолчанию: { MetaDataObject: { ...rootAttributes, [container]: result } };
  // - при isFileRoot: { [container]: { ...rootAttributes, ...result } } (внешний файл).
  const xmlRootProp = Object.values(rule.properties).find((p) => p.type === "XMLRoot")
  if (xmlRootProp) {
    const container = (xmlRootProp as any).container as string
    const rootAttributes = (xmlRootProp as any).rootAttributes as Record<string, string>
    const isFileRoot = (xmlRootProp as any).isFileRoot === true
    if (isFileRoot) {
      return { [container]: { ...rootAttributes, ...(finalResult as Record<string, unknown>) } }
    }
    return { MetaDataObject: { ...rootAttributes, [container]: finalResult } }
  }

  return finalResult
}
