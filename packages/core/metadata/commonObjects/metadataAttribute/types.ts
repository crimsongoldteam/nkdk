import { tags } from "typia"
import { StringboolXML, StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextXML, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import {
  MetadataSimpleValueXML,
  MetadataValue,
  MetadataValueXML,
  MetadataValueYAML,
} from "~/metadata/commonObjects/metadataValue/types"
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
import { MetadataNameYAML } from "../metadataName/types"
import { ChoiceParameters, ChoiceParametersXML, ChoiceParametersYAML } from "../сhoiceParameters/types"

export interface MetadataAttribute {
  binaryDataStorageLocationUse?: SE.BinaryDataStorageLocationUse
  binaryDataStorageLocationUseField?: boolean
  choiceFoldersAndItems?: SE.FoldersAndItemsUse
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
  indexing?: SE.Indexing
  linkByType?: TypeLink
  markNegatives?: boolean
  mask?: string
  maxValue?: number
  minValue?: number
  multiLine?: boolean
  name: string
  objectBelonging?: SE.ObjectBelonging
  passwordMode?: boolean
  quickChoice?: SE.UseQuickChoice
  synonym: I8nText
  toolTip?: I8nText
  type: TypeDescription
  use?: SE.AttributeUse
}

export interface MetadataAttributeXML {
  _uuid: string & tags.Format<"uuid">
  Properties: {
    BinaryDataStorageLocationUse?: SE.BinaryDataStorageLocationUse
    BinaryDataStorageLocationUseField?: StringboolXML
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
    MaxValue?: MetadataSimpleValueXML
    MinValue?: MetadataSimpleValueXML
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
  ПолеИспользованияХраненияВХранилищеДвоичныхДанных?: StringboolYAML
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

export type MetadataAttributesYAML = Record<MetadataNameYAML, MetadataAttributeYAML>
