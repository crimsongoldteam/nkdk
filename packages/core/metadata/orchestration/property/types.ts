import { SettingsParameterValuePropertyRule } from "~/metadata/commonObjects/dataCompositionSystem/parameterValue/types"
import { DateTimePropertyRule } from "~/metadata/commonObjects/dateTime/types"
import { FormattedI8nTextPropertyRule } from "~/metadata/commonObjects/formattedI8nText/types"
import { I8nTextPropertyRule } from "~/metadata/commonObjects/i8nText/types"
import { MetadataValuePropertyRule } from "~/metadata/commonObjects/metadataValue/types"
import { NumberPropertyRule } from "~/metadata/commonObjects/number/types"
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
  /** Тип свойства */
  type: PropertyRuleType

  /** Обязательное свойство */
  required?: true

  /** Отключает свойство при любом экспорте/импорте */
  runtimeOnly?: true

  /** Порядок свойства при выгрузке в XML (используй только при необходимости) */
  order?: number

  /** Название ключа в YAML */
  yaml?: string

  /** Не экспортировать в YAML */
  toYAML?: false

  /** Не импортировать из YAML */
  fromYAML?: false

  /** Не экспортировать в корневой YAML */
  toPartialYAML?: false

  /** Значение по умолчанию в YAML (будет исключено из выбора)*/
  defaultValueYAML?: any | DefaultValueFunction

  /** Название в XML, если не заполнено - будет использован ключ*/
  xml?: string

  /** Значение по умолчанию в XML (будет выгружено как при пустом значении)*/
  defaultValueXML?: any

  /** Не импортировать из XML */
  fromXML?: false

  /** Не экспортировать в XML */
  toXML?: false

  /** Родительские элементы в XML */
  xmlParents?: string[]

  /** XML namespace для элемента при экспорте: `xmlns="..."` */
  xmlNamespace?: string

  /** Передавать значение в форму в 1С */
  toEnterprise?: false

  /** Значение по умолчанию */
  defaultValue?: any | DefaultValueFunction

  /** Теги, по которым будет выгружаться свойство */
  tag?: string

  /** Если все поля пустые - это поле будет выгружено как значение */
  useAsShortValueYAML?: true

  /** Свойство используется только для построения референса */
  forReferenceOnly?: true
}

export interface ChildItemsPropertyRule extends BasePropertyRule {
  type: "GroupChildItems" | "CommandBarChildItems" | "TableChildItems" | "PagesChildItems"
  defaultValue: []
  fromPartialYAML?: true
}

export interface UserVisiblePropertyRule extends BasePropertyRule {
  type: "UserVisible"
  /** Ключ в YAML в случае разрешения использования */
  yaml: string
  /** Ключ в YAML в случае запрета использования */
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
    | "SettingsParameterValue"
    | "number"
    | "dateTime"
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
  | TableAdditionalSourcePropertyRule
  | StandardAttributeDescriptionPropertyRule
  | StandardAttributeDescriptionsPropertyRule
  | InternalInfoPropertyRule
  | ChildItemsPropertyRule
  | TypeDescriptionPropertyRule
  | DataPathPropertyRule
  | MetadataTypePropertyRule
  | MetadataValuePropertyRule
  | SettingsParameterValuePropertyRule
  | NumberPropertyRule
  | DateTimePropertyRule

type PropertiesType = Record<string, PropertyRule>

export interface ItemXML {
  [key: string]: any
}

export interface MetadataItemRule extends MetadataItem {
  /**
   * Тип объекта метаданных
   */
  itemType: MetadataItemType

  /**
   * Свойства объекта метаданных
   */
  properties: PropertiesType

  /** @deprecated */
  eventsTag?: string
}
