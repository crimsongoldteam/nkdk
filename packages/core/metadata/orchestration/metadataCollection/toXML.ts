import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { ToMetadata } from "../metadataItem/registry"
import { exportMetadataItemToXML } from "../metadataItem/toXML"
import { NamedElementXML } from "./types"

export const exportMetadataCollectionToXML = <Rule extends MetadataItemRule, XMLKey extends string>(params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule | undefined
  data: ToMetadata<Rule["itemType"]>[] | undefined
  referenceData?: ToMetadata<Rule["itemType"]>[]
  itemRule: Rule
  xmlElement?: XMLKey
  keyField?: keyof Rule["properties"]
}): Record<XMLKey, NamedElementXML[]> | NamedElementXML[] | undefined => {
  const { context, data, referenceData, xmlElement, keyField, itemRule } = params
  type Item = ToMetadata<Rule["itemType"]>

  const inputData =
    data != null && data.length > 0
      ? data
      : referenceData != null && referenceData.length > 0
        ? referenceData
        : []
  if (inputData.length === 0) return undefined

  const result = inputData.map((item) => {
    const referenceItem = keyField ? findReferenceByKey<Item>(item, referenceData, keyField as keyof Item) : undefined

    const result = exportMetadataItemToXML({
      context,
      data: item,
      rule: itemRule,
      referenceData: referenceItem,
    })

    return result
  })

  if (xmlElement === undefined) return result as NamedElementXML[]
  return { [xmlElement]: result } as Record<XMLKey, NamedElementXML[]>
}

const findReferenceByKey = <T extends object>(
  item: T,
  referenceData: T[] | undefined,
  keyField: keyof T
): T | undefined => {
  if (!referenceData) return undefined
  return referenceData.find((refItem) => refItem[keyField] === item[keyField])
}
