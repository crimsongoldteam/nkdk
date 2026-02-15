import { ConfigurationContext } from "~/metadata/context/types"
import { TableAdditionalSourceTypes } from "~/metadata/forms/commonObjects/tableAdditionalSource/types"
import { MetadataType } from "../metadataType/types"
import { ToYAML } from "../rules"
import { TypeRulesNames } from "../typeRulesFactory"

export interface MetadataItem {
  itemType: MetadataType
}

interface BasePropertyRule<T extends MetadataItem | never, TagsType extends string = string> {
  yaml?: T extends MetadataItem ? keyof ToYAML<T> : string
  xml?: string
  toEnterprise?: false
  toPartialYAML?: false
  fromXML?: false
  defaultValue?: any
  tag?: TagsType
}

export interface I8nTextPropertyRule<T extends MetadataItem | never> extends BasePropertyRule<T> {
  type: "I8nText"
  yamlPartialOthers?: true
}

export interface FormattedI8nTextPropertyRule<T extends MetadataItem | never> extends BasePropertyRule<T> {
  type: "FormattedI8nText"
  yamlFormatted: string
  yamlPartialOthers?: true
  xmlWithDefaultLanguage?: true
}

export interface SystemEnumerationPropertyRule<T extends MetadataItem | never> extends BasePropertyRule<T> {
  type: "SystemEnumeration"
  typeSE: string
}

export interface UserVisiblePropertyRule<T extends MetadataItem | never> extends BasePropertyRule<T> {
  type: "UserVisible"
  yaml: T extends MetadataItem ? keyof ToYAML<T> : string
  yamlDeny: string
}

export interface TableAdditionalSourcePropertyRule<T extends MetadataItem | never> extends BasePropertyRule<T> {
  type: "TableAdditionalSource"
  additionalSourceType: TableAdditionalSourceTypes
  forSingleElement?: true
}

export interface CleanPropertyRule<T extends MetadataItem | never> extends BasePropertyRule<T> {
  type: Exclude<
    TypeRulesNames,
    "SystemEnumeration" | "I8nText" | "FormattedI8nText" | "UserVisible" | "TableAdditionalSource"
  >
}

export interface CustomExportPropertyRule<T extends MetadataItem | never> extends BasePropertyRule<T> {
  type?: never
  exportToEnterprise: (context: ConfigurationContext, rule: PropertyRule<T>, data: any) => any
}

export type PropertyRule<T extends MetadataItem | never> =
  | SystemEnumerationPropertyRule<T>
  | UserVisiblePropertyRule<T>
  | I8nTextPropertyRule<T>
  | FormattedI8nTextPropertyRule<T>
  | CleanPropertyRule<T>
  | CustomExportPropertyRule<T>
  | TableAdditionalSourcePropertyRule<T>

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
}
