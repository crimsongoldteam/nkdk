import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import {
  MetadataValue,
  MetadataValueEnterprise,
  MetadataValueXML,
} from "~/lib/metadata/commonObjects/metadataValue/types"
import {
  TypeDescription,
  TypeDescriptionEnterprise,
  TypeDescriptionXML,
} from "~/lib/metadata/commonObjects/typeDescription/types"
import { TypeLink, TypeLinkEnterprise, TypeLinkXML } from "~/lib/metadata/commonObjects/typeLink/types"
import {
  ChoiceParameterLinks,
  ChoiceParameterLinksEnterprise,
  ChoiceParameterLinksXML,
} from "~/lib/metadata/commonObjects/сhoiceParameterLinks/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface StandardAttributeDescription {
  choiceForm?: string
  choiceHistoryOnInput?: SE.ChoiceHistoryOnInput
  choiceParameterLinks?: ChoiceParameterLinks
  choiceParameters?: ChoiceParameterLinks
  comment?: string
  createOnInput?: SE.CreateOnInput
  dataHistory?: SE.DataHistoryUse
  editFormat?: I8nText
  extendedEdit?: boolean
  fillChecking?: SE.FillChecking
  fillFromFillingValue?: boolean
  fillValue?: MetadataValue
  format?: I8nText
  fullTextSearch?: SE.UseFullTextSearch
  linkByType?: TypeLink
  markNegatives?: boolean
  mask?: string
  maxValue?: number
  minValue?: number
  multiLine?: boolean
  name: string
  passwordMode?: boolean
  quickChoice?: boolean
  synonym?: I8nText
  toolTip?: I8nText
  type?: TypeDescription
  typeReductionMode?: SE.TypeReductionMode
}

export interface StandardAttributeDescriptionXML {
  ChoiceForm?: string
  ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput
  ChoiceParameterLinks?: ChoiceParameterLinksXML
  ChoiceParameters?: ChoiceParameterLinksXML
  Comment?: string
  CreateOnInput?: SE.CreateOnInput
  DataHistory?: SE.DataHistoryUse
  EditFormat?: I8nTextXML
  ExtendedEdit?: boolean
  FillChecking?: SE.FillChecking
  FillFromFillingValue?: boolean
  FillValue?: MetadataValueXML
  Format?: I8nTextXML
  FullTextSearch?: SE.UseFullTextSearch
  LinkByType?: TypeLinkXML
  MarkNegatives?: boolean
  Mask?: string
  MaxValue?: number
  MinValue?: number
  MultiLine?: boolean
  Name: string
  PasswordMode?: boolean
  QuickChoice?: boolean
  Synonym?: I8nTextXML
  ToolTip?: I8nTextXML
  Type?: TypeDescriptionXML
  TypeReductionMode?: SE.TypeReductionMode
}

export interface StandardAttributeDescriptionEnterprise {
  БыстрыйВыбор?: StringboolEnterprise
  ВыделятьОтрицательные?: StringboolEnterprise
  ЗаполнятьИзДанныхЗаполнения?: StringboolEnterprise
  ЗначениеЗаполнения?: MetadataValueEnterprise
  Имя?: string
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputEnterprise
  ИсторияДанных?: SE.DataHistoryUseEnterprise
  Комментарий?: string
  МаксимальноеЗначение?: number
  Маска?: string
  МинимальноеЗначение?: number
  МногострочныйРежим?: StringboolEnterprise
  ПараметрыВыбора?: ChoiceParameterLinksEnterprise
  Подсказка?: I8nTextEnterprise
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchEnterprise
  ПроверкаЗаполнения?: SE.FillCheckingEnterprise
  РасширенноеРедактирование?: StringboolEnterprise
  РежимПароля?: StringboolEnterprise
  РежимСокращенияТипа?: SE.TypeReductionModeEnterprise
  СвязиПараметровВыбора?: ChoiceParameterLinksEnterprise
  СвязьПоТипу?: TypeLinkEnterprise
  Синоним?: I8nTextEnterprise
  СозданиеПриВводе?: SE.CreateOnInputEnterprise
  Тип?: TypeDescriptionEnterprise
  ФормаВыбора?: string
  Формат?: I8nTextEnterprise
  ФорматРедактирования?: I8nTextEnterprise
}

export type StandardAttributeDescriptions = StandardAttributeDescription[]

export type StandardAttributeDescriptionsXML = StandardAttributeDescriptionXML[]

export type StandardAttributeDescriptionsEnterprise = Record<string, StandardAttributeDescriptionEnterprise>
