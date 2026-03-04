import { FormattedI8nTextPropertyRule } from "~/metadata/commonObjects/formattedI8nText/types"
import { I8nTextPropertyRule } from "~/metadata/commonObjects/i8nText/types"
import { StandartAttributeName } from "~/metadata/commonObjects/standardAttributeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { TableAdditionalSourceTypes } from "~/metadata/forms/commonObjects/tableAdditionalSource/types"
import { EventsRules } from "../event"
import { MetadataItemType } from "../metadataItem/registry"
import { PropertyRuleType } from "./registry"

export interface MetadataItem {
  itemType: MetadataItemType
}

type DefaultValueFunction = (params: { context: ConfigurationContext; name?: string }) => any

export interface BasePropertyRule {
  type: PropertyRuleType

  /**
   * Название ключа в yaml
   */
  yaml?: string
  /**
   * Название в xml, если не заполнено - будет использован ключ
   */
  xml?: string

  /**
   * Передавать значение в форму в 1С
   */
  toEnterprise?: false
  fromEnterprise?: false
  toPartialYAML?: false
  fromXML?: false
  fromYAML?: false
  defaultValue?: any | DefaultValueFunction
  defaultValueXML?: any

  /**
   * Родительские элементы в xml
   */
  xmlParents?: string[]
  /**
   * Теги, по которым будет выгружаться свойство
   */
  tag?: string

  /**
   * Если все поля пустые - это поле будет выгружено как значение
   */
  useAsShortValueYAML?: true
}

export interface ChildItemsPropertyRule extends BasePropertyRule {
  type: "ChildItems"
  defaultValue: []
  fromPartialYAML?: true
}

export interface SystemEnumerationPropertyRule extends BasePropertyRule {
  type: "SystemEnumeration"
  typeSE: string
}

export interface UserVisiblePropertyRule extends BasePropertyRule {
  type: "UserVisible"
  yaml: string
  yamlDeny: string
}

export interface StandardAttributeDescriptionPropertyRule extends BasePropertyRule {
  type: "StandardAttributeDescription"
  standartAttributeNames: StandartAttributeName[]
}

export interface TableAdditionalSourcePropertyRule extends BasePropertyRule {
  type: "TableAdditionalSource"
  additionalSourceType: TableAdditionalSourceTypes
  forSingleElement?: true
}

export interface TypeDescriptionPropertyRule extends BasePropertyRule {
  type: "TypeDescription"
  addTypeDescriptionAttributeToXML?: true
}

export interface DataPathPropertyRule extends BasePropertyRule {
  type: "DataPath"
  defaultType: string
}

export interface MetadataTypePropertyRule extends BasePropertyRule {
  type: "MetadataType" | "MetadataTypeCollection"
  typeValue: string
}

export interface CleanPropertyRule extends BasePropertyRule {
  type: Exclude<
    PropertyRuleType,
    | "SystemEnumeration"
    | "I8nText"
    | "FormattedI8nText"
    | "UserVisible"
    | "TableAdditionalSource"
    | "StandardAttributeDescription"
    | "ChildItems"
    | "TypeDescription"
    | "DataPath"
    | "MetadataType"
    | "MetadataTypeCollection"
  >
}

// export interface CustomExportPropertyRule extends BasePropertyRule {
//   type?: never
//   exportToYAML: (context: ConfigurationContext, rule: PropertyRule, data: any) => any
// }

export type PropertyRule =
  | SystemEnumerationPropertyRule
  | UserVisiblePropertyRule
  | I8nTextPropertyRule
  | FormattedI8nTextPropertyRule
  | CleanPropertyRule
  // | CustomExportPropertyRule
  | TableAdditionalSourcePropertyRule
  | StandardAttributeDescriptionPropertyRule
  | ChildItemsPropertyRule
  | TypeDescriptionPropertyRule
  | DataPathPropertyRule
  | MetadataTypePropertyRule

type PropertiesType = Partial<Record<string, PropertyRule>>

export interface ItemXML {
  [key: string]: any
}

export interface MetadataItemRule extends MetadataItem {
  itemType: MetadataItemType
  properties: PropertiesType

  events?: EventsRules
}
