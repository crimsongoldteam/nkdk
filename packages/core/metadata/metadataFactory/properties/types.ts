import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { StandartAttributeName } from "~/metadata/commonObjects/standardAttributeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { TableAdditionalSourceTypes } from "~/metadata/forms/commonObjects/tableAdditionalSource/types"
import { EventsRules } from "../events"
import { MetadataType } from "../metadataType/types"
import { TypeRulesNames, TypeRulesOperations } from "../types/types"

export interface MetadataItem {
  itemType: MetadataType
}

type DefaultValueFunction = (params: { context: ConfigurationContext; name?: string }) => any

interface BasePropertyRule {
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

type I8nTextDefaultValueFunction = (params: {
  context: ConfigurationContext
  name?: string
  operation: TypeRulesOperations
}) => I8nText

export interface I8nTextPropertyRule extends Omit<BasePropertyRule, "defaultValue"> {
  type: "I8nText"
  yamlPartialOthers?: true
  skipEmptyToXML?: true

  /**
   * Если значение поля приведенное к pascalCase равно имени элемента - поле не будет выгружено в yaml
   */
  excludeIfEqualNameYAML?: true
  defaultValue?: I8nText | I8nTextDefaultValueFunction
}

export interface FormattedI8nTextPropertyRule extends BasePropertyRule {
  type: "FormattedI8nText"
  yamlFormatted: string
  yamlPartialOthers?: true
  xmlWithDefaultLanguage?: true
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

export interface CleanPropertyRule extends BasePropertyRule {
  type: Exclude<
    TypeRulesNames,
    | "SystemEnumeration"
    | "I8nText"
    | "FormattedI8nText"
    | "UserVisible"
    | "TableAdditionalSource"
    | "StandardAttributeDescription"
    | "ChildItems"
    | "TypeDescription"
    | "DataPath"
  >
}

export interface CustomExportPropertyRule extends BasePropertyRule {
  type?: never
  exportToYAML: (context: ConfigurationContext, rule: PropertyRule, data: any) => any
}

export type PropertyRule =
  | SystemEnumerationPropertyRule
  | UserVisiblePropertyRule
  | I8nTextPropertyRule
  | FormattedI8nTextPropertyRule
  | CleanPropertyRule
  | CustomExportPropertyRule
  | TableAdditionalSourcePropertyRule
  | StandardAttributeDescriptionPropertyRule
  | ChildItemsPropertyRule
  | TypeDescriptionPropertyRule
  | DataPathPropertyRule

type PropertiesType<T extends MetadataItem, ExtraProperties extends string = never> = Partial<
  Record<Exclude<keyof T, "itemType" | "name"> | ExtraProperties, PropertyRule>
>

export interface ItemXML {
  [key: string]: any
}

export interface MetadataItemRule<
  T extends MetadataItem,
  ExtraProperties extends string = never,
  TagsType extends string = string,
> {
  tags?: TagsType[]
  properties: PropertiesType<T, ExtraProperties>

  events?: EventsRules<T>
}
