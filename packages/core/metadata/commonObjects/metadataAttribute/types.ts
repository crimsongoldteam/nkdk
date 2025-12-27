import { tags } from "typia"
import { StringboolEnterprise, StringboolXML } from "~/packages/core/metadata/commonObjects/boolean/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/packages/core/metadata/commonObjects/i8nText/types"
import {
  MetadataSimpleValueXML,
  MetadataValue,
  MetadataValueEnterprise,
  MetadataValueXML,
} from "~/packages/core/metadata/commonObjects/metadataValue/types"
import {
  TypeDescription,
  TypeDescriptionEnterprise,
  TypeDescriptionXML,
} from "~/packages/core/metadata/commonObjects/typeDescription/types"
import { TypeLink, TypeLinkEnterprise, TypeLinkXML } from "~/packages/core/metadata/commonObjects/typeLink/types"
import {
  ChoiceParameterLinks,
  ChoiceParameterLinksEnterprise,
  ChoiceParameterLinksXML,
} from "~/packages/core/metadata/commonObjects/сhoiceParameterLinks/types"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"
import { MetadataName } from "../metadataName/types"

export interface MetadataAttribute {
  binaryDataStorageLocationUse?: SE.BinaryDataStorageLocationUse
  binaryDataStorageLocationUseField?: boolean
  choiceFoldersAndItems?: SE.FoldersAndItemsUse
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
  fillingValue?: MetadataValue
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
  synonym?: I8nText
  tooltip?: I8nText
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
    ChoiceParameters?: ChoiceParameterLinksXML
    Comment?: string
    CreateOnInput?: SE.CreateOnInput
    DataHistory?: SE.DataHistoryUse
    EditFormat?: I8nTextXML
    ExtendedEdit?: StringboolXML
    FillChecking?: SE.FillChecking
    FillFromFillingValue?: StringboolXML
    FillingValue?: MetadataValueXML
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
    Synonym?: I8nTextXML
    Tooltip?: I8nTextXML
    Type: TypeDescriptionXML
    Use?: SE.AttributeUse
  }
}

export interface MetadataAttributeFullEnterprise {
  Тип: TypeDescriptionEnterprise
  БыстрыйВыбор?: SE.UseQuickChoiceEnterprise
  ВыборГруппИЭлементов?: SE.FoldersAndItemsUseEnterprise
  ВыделятьОтрицательные?: StringboolEnterprise
  ЗаполнятьИзДанныхЗаполнения?: StringboolEnterprise
  ЗначениеЗаполнения?: MetadataValueEnterprise
  Имя?: string
  Индексирование?: SE.IndexingEnterprise
  Использование?: SE.AttributeUseEnterprise
  ИспользованиеХраненияВХранилищеДвоичныхДанных?: SE.BinaryDataStorageLocationUseEnterprise
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputEnterprise
  ИсторияДанных?: SE.DataHistoryUseEnterprise
  Комментарий?: string
  МаксимальноеЗначение?: MetadataValueEnterprise
  Маска?: string
  МинимальноеЗначение?: MetadataValueEnterprise
  МногострочныйРежим?: StringboolEnterprise
  ПараметрыВыбора?: ChoiceParameterLinksEnterprise
  Подсказка?: I8nTextEnterprise
  ПолеИспользованияХраненияВХранилищеДвоичныхДанных?: StringboolEnterprise
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchEnterprise
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise
  ПроверкаЗаполнения?: SE.FillCheckingEnterprise
  РасширенноеРедактирование?: StringboolEnterprise
  РежимПароля?: StringboolEnterprise
  СвязиПараметровВыбора?: ChoiceParameterLinksEnterprise
  СвязьПоТипу?: TypeLinkEnterprise
  Синоним?: I8nTextEnterprise
  СозданиеПриВводе?: SE.CreateOnInputEnterprise
  ФормаВыбора?: string
  Формат?: I8nTextEnterprise
  ФорматРедактирования?: I8nTextEnterprise
}

export type MetadataAttributeEnterprise = MetadataAttributeFullEnterprise | TypeDescriptionEnterprise

export type MetadataAttributes = MetadataAttribute[]

export type MetadataAttributesXML = MetadataAttributeXML | MetadataAttributeXML[]

export type MetadataAttributesEnterprise = Record<MetadataName, MetadataAttributeEnterprise>
