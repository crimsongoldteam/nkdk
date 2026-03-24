import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "../formElement/factory"
import { ToMetadata } from "../metadataItem/registry"
import { exportPropertiesToXML } from "../property/toXML"
import { NamedElementXML, NamedMetadataItem } from "./types"

export const registerExportToXML = <
  Rule extends MetadataItemRule,
  CollectionType extends PropertyRuleType,
  XMLKey extends string,
>(
  propertyType: CollectionType,
  itemRule: Rule,
  xmlElement: XMLKey,
  extendDataForExportToXML?: (params: {
    data: (ToMetadata<Rule["itemType"]> & NamedMetadataItem)[]
    rule: PropertyRule | undefined
  }) => (ToMetadata<Rule["itemType"]> & NamedMetadataItem)[],
  omitIdAttributeInXML?: boolean
): void => {
  registerTypeRule(
    propertyType,
    "exportToXML",
    (
      context: ConfigurationContextWithExportToXML,
      _rule: PropertyRule | undefined,
      data: (ToMetadata<Rule["itemType"]> & NamedMetadataItem)[] | undefined,
      referenceData?: (ToMetadata<Rule["itemType"]> & NamedMetadataItem)[] | undefined
    ): Record<XMLKey, NamedElementXML[]> | undefined => {
      const inputData = data ?? []
      const extendedData = extendDataForExportToXML ? extendDataForExportToXML({ data: inputData, rule: _rule }) : inputData
      if (extendedData.length === 0) return undefined

      const result = extendedData.map((item) => {
        const referenceItem = findReferenceByName(item, referenceData)
        const properties = exportPropertiesToXML({
          context,
          metadata: item as ToMetadata<Rule["itemType"]>,
          referenceMetadata: referenceItem as ToMetadata<Rule["itemType"]> | undefined,
          rule: itemRule,
        })
        const { Name: _skipName, ...rest } = properties as Record<string, unknown>

        const xmlItem: NamedElementXML = omitIdAttributeInXML
          ? {
              _name: item.name,
              ...rest,
            }
          : {
              _name: item.name,
              _id: "",
              ...rest,
            }

        context.exportToXML?.context?.metadataForNumbering.push({
          element: item as any,
          referenceElement: referenceItem as any,
          xmlElement: xmlItem,
        })

        return xmlItem
      })

      return { [xmlElement]: result } as Record<XMLKey, NamedElementXML[]>
    }
  )
}

const findReferenceByName = <T extends NamedMetadataItem>(item: T, referenceData: T[] | undefined): T | undefined => {
  if (!referenceData) return undefined
  return referenceData.find((refItem) => refItem.name === item.name)
}
