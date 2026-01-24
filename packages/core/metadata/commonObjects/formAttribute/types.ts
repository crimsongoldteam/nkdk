import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import {
  TypeDescription,
  TypeDescriptionEnterprise,
  TypeDescriptionXML,
} from "~/metadata/commonObjects/typeDescription/types"
import {
  UserVisible,
  UserVisibleEnterprise,
  UserVisibleKeysEnterprise,
  UserVisibleXML,
} from "~/metadata/commonObjects/userVisible/types"
import { FillChecking, FillCheckingEnterprise } from "~/metadata/systemEnumerations/types"
import { StringboolEnterprise } from "../boolean/types"
import { DynamicList, DynamicListEnterprise, DynamicListXML } from "../dynamicList/types"
import {
  FunctionalOptions,
  FunctionalOptionsEnterprise,
  FunctionalOptionsXML,
} from "../functionalOptionsProperty/types"
import { UseAlways, UseAlwaysEnterprise, UseAlwaysXML } from "../useAlways/types"

export interface FormAttribute {
  name: string
  title: I8nText
  valueType?: TypeDescription
  mainAttribute?: boolean
  storedData?: boolean
  view?: UserVisible
  edit?: UserVisible
  fillCheck?: FillChecking
  settings?: TypeDescription | DynamicList
  columns?: FormAttributeColumn[]
  functionalOptions?: FunctionalOptions
  useAlways?: UseAlways
  use?: UserVisible
}

export interface FormAttributeColumn {
  name: string
  id: string
  title?: I8nText
  type?: TypeDescription
  view?: UserVisible
  edit?: UserVisible
  fillCheck?: FillChecking
  columns?: FormAttributeColumn[]
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
  }
  FunctionalOptions?: FunctionalOptionsXML
  UseAlways?: UseAlwaysXML
  Use?: UserVisibleXML
}

export interface ConditionalAppearanceXML {
  ConditionalAppearance: Record<string, unknown>
}

export interface FormAttributeColumnEnterprise {
  Заголовок?: I8nTextEnterprise
  Тип?: TypeDescriptionEnterprise
  ПроверкаЗаполнения?: FillCheckingEnterprise
  [UserVisibleKeysEnterprise.AllowView]?: UserVisibleEnterprise
  [UserVisibleKeysEnterprise.DenyView]?: UserVisibleEnterprise
  [UserVisibleKeysEnterprise.AllowEdit]?: UserVisibleEnterprise
  [UserVisibleKeysEnterprise.DenyEdit]?: UserVisibleEnterprise
  Колонки?: Record<string, FormAttributeColumnEnterprise>
  ФункциональныеОпции?: FunctionalOptionsEnterprise
}

export interface FormAttributeEnterprise {
  Заголовок?: I8nTextEnterprise
  Тип?: TypeDescriptionEnterprise
  ТипЗначения?: TypeDescriptionEnterprise
  ОсновнойРеквизит?: StringboolEnterprise
  СохраняемыеДанные?: StringboolEnterprise
  ДинамическийСписок?: DynamicListEnterprise
  [UserVisibleKeysEnterprise.Allow]?: UserVisibleEnterprise
  [UserVisibleKeysEnterprise.Deny]?: UserVisibleEnterprise
  Колонки?: Record<string, FormAttributeColumnEnterprise>
  ФункциональныеОпции?: FunctionalOptionsEnterprise
  ИспользоватьВсегда?: UseAlwaysEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
}

export type FormAttributes = FormAttribute[]

export type FormAttributesXML = (FormAttributeXML | ConditionalAppearanceXML)[]

export type FormAttributesEnterprise = Record<string, FormAttributeEnterprise | TypeDescriptionEnterprise>
