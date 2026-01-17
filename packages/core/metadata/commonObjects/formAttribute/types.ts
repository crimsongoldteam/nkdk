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
import { StringboolEnterprise } from "../boolean/types"

export interface FormAttribute {
  name: string
  title: I8nText
  valueType?: TypeDescription
  mainAttribute?: boolean
  storedData?: boolean
  use?: UserVisible
}

export interface FormAttributeXML {
  _name: string
  _id: string
  Title?: I8nTextXML
  Type?: TypeDescriptionXML
  MainAttribute?: boolean
  StoredData?: boolean
  Use?: UserVisibleXML
}

export interface ConditionalAppearanceXML {
  ConditionalAppearance: Record<string, unknown>
}

export interface FormAttributeEnterprise {
  Заголовок?: I8nTextEnterprise
  Тип?: TypeDescriptionEnterprise
  ОсновнойРеквизит?: StringboolEnterprise
  СохраняемыеДанные?: StringboolEnterprise
  [UserVisibleKeysEnterprise.Allow]?: UserVisibleEnterprise
  [UserVisibleKeysEnterprise.Deny]?: UserVisibleEnterprise
}

export type FormAttributes = FormAttribute[]

export type FormAttributesXML = (FormAttributeXML | ConditionalAppearanceXML)[]

export type FormAttributesEnterprise = Record<string, FormAttributeEnterprise | TypeDescriptionEnterprise>
