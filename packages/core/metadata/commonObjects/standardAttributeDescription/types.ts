import { Type } from "@sinclair/typebox"
import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextXML, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataValue, MetadataValueXML, MetadataValueYAML } from "~/metadata/commonObjects/metadataValue/types"
import {
  TypeDescription,
  TypeDescriptionXML,
  TypeDescriptionYAML,
} from "~/metadata/commonObjects/typeDescription/types"
import { TypeLink, TypeLinkXML, TypeLinkYAML } from "~/metadata/commonObjects/typeLink/types"
import {
  ChoiceParameterLinks,
  ChoiceParameterLinksXML,
  ChoiceParameterLinksYAML,
} from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { ChoiceParameters, ChoiceParametersXML, ChoiceParametersYAML } from "../сhoiceParameters/types"

export const StandartAttributeNameToYAML = {
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

export const StandartAttributeNameFromYAML = (name: string): StandartAttributeName => {
  return Object.keys(StandartAttributeNameToYAML).find(
    (key) => StandartAttributeNameToYAML[key as StandartAttributeName] === name
  ) as StandartAttributeName
}

export type StandartAttributeName = keyof typeof StandartAttributeNameToYAML
export type StandartAttributeYAML = (typeof StandartAttributeNameToYAML)[keyof typeof StandartAttributeNameToYAML]

// export const PredefinedNameToYAML

export interface StandardAttributeDescription {
  choiceForm?: string
  choiceHistoryOnInput?: SE.ChoiceHistoryOnInput
  choiceParameterLinks?: ChoiceParameterLinks
  choiceParameters?: ChoiceParameters
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
  "xr:ChoiceParameters"?: ChoiceParametersXML
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

export interface StandardAttributeDescriptionYAML {
  БыстрыйВыбор?: SE.UseQuickChoiceYAML
  ВыделятьОтрицательные?: StringboolYAML
  ЗаполнятьИзДанныхЗаполнения?: StringboolYAML
  ЗначениеЗаполнения?: MetadataValueYAML
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputYAML
  ИсторияДанных?: SE.DataHistoryUseYAML
  Комментарий?: string
  МаксимальноеЗначение?: number
  Маска?: string
  МинимальноеЗначение?: number
  МногострочныйРежим?: StringboolYAML
  ПараметрыВыбора?: ChoiceParametersYAML
  Подсказка?: I8nTextYAML
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchYAML
  ПроверкаЗаполнения?: SE.FillCheckingYAML
  РасширенноеРедактирование?: StringboolYAML
  РежимПароля?: StringboolYAML
  РежимСокращенияТипа?: SE.TypeReductionModeYAML
  СвязиПараметровВыбора?: ChoiceParameterLinksYAML
  СвязьПоТипу?: TypeLinkYAML
  Синоним?: I8nTextYAML
  СозданиеПриВводе?: SE.CreateOnInputYAML
  Тип?: TypeDescriptionYAML
  ФормаВыбора?: string
  Формат?: I8nTextYAML
  ФорматРедактирования?: I8nTextYAML
}

export type StandardAttributeDescriptions = StandardAttributeDescription[]

export type StandardAttributeDescriptionsXML = { "xr:StandardAttribute": StandardAttributeDescriptionXML[] }

export const StandardAttributeDescriptionsJSONSchema = Type.Record(Type.String(), Type.Any())
export type StandardAttributeDescriptionsYAML = Partial<Record<StandartAttributeYAML, StandardAttributeDescriptionYAML>>
