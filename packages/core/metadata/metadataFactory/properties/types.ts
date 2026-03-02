import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { StandartAttributeName } from "~/metadata/commonObjects/standardAttributeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { TableAdditionalSourceTypes } from "~/metadata/forms/commonObjects/tableAdditionalSource/types"
import { EventsRules } from "../events"
import { MetadataType } from "../metadataType/types"
import { ToYAML } from "../rules"
import { TypeRulesNames, TypeRulesOperations } from "../types/types"

export interface MetadataItem {
  itemType: MetadataType
}

type YAMLKey<T extends MetadataItem | never> = Extract<keyof ToYAML<T>, string>

type DefaultValueFunction = (params: { context: ConfigurationContext; name?: string }) => any

interface BasePropertyRule<T extends MetadataItem | never = never, TagsType extends string = string> {
  /**
   * Название ключа в yaml
   */
  yaml?: YAMLKey<T>
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
  tag?: TagsType

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

export interface I8nTextPropertyRule<T extends MetadataItem | never = never> extends Omit<
  BasePropertyRule<T>,
  "defaultValue"
> {
  type: "I8nText"
  yamlPartialOthers?: true
  skipEmptyToXML?: true

  /**
   * Если значение поля приведенное к pascalCase равно имени элемента - поле не будет выгружено в yaml
   */
  excludeIfEqualNameYAML?: true
  defaultValue?: I8nText | I8nTextDefaultValueFunction
}

export interface FormattedI8nTextPropertyRule<T extends MetadataItem | never = never> extends BasePropertyRule<T> {
  type: "FormattedI8nText"
  yamlFormatted: string
  yamlPartialOthers?: true
  xmlWithDefaultLanguage?: true
}

export interface ChildItemsPropertyRule<T extends MetadataItem | never = never> extends BasePropertyRule<T> {
  type: "ChildItems"
  defaultValue: []
  fromPartialYAML?: true
}

export interface SystemEnumerationPropertyRule<T extends MetadataItem | never = never> extends BasePropertyRule<T> {
  type: "SystemEnumeration"
  typeSE: string
}

export interface UserVisiblePropertyRule<T extends MetadataItem | never = never> extends BasePropertyRule<T> {
  type: "UserVisible"
  yaml: YAMLKey<T>
  yamlDeny: YAMLKey<T>
}

export interface StandardAttributeDescriptionPropertyRule<
  T extends MetadataItem | never = never,
> extends BasePropertyRule<T> {
  type: "StandardAttributeDescription"
  standartAttributeNames: StandartAttributeName[]
}

export interface TableAdditionalSourcePropertyRule<T extends MetadataItem | never = never> extends BasePropertyRule<T> {
  type: "TableAdditionalSource"
  additionalSourceType: TableAdditionalSourceTypes
  forSingleElement?: true
}

export interface TypeDescriptionPropertyRule<T extends MetadataItem | never = never> extends BasePropertyRule<T> {
  type: "TypeDescription"
  addTypeDescriptionAttributeToXML?: true
}

export interface DataPathPropertyRule<T extends MetadataItem | never = never> extends BasePropertyRule<T> {
  type: "DataPath"
  defaultType: string
}

export interface CleanPropertyRule<T extends MetadataItem | never = never> extends BasePropertyRule<T> {
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

export interface CustomExportPropertyRule<T extends MetadataItem | never = never> extends BasePropertyRule<T> {
  type?: never
  exportToYAML: (context: ConfigurationContext, rule: PropertyRule<T>, data: any) => any
}

export type PropertyRule<T extends MetadataItem | never = never> =
  | SystemEnumerationPropertyRule<T>
  | UserVisiblePropertyRule<T>
  | I8nTextPropertyRule<T>
  | FormattedI8nTextPropertyRule<T>
  | CleanPropertyRule<T>
  | CustomExportPropertyRule<T>
  | TableAdditionalSourcePropertyRule<T>
  | StandardAttributeDescriptionPropertyRule<T>
  | ChildItemsPropertyRule<T>
  | TypeDescriptionPropertyRule<T>
  | DataPathPropertyRule<T>

type PropertiesType<T extends MetadataItem, ExtraProperties extends string = never> = Partial<
  Record<Exclude<keyof T, "itemType" | "name"> | ExtraProperties, PropertyRule<T>>
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
