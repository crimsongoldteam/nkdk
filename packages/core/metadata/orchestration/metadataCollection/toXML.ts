import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import type { ItemXML, MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { ToMetadata } from "../metadataItem/registry"
import { exportMetadataItemToXML } from "../metadataItem/toXML"
import type { NamedElementXML } from "./types"

export const exportMetadataCollectionToXML = <Rule extends MetadataItemRule, XMLKey extends string>(params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule | undefined
  data: ToMetadata<Rule["itemType"]>[] | undefined
  referenceData?: ToMetadata<Rule["itemType"]>[]
  itemRule: Rule
  xmlElement?: XMLKey
  keyField?: keyof Rule["properties"]
}): Record<XMLKey, Array<ItemXML | NamedElementXML | string>> | Array<ItemXML | NamedElementXML | string> | undefined => {
  const { context, data, referenceData, xmlElement, keyField, itemRule } = params
  type Item = ToMetadata<Rule["itemType"]>

  const inputData =
    data != null && data.length > 0
      ? data
      : referenceData != null && referenceData.length > 0
        ? referenceData
        : []
  if (inputData.length === 0) return undefined

  const result = inputData.map((item, index) => {
    if (typeof item === "string") return item

    const referenceItem = keyField
      ? findReferenceByKey<Item>(item, referenceData, keyField as keyof Item)
      : referenceData?.[index]

    const exported = exportMetadataItemToXML({
      context,
      data: item,
      rule: itemRule,
      referenceData: referenceItem,
    })

    // Элемент коллекции без собственных свойств всё равно должен сохранить тег-обёртку.
    return exported ?? ({} as NamedElementXML)
  })

  if (xmlElement === undefined) return result
  return { [xmlElement]: result } as Record<XMLKey, Array<NamedElementXML | string>>
}

const findReferenceByKey = <T extends object>(
  item: T,
  referenceData: T[] | undefined,
  keyField: keyof T
): T | undefined => {
  if (!referenceData) return undefined
  return referenceData.find((refItem) => refItem[keyField] === item[keyField])
}
