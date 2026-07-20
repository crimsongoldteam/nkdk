import { ConfigurationContextWithExportToXML } from "../../context/types"
import { childUid, indexedUid, yamlIndexUid, yamlKeyUid } from "../../configurationIndex/logicalAddress"
import { withConfigurationIndexExportLogicalAddress } from "../../configurationIndex/referenceView"
import type { ConfigurationIndexAddressingMode } from "../property/types"
import type { ItemXML, MetadataItemRule, PropertyRule } from "../property/types"
import type { PropertyRuleType } from "../property/registry"
import { ToMetadata } from "../metadataItem/registry"
import { exportMetadataItemToXML } from "../metadataItem/toXML"
import type { NamedElementXML, NamedMetadataItem } from "./types"

interface MetadataCollectionConfigurationIndexOptions {
  propertyType: PropertyRuleType
  configurationIndexUidSegment?: string
  configurationIndexAddressing?: ConfigurationIndexAddressingMode
  yamlAsArray?: true
}

const configurationIndexOptionsByPropertyType = new Map<PropertyRuleType, MetadataCollectionConfigurationIndexOptions>()

export function registerMetadataCollectionConfigurationIndexOptions(
  options: MetadataCollectionConfigurationIndexOptions
): void {
  configurationIndexOptionsByPropertyType.set(options.propertyType, options)
}

export const exportMetadataCollectionToXML = <Rule extends MetadataItemRule, XMLKey extends string>(params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule | undefined
  data: ToMetadata<Rule["itemType"]>[] | undefined
  referenceData?: ToMetadata<Rule["itemType"]>[]
  itemRule: Rule
  xmlElement?: XMLKey
  keyField?: keyof Rule["properties"]
  propertyType?: PropertyRuleType
  configurationIndexUidSegment?: string
  configurationIndexAddressing?: ConfigurationIndexAddressingMode
  yamlAsArray?: true
}):
  | Record<XMLKey, Array<ItemXML | NamedElementXML | string>>
  | Array<ItemXML | NamedElementXML | string>
  | undefined => {
  const { context, data, referenceData, xmlElement, keyField, itemRule } = params
  const configurationIndexOptions = metadataCollectionConfigurationIndexOptions(params)
  type Item = ToMetadata<Rule["itemType"]>

  const inputData =
    data != null && data.length > 0 ? data : referenceData != null && referenceData.length > 0 ? referenceData : []
  if (inputData.length === 0) return undefined

  const result = inputData.map((item, index) => {
    if (typeof item === "string") return item

    const referenceItem = keyField
      ? findReferenceByKey<Item>(item, referenceData, keyField as keyof Item)
      : referenceData?.[index]

    const exported = exportMetadataItemToXML({
      context: configurationIndexItemContext({
        context,
        item,
        itemRule,
        index,
        keyField,
        options: configurationIndexOptions,
      }),
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

function configurationIndexItemContext(params: {
  context: ConfigurationContextWithExportToXML
  item: unknown
  itemRule: MetadataItemRule
  index: number
  keyField?: string | number | symbol
  options: MetadataCollectionConfigurationIndexOptions & {
    configurationIndexUidSegment?: string
    configurationIndexAddressing?: ConfigurationIndexAddressingMode
    yamlAsArray?: true
  }
}): ConfigurationContextWithExportToXML {
  const runtime = params.context.exportToXML.configurationIndex
  if (runtime === undefined || typeof params.item !== "object" || params.item === null) return params.context

  const item = params.item as Partial<NamedMetadataItem> & Record<PropertyKey, unknown>
  const itemName = configurationIndexItemName(item, params.keyField)
  const registeredUidSegment = params.options.configurationIndexUidSegment ?? runtime.childCollectionUidSegment
  const useYamlPath = runtime.yamlPathAddressing === true || params.options.configurationIndexAddressing === "yamlPath"

  if (useYamlPath) {
    return withConfigurationIndexExportLogicalAddress(
      params.context,
      params.options.yamlAsArray === true || itemName === undefined
        ? yamlIndexUid(runtime.logicalAddress, params.index)
        : yamlKeyUid(runtime.logicalAddress, itemName)
    )
  }

  if (registeredUidSegment !== undefined && itemName === undefined) {
    throw new Error(
      `Адресуемая metadata-item коллекция ${params.options.propertyType ?? params.itemRule.itemType} содержит элемент без имени`
    )
  }

  if (registeredUidSegment === undefined) return params.context

  return withConfigurationIndexExportLogicalAddress(
    params.context,
    itemName === undefined
      ? indexedUid(runtime.logicalAddress, registeredUidSegment, params.index)
      : childUid(runtime.logicalAddress, registeredUidSegment, itemName)
  )
}

function metadataCollectionConfigurationIndexOptions(params: {
  rule: PropertyRule | undefined
  propertyType?: PropertyRuleType
  configurationIndexUidSegment?: string
  configurationIndexAddressing?: ConfigurationIndexAddressingMode
  yamlAsArray?: true
}): MetadataCollectionConfigurationIndexOptions {
  const propertyType = params.propertyType ?? params.rule?.type
  const registered = propertyType === undefined ? undefined : configurationIndexOptionsByPropertyType.get(propertyType)
  return {
    propertyType: propertyType ?? registered?.propertyType ?? "<unknown>",
    ...(registered?.configurationIndexUidSegment === undefined && params.configurationIndexUidSegment === undefined
      ? {}
      : { configurationIndexUidSegment: params.configurationIndexUidSegment ?? registered?.configurationIndexUidSegment }),
    ...(registered?.configurationIndexAddressing === undefined && params.configurationIndexAddressing === undefined
      ? {}
      : { configurationIndexAddressing: params.configurationIndexAddressing ?? registered?.configurationIndexAddressing }),
    ...(params.yamlAsArray === true || registered?.yamlAsArray === true ? { yamlAsArray: true as const } : {}),
  }
}

function configurationIndexItemName(
  item: Partial<NamedMetadataItem> & Record<PropertyKey, unknown>,
  keyField: string | number | symbol | undefined
): string | undefined {
  if (typeof item.name === "string" && item.name.length > 0) return item.name
  if (keyField !== undefined) {
    const keyValue = item[keyField]
    if (typeof keyValue === "string" && keyValue.length > 0) return keyValue
  }
  return undefined
}

const findReferenceByKey = <T extends object>(
  item: T,
  referenceData: T[] | undefined,
  keyField: keyof T
): T | undefined => {
  if (!referenceData) return undefined
  return referenceData.find((refItem) => refItem[keyField] === item[keyField])
}
