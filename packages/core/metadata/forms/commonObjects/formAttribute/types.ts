import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { FieldsListYAML } from "~/metadata/commonObjects/fieldsList/types"
import { FunctionalOptionsYAML } from "~/metadata/commonObjects/functionalOptionsProperty/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { TypeDescriptionXML, TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import {
  UserEditKeysYAML,
  UserEditYAML,
  UserViewKeysYAML,
  UserViewYAML,
} from "~/metadata/commonObjects/userVisible/types"
import { DynamicListXML, DynamicListYAML } from "~/metadata/forms/commonObjects/dynamicList/types"
import { ElementXML } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { FillCheckingYAML } from "~/metadata/systemEnumerations/types"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"

export interface FormAttributeAdditionalColumn {
  table: string
  columns: FormAttributeColumn[]
}

export type FormAttribute = MetadataTypeByRule<typeof FormAttributeRules>

// export interface FormAttribute extends MetadataItem {
//   itemType: "FormAttribute"
//   name: string
//   title?: I8nText
//   type?: TypeDescription
//   columns: FormAttributeColumns
//   valueType?: TypeDescription
//   mainAttribute?: boolean
//   storedData?: boolean
//   view?: UserVisible
//   edit?: UserVisible
//   fillCheck?: FillChecking
//   settings?: TypeDescription | DynamicList
//   functionalOptions?: FunctionalOptions
//   fieldsList?: FieldsList
//   save?: FieldsList
// }

export type FormAttributeColumn = MetadataTypeByRule<typeof FormAttributeColumnRules>
// export interface FormAttributeColumn extends MetadataItem {
//   itemType: "FormAttributeColumn"
//   name: string
//   title?: I8nText
//   type?: TypeDescription
//   view?: UserVisible
//   edit?: UserVisible
//   fillCheck?: FillChecking
//   functionalOptions?: FunctionalOptions
// }

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
  Заголовок?: I8nTextYAML
  Тип?: TypeDescriptionYAML
  ПроверкаЗаполнения?: FillCheckingYAML
  [UserViewKeysYAML.Allow]?: UserViewYAML
  [UserViewKeysYAML.Deny]?: UserViewYAML
  [UserEditKeysYAML.Allow]?: UserEditYAML
  [UserEditKeysYAML.Deny]?: UserEditYAML
  Колонки?: Record<string, FormAttributeColumnYAML>
  ФункциональныеОпции?: FunctionalOptionsYAML
}

export interface FormAttributeAdditionalColumnYAML {
  [tableName: string]: Record<string, FormAttributeColumnYAML>
}

export type FormAttributeColumnsYAML = Record<string, FormAttributeColumnYAML> | FormAttributeAdditionalColumnYAML

export interface FormAttributeYAML {
  Заголовок?: I8nTextYAML
  Тип?: TypeDescriptionYAML
  ТипЗначения?: TypeDescriptionYAML
  ОсновнойРеквизит?: StringboolYAML
  СохраняемыеДанные?: StringboolYAML
  ДинамическийСписок?: DynamicListYAML
  [UserViewKeysYAML.Allow]?: UserViewYAML
  [UserViewKeysYAML.Deny]?: UserViewYAML
  [UserEditKeysYAML.Allow]?: UserEditYAML
  [UserEditKeysYAML.Deny]?: UserEditYAML
  Колонки?: FormAttributeColumnsYAML
  ФункциональныеОпции?: FunctionalOptionsYAML
  ИспользоватьВсегда?: FieldsListYAML
  ПроверкаЗаполнения?: FillCheckingYAML
  Сохранение?: FieldsListYAML
}

export type FormAttributes = FormAttribute[]

export type FormAttributesXML = (FormAttributeXML | ConditionalAppearanceXML)[]

export type FormAttributesYAML = Record<string, FormAttributeYAML | TypeDescriptionYAML>
