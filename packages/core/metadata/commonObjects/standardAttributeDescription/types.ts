import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataValue, MetadataValueEnterprise, MetadataValueXML } from "~/metadata/commonObjects/metadataValue/types"
import {
  TypeDescription,
  TypeDescriptionEnterprise,
  TypeDescriptionXML,
} from "~/metadata/commonObjects/typeDescription/types"
import { TypeLink, TypeLinkEnterprise, TypeLinkXML } from "~/metadata/commonObjects/typeLink/types"
import {
  ChoiceParameterLinks,
  ChoiceParameterLinksEnterprise,
  ChoiceParameterLinksXML,
} from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import * as SE from "~/metadata/systemEnumerations/types"

export const StandartAttributeNameToEnterprise = {
  Owner: "Владелец",
  PredefinedDataName: "ИмяПредопределенныхДанных",
  Code: "Код",
  Description: "Наименование",
  DeletionMark: "ПометкаУдаления",
  Predefined: "Предопределенный",
  Parent: "Родитель",
  Ref: "Ссылка",
  IsFolder: "ЭтоГруппа",
  LineNumber: "НомерСтроки",
  Active: "Активность",
  Recorder: "Регистратор",
  Period: "Период",
} as const

export const StandartAttributeNameFromEnterprise = (name: string): StandartAttributeName => {
  return Object.keys(StandartAttributeNameToEnterprise).find(
    (key) => StandartAttributeNameToEnterprise[key as StandartAttributeName] === name
  ) as StandartAttributeName
}

export type StandartAttributeName = keyof typeof StandartAttributeNameToEnterprise
export type StandartAttributeEnterprise =
  (typeof StandartAttributeNameToEnterprise)[keyof typeof StandartAttributeNameToEnterprise]

// export const PredefinedNameToEnterprise

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
  name: StandartAttributeName
  passwordMode?: boolean
  quickChoice?: SE.UseQuickChoice
  synonym?: I8nText
  toolTip?: I8nText
  type?: TypeDescription
  typeReductionMode?: SE.TypeReductionMode
}

export interface StandardAttributeDescriptionXML {
  _name: StandartAttributeName
  "xr:ChoiceForm"?: string
  "xr:ChoiceHistoryOnInput"?: SE.ChoiceHistoryOnInput
  "xr:ChoiceParameterLinks"?: ChoiceParameterLinksXML
  "xr:ChoiceParameters"?: ChoiceParameterLinksXML
  "xr:Comment"?: string
  "xr:CreateOnInput"?: SE.CreateOnInput
  "xr:DataHistory"?: SE.DataHistoryUse
  "xr:EditFormat"?: I8nTextXML
  "xr:ExtendedEdit"?: boolean
  "xr:FillChecking"?: SE.FillChecking
  "xr:FillFromFillingValue"?: boolean
  "xr:FillValue"?: MetadataValueXML
  "xr:Format"?: I8nTextXML
  "xr:FullTextSearch"?: SE.UseFullTextSearch
  "xr:LinkByType"?: TypeLinkXML
  "xr:MarkNegatives"?: boolean
  "xr:Mask"?: string
  "xr:MaxValue"?: number
  "xr:MinValue"?: number
  "xr:MultiLine"?: boolean
  "xr:PasswordMode"?: boolean
  "xr:QuickChoice"?: SE.UseQuickChoice
  "xr:Synonym"?: I8nTextXML
  "xr:ToolTip"?: I8nTextXML
  "xr:Type"?: TypeDescriptionXML
  "xr:TypeReductionMode"?: SE.TypeReductionMode
}

export interface StandardAttributeDescriptionEnterprise {
  БыстрыйВыбор?: SE.UseQuickChoiceEnterprise
  ВыделятьОтрицательные?: StringboolEnterprise
  ЗаполнятьИзДанныхЗаполнения?: StringboolEnterprise
  ЗначениеЗаполнения?: MetadataValueEnterprise
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

export type StandardAttributeDescriptionsXML = { "xr:StandardAttribute": StandardAttributeDescriptionXML[] }

export type StandardAttributeDescriptionsEnterprise = Partial<
  Record<StandartAttributeEnterprise, StandardAttributeDescriptionEnterprise>
>
