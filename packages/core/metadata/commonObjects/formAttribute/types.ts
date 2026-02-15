import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
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
  UserVisibleEnterprise,
  UserVisibleXML,
} from "~/metadata/commonObjects/userVisible/types"
import { ElementXML, MetadataItem } from "~/metadata/metadataFactory"
import { FillChecking, FillCheckingEnterprise } from "~/metadata/systemEnumerations/types"
import { StringboolEnterprise } from "../boolean/types"
import { DynamicList, DynamicListEnterprise, DynamicListXML } from "../dynamicList/types"
import { FieldsList, FieldsListEnterprise, FieldsListXML } from "../fieldsList/types"
import {
  FunctionalOptions,
  FunctionalOptionsEnterprise,
  FunctionalOptionsXML,
} from "../functionalOptionsProperty/types"

export interface FormAttributeAdditionalColumn {
  table: string
  columns: FormAttributeColumn[]
}

export interface FormAttribute extends MetadataItem {
  itemType: "FormAttribute"
  name: string
  title: I8nText
  valueType?: TypeDescription
  mainAttribute?: boolean
  storedData?: boolean
  view?: UserVisible
  edit?: UserVisible
  fillCheck?: FillChecking
  settings?: TypeDescription | DynamicList
  columns: FormAttributeColumn[]
  additionalColumns: FormAttributeAdditionalColumn[]
  functionalOptions?: FunctionalOptions
  fieldsList?: FieldsList
  save?: FieldsList
}

export interface FormAttributeColumn extends MetadataItem {
  itemType: "FormAttributeColumn"
  name: string
  id: string
  title?: I8nText
  type?: TypeDescription
  view?: UserVisible
  edit?: UserVisible
  fillCheck?: FillChecking
  // columns?: FormAttributeColumn[]
  functionalOptions?: FunctionalOptions
}

interface SettingsTypeDescriptionXML extends TypeDescriptionXML {
  "_xsi:type": "v8:TypeDescription"
}

export interface FormAttributeColumnXML {
  _name: string
  _id: string
  Title?: I8nTextXML
  Type?: TypeDescriptionXML
  View?: UserVisibleXML
  Edit?: UserVisibleXML
  FillCheck?: FillChecking
  Column?: FormAttributeColumnXML | FormAttributeColumnXML[]
  FunctionalOptions?: FunctionalOptionsXML
}

export interface FormAttributeAdditionalColumnXML {
  _table: string
  Column?: ElementXML[]
}

export interface FormAttributeXML {
  _name: string
  _id: string
  Settings?: SettingsTypeDescriptionXML | DynamicListXML
  Title?: I8nTextXML
  Type?: TypeDescriptionXML
  MainAttribute?: boolean
  SavedData?: boolean
  FillCheck?: FillChecking
  View?: UserVisibleXML
  Edit?: UserVisibleXML
  Columns?: {
    Column: FormAttributeColumnXML | FormAttributeColumnXML[]
    AdditionalColumns?: FormAttributeAdditionalColumnXML | FormAttributeAdditionalColumnXML[]
  }
  FunctionalOptions?: FunctionalOptionsXML
  UseAlways?: FieldsListXML
  Use?: UserVisibleXML
  Save?: FieldsListXML
}

export interface ConditionalAppearanceXML {
  ConditionalAppearance: Record<string, unknown>
}

export interface FormAttributeColumnEnterprise {
  Заголовок?: I8nTextEnterprise
  Тип?: TypeDescriptionEnterprise
  ПроверкаЗаполнения?: FillCheckingEnterprise
  [UserViewKeysEnterprise.Allow]?: UserViewEnterprise
  [UserViewKeysEnterprise.Deny]?: UserViewEnterprise
  [UserEditKeysEnterprise.Allow]?: UserEditEnterprise
  [UserEditKeysEnterprise.Deny]?: UserEditEnterprise
  Колонки?: Record<string, FormAttributeColumnEnterprise>
  ФункциональныеОпции?: FunctionalOptionsEnterprise
}

export interface FormAttributeAdditionalColumnEnterprise {
  [tableName: string]: Record<string, FormAttributeColumnEnterprise>
}

export interface FormAttributeEnterprise {
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
  Колонки?: Record<string, FormAttributeColumnEnterprise>
  ДополнительныеКолонки?: Record<string, Record<string, FormAttributeColumnEnterprise>>
  ФункциональныеОпции?: FunctionalOptionsEnterprise
  ИспользоватьВсегда?: FieldsListEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ПроверкаЗаполнения?: FillCheckingEnterprise
  Сохранение?: FieldsListEnterprise
}

export type FormAttributes = FormAttribute[]

export type FormAttributesXML = (FormAttributeXML | ConditionalAppearanceXML)[]

export type FormAttributesEnterprise = Record<string, FormAttributeEnterprise | TypeDescriptionEnterprise>
