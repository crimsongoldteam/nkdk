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
  name?: string
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
  Name?: string
  PasswordMode?: boolean
  QuickChoice?: boolean
  Synonym?: I8nTextXML
  ToolTip?: I8nTextXML
  Type?: TypeDescriptionXML
  TypeReductionMode?: SE.TypeReductionMode
}

export interface StandardAttributeDescriptionEnterprise {
  ФормаВыбора?: string
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputEnterprise
  СвязиПараметровВыбора?: ChoiceParameterLinksEnterprise
  ПараметрыВыбора?: ChoiceParameterLinksEnterprise
  Комментарий?: string
  СозданиеПриВводе?: SE.CreateOnInputEnterprise
  ИсторияДанных?: SE.DataHistoryUseEnterprise
  ФорматРедактирования?: I8nTextEnterprise
  РасширенноеРедактирование?: StringboolEnterprise
  ПроверкаЗаполнения?: SE.FillCheckingEnterprise
  ЗаполнятьИзДанныхЗаполнения?: StringboolEnterprise
  ЗначениеЗаполнения?: MetadataValueEnterprise
  Формат?: I8nTextEnterprise
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchEnterprise
  СвязьПоТипу?: TypeLinkEnterprise
  ВыделятьОтрицательные?: StringboolEnterprise
  Маска?: string
  МаксимальноеЗначение?: number
  МинимальноеЗначение?: number
  МногострочныйРежим?: StringboolEnterprise
  Имя?: string
  РежимПароля?: StringboolEnterprise
  БыстрыйВыбор?: StringboolEnterprise
  Синоним?: I8nTextEnterprise
  Подсказка?: I8nTextEnterprise
  Тип?: TypeDescriptionEnterprise
  РежимСокращенияТипа?: SE.TypeReductionModeEnterprise
}

export type StandardAttributeDescriptions = StandardAttributeDescription[]
export type StandardAttributeDescriptionsXML = StandardAttributeDescriptionXML[]
export type StandardAttributeDescriptionsEnterprise = StandardAttributeDescriptionEnterprise[]
