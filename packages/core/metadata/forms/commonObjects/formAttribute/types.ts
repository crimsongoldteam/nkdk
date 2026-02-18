import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { FieldsList, FieldsListEnterprise } from "~/metadata/commonObjects/fieldsList/types"
import {
  FunctionalOptions,
  FunctionalOptionsEnterprise,
} from "~/metadata/commonObjects/functionalOptionsProperty/types"
import { I8nText, I8nTextEnterprise } from "~/metadata/commonObjects/i8nText/types"
import {
  TypeDescription,
  TypeDescriptionEnterprise,
  TypeDescriptionXML,
} from "~/metadata/commonObjects/typeDescription/types"
import {
  UserEditEnterprise,
  UserEditKeysEnterprise,
  UserViewEnterprise,
  UserViewKeysEnterprise,
  UserVisible,
} from "~/metadata/commonObjects/userVisible/types"
import { DynamicList, DynamicListEnterprise, DynamicListXML } from "~/metadata/forms/commonObjects/dynamicList/types"
import { ElementXML, MetadataItem } from "~/metadata/metadataFactory"
import { FillChecking, FillCheckingEnterprise } from "~/metadata/systemEnumerations/types"

export interface FormAttributeAdditionalColumn {
  table: string
  columns: FormAttributeColumn[]
}

export interface FormAttribute extends MetadataItem {
  itemType: "FormAttribute"
  name: string
  title: I8nText
  type?: TypeDescription
  columns: FormAttributeColumns
  valueType?: TypeDescription
  mainAttribute?: boolean
  storedData?: boolean
  view?: UserVisible
  edit?: UserVisible
  fillCheck?: FillChecking
  settings?: TypeDescription | DynamicList
  functionalOptions?: FunctionalOptions
  fieldsList?: FieldsList
  save?: FieldsList
}

export interface FormAttributeColumn extends MetadataItem {
  itemType: "FormAttributeColumn"
  name: string
  title?: I8nText
  type?: TypeDescription
  view?: UserVisible
  edit?: UserVisible
  fillCheck?: FillChecking
  functionalOptions?: FunctionalOptions
}

export interface FormAttributeAdditionalColumns {
  table: string
  columns: FormAttributeColumn[]
}
export type FormAttributeColumns = FormAttributeColumn[] | FormAttributeAdditionalColumns[]

// export interface FormAttributeAdditionalColumn extends MetadataItem {
//   itemType: "FormAttributeAdditionalColumn"
//   name: string
//   // table: string
//   title?: I8nText
//   type?: TypeDescription
//   view?: UserVisible
//   edit?: UserVisible
//   fillCheck?: FillChecking
//   functionalOptions?: FunctionalOptions
// }

interface SettingsTypeDescriptionXML extends TypeDescriptionXML {
  "_xsi:type": "v8:TypeDescription"
}

export interface FormAttributeColumnXML extends ElementXML {}

export interface FormAttributeAdditionalColumnXML {
  _table: string
  Column?: FormAttributeColumnXML[]
}

export interface FormAttributeColumnsXML {
  Column?: FormAttributeColumnXML | FormAttributeColumnXML[]
  AdditionalColumns?: FormAttributeAdditionalColumnXML | FormAttributeAdditionalColumnXML[]
}

export interface FormAttributeXML extends ElementXML {
  Columns?: FormAttributeColumnsXML
  Settings?: SettingsTypeDescriptionXML | DynamicListXML
}

export interface ConditionalAppearanceXML {
  ConditionalAppearance: Record<string, unknown>
}

export interface FormAttributeColumnYAML {
  Заголовок?: I8nTextEnterprise
  Тип?: TypeDescriptionEnterprise
  ПроверкаЗаполнения?: FillCheckingEnterprise
  [UserViewKeysEnterprise.Allow]?: UserViewEnterprise
  [UserViewKeysEnterprise.Deny]?: UserViewEnterprise
  [UserEditKeysEnterprise.Allow]?: UserEditEnterprise
  [UserEditKeysEnterprise.Deny]?: UserEditEnterprise
  Колонки?: Record<string, FormAttributeColumnYAML>
  ФункциональныеОпции?: FunctionalOptionsEnterprise
}

export interface FormAttributeAdditionalColumnYAML {
  [tableName: string]: Record<string, FormAttributeColumnYAML>
}

export type FormAttributeColumnsYAML = Record<string, FormAttributeColumnYAML> | FormAttributeAdditionalColumnYAML

export interface FormAttributeYAML {
  Заголовок?: I8nTextEnterprise
  Тип?: TypeDescriptionEnterprise
  ТипЗначения?: TypeDescriptionEnterprise
  ОсновнойРеквизит?: StringboolEnterprise
  СохраняемыеДанные?: StringboolEnterprise
  ДинамическийСписок?: DynamicListEnterprise
  [UserViewKeysEnterprise.Allow]?: UserViewEnterprise
  [UserViewKeysEnterprise.Deny]?: UserViewEnterprise
  [UserEditKeysEnterprise.Allow]?: UserEditEnterprise
  [UserEditKeysEnterprise.Deny]?: UserEditEnterprise
  Колонки?: FormAttributeColumnsYAML
  // ДополнительныеКолонки?: Record<string, Record<string, FormAttributeColumnEnterprise>>
  ФункциональныеОпции?: FunctionalOptionsEnterprise
  ИспользоватьВсегда?: FieldsListEnterprise
  ПроверкаЗаполнения?: FillCheckingEnterprise
  Сохранение?: FieldsListEnterprise
}

export type FormAttributes = FormAttribute[]

export type FormAttributesXML = (FormAttributeXML | ConditionalAppearanceXML)[]

export type FormAttributesEnterprise = Record<string, FormAttributeYAML | TypeDescriptionEnterprise>
