import { FormattedI8nTextPropertyRule } from "~/metadata/commonObjects/formattedI8nText/types"
import { I8nTextPropertyRule } from "~/metadata/commonObjects/i8nText/types"
import { MetadataValuePropertyRule } from "~/metadata/commonObjects/metadataValue/types"
import { StandartAttributeName } from "~/metadata/commonObjects/standardAttributeDescription/types"
import { ConfigurationContext, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { TableAdditionalSourceTypes } from "~/metadata/forms/commonObjects/tableAdditionalSource/types"
import { SystemEnumerationPropertyRule } from "~/metadata/systemEnumerations/types"
import { MetadataItemType } from "../metadataItem/registry"
import { PropertyRuleType } from "./registry"

export interface MetadataItem {
  itemType: MetadataItemType
}

type DefaultValueFunction = (params: { context: ConfigurationContext; name?: string }) => any

export interface BasePropertyRule {
  type: PropertyRuleType

  required?: true

  /** Отключает свойство при любом экспорте/импорте */
  runtimeOnly?: true

  /**
   * Порядок свойств при экспорте/импорте.
   * Меньшее значение — раньше, отсутствие значения — после всех с order.
   */
  order?: number

  /**
   * Название ключа в yaml
   */
  yaml?: string

  /**
   * Не экспортировать в yaml
   */
  toYAML?: false
  /**
   * Не импортировать из yaml
   */
  fromYAML?: false
  toPartialYAML?: false
  defaultValueYAML?: any | DefaultValueFunction

  /**
   * Название в xml, если не заполнено - будет использован ключ
   */
  xml?: string
  defaultValueXML?: any
  fromXML?: false
  toXML?: false
  /**
   * Родительские элементы в xml
   */
  xmlParents?: string[]

  /**
   * Передавать значение в форму в 1С
   */
  toEnterprise?: false
  fromEnterprise?: false
  defaultValue?: any | DefaultValueFunction

  /**
   * Теги, по которым будет выгружаться свойство
   */
  tag?: string

  /**
   * Если все поля пустые - это поле будет выгружено как значение
   */
  useAsShortValueYAML?: true

  /**
   * Если true, то свойство будет пропущено при импорте из XML
   */
  forReferenceOnly?: true
}

export interface ChildItemsPropertyRule extends BasePropertyRule {
  type: "GroupChildItems" | "CommandBarChildItems" | "TableChildItems" | "PagesChildItems"
  defaultValue: []
  fromPartialYAML?: true
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

export interface StandardAttributeDescriptionsPropertyRule extends BasePropertyRule {
  type: "StandardAttributeDescriptions"
  standartAttributeNames: StandartAttributeName[]
}

export interface EventsPropertyRule extends BasePropertyRule {
  type: "Events"
  /**
   * Маппинг: ключ события в metadata -> ключ в YAML (русский синоним).
   * Пример: onChange -> "ПриИзменении"
   */
  items: Record<string, string>
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

export interface InternalInfoPropertyRule extends BasePropertyRule {
  type: "InternalInfo"
  items: Array<{ name: string; category: string }>
  forReferenceOnly: true
  getName?: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => string
}

export interface CleanPropertyRule extends BasePropertyRule {
  type: Exclude<
    PropertyRuleType,
    | "SystemEnumeration"
    | "I8nText"
    | "FormattedI8nText"
    | "Events"
    | "UserVisible"
    | "TableAdditionalSource"
    | "StandardAttributeDescription"
    | "StandardAttributeDescriptions"
    | "TypeDescription"
    | "DataPath"
    | "MetadataType"
    | "MetadataTypeCollection"
    | "InternalInfo"
    | "GroupChildItems"
    | "CommandBarChildItems"
    | "TableChildItems"
    | "PagesChildItems"
    | "MetadataValue"
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
  | EventsPropertyRule
  | CleanPropertyRule
  // | CustomExportPropertyRule
  | TableAdditionalSourcePropertyRule
  | StandardAttributeDescriptionPropertyRule
  | StandardAttributeDescriptionsPropertyRule
  | InternalInfoPropertyRule
  | ChildItemsPropertyRule
  | TypeDescriptionPropertyRule
  | DataPathPropertyRule
  | MetadataTypePropertyRule
  | MetadataValuePropertyRule

type PropertiesType = Record<string, PropertyRule>

export interface ItemXML {
  [key: string]: any
}

export interface MetadataItemRule extends MetadataItem {
  itemType: MetadataItemType
  properties: PropertiesType

  // events?: EventsRules
  eventsTag?: string
}
