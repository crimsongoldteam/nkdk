import { Type } from "@sinclair/typebox"
import { StringboolXML, StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { I8nTextXML, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import {
  MetadataPrimitiveValueXML,
  MetadataValueXML,
  MetadataValueYAML,
} from "~/metadata/commonObjects/metadataValue/types"
import { TypeDescriptionXML, TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { TypeLinkXML, TypeLinkYAML } from "~/metadata/commonObjects/typeLink/types"
import { ChoiceParameterLinksXML, ChoiceParameterLinksYAML } from "~/metadata/commonObjects/сhoiceParameterLinks/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataNameYAML } from "../metadataName/types"
import { ChoiceParametersXML, ChoiceParametersYAML } from "../сhoiceParameters/types"
import { MetadataAttributeRules } from "./rules"

export type MetadataAttribute = MetadataTypeByRule<typeof MetadataAttributeRules>

export interface MetadataAttributeXML {
  _uuid: string
  Properties: {
    BinaryDataStorageLocationUse?: SE.BinaryDataStorageLocationUse
    BinaryDataStorageLocationUseField?: string
    ChoiceFoldersAndItems?: SE.FoldersAndItemsUse
    ChoiceForm?: string
    ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput
    ChoiceParameterLinks?: ChoiceParameterLinksXML
    ChoiceParameters?: ChoiceParametersXML
    Comment?: string
    CreateOnInput?: SE.CreateOnInput
    DataHistory?: SE.DataHistoryUse
    EditFormat?: I8nTextXML
    ExtendedEdit?: StringboolXML
    FillChecking?: SE.FillChecking
    FillFromFillingValue?: StringboolXML
    FillValue?: MetadataValueXML
    Format?: I8nTextXML
    FullTextSearch?: SE.UseFullTextSearch
    Indexing?: SE.Indexing
    LinkByType?: TypeLinkXML
    MarkNegatives?: StringboolXML
    Mask?: string
    MaxValue?: MetadataPrimitiveValueXML
    MinValue?: MetadataPrimitiveValueXML
    MultiLine?: StringboolXML
    Name: string
    ObjectBelonging?: SE.ObjectBelonging
    PasswordMode?: StringboolXML
    QuickChoice?: SE.UseQuickChoice
    Synonym: I8nTextXML
    ToolTip?: I8nTextXML
    Type: TypeDescriptionXML
    Use?: SE.AttributeUse
  }
}

export interface MetadataAttributeFullYAML {
  Тип: TypeDescriptionYAML
  БыстрыйВыбор?: SE.UseQuickChoiceYAML
  ВыборГруппИЭлементов?: SE.FoldersAndItemsUseYAML
  ВыделятьОтрицательные?: StringboolYAML
  ЗаполнятьИзДанныхЗаполнения?: StringboolYAML
  ЗначениеЗаполнения?: MetadataValueYAML
  Имя?: string
  Индексирование?: SE.IndexingYAML
  Использование?: SE.AttributeUseYAML
  ИспользованиеХраненияВХранилищеДвоичныхДанных?: SE.BinaryDataStorageLocationUseYAML
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputYAML
  ИсторияДанных?: SE.DataHistoryUseYAML
  Комментарий?: string
  МаксимальноеЗначение?: number
  Маска?: string
  МинимальноеЗначение?: number
  МногострочныйРежим?: StringboolYAML
  ПараметрыВыбора?: ChoiceParametersYAML
  Подсказка?: I8nTextYAML
  ПолеИспользованияХраненияВХранилищеДвоичныхДанных?: string
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchYAML
  ПринадлежностьОбъекта?: SE.ObjectBelongingYAML
  ПроверкаЗаполнения?: SE.FillCheckingYAML
  РасширенноеРедактирование?: StringboolYAML
  РежимПароля?: StringboolYAML
  СвязиПараметровВыбора?: ChoiceParameterLinksYAML
  СвязьПоТипу?: TypeLinkYAML
  Синоним?: I8nTextYAML
  СозданиеПриВводе?: SE.CreateOnInputYAML
  ФормаВыбора?: string
  Формат?: I8nTextYAML
  ФорматРедактирования?: I8nTextYAML
}

export type MetadataAttributeYAML = MetadataAttributeFullYAML | TypeDescriptionYAML

export type MetadataAttributes = MetadataAttribute[]

export type MetadataAttributesXML = MetadataAttributeXML | MetadataAttributeXML[]

export const MetadataAttributesJSONSchema = Type.Record(Type.String(), Type.Any())
export type MetadataAttributesYAML = Record<MetadataNameYAML, MetadataAttributeYAML>

export type MetadataTabularSectionAttributes = MetadataAttributes
export type MetadataTabularSectionAttributesXML = MetadataAttributesXML
export type MetadataTabularSectionAttributesYAML = MetadataAttributesYAML

export type MetadataDocumentAttribute = MetadataAttribute
export type MetadataDocumentAttributes = MetadataAttributes
export type MetadataDocumentAttributesXML = MetadataAttributesXML
export type MetadataDocumentAttributesYAML = MetadataAttributesYAML

export type MetadataReportAttributes = MetadataAttributes
export type MetadataReportAttributesXML = MetadataAttributesXML
export type MetadataReportAttributesYAML = MetadataAttributesYAML
