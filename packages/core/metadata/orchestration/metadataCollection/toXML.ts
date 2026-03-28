import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { MetadataItem, MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { ToMetadata } from "../metadataItem/registry"
import { exportPropertiesToXML } from "../property/toXML"
import { NamedElementXML } from "./types"

export const exportMetadataCollectionToXML = <Rule extends MetadataItemRule, XMLKey extends string>(params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule | undefined
  data: ToMetadata<Rule["itemType"]>[] | undefined
  referenceData?: ToMetadata<Rule["itemType"]>[]
  itemRule: Rule
  xmlElement: XMLKey
  keyField?: keyof Rule["properties"]
}): Record<XMLKey, NamedElementXML[]> | undefined => {
  const { context, data, referenceData, xmlElement, keyField, rule } = params

  const inputData = data ?? []
  if (inputData.length === 0) return undefined

  const result = inputData.map((item) => {
    const referenceItem = keyField ? findReferenceByKey(item, referenceData, keyField) : undefined

    const properties = exportPropertiesToXML({
      context,
      metadata: item as ToMetadata<Rule["itemType"]>,
      referenceMetadata: referenceItem as ToMetadata<Rule["itemType"]> | undefined,
      rule: rule,
    })

    context.exportToXML?.context?.metadataForNumbering.push({
      element: item as any,
      referenceElement: referenceItem as any,
      xmlElement: xmlItem,
    })

    return xmlItem
  })

  return { [xmlElement]: result } as Record<XMLKey, NamedElementXML[]>
}

const findReferenceByKey = <T extends MetadataItem>(
  item: T,
  referenceData: T[] | undefined,
  keyField: keyof T
): T | undefined => {
  if (!referenceData) return undefined
  return referenceData.find((refItem) => refItem[keyField] === item[keyField])
}
