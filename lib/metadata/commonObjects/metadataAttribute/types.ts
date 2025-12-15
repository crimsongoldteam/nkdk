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
  objectBelonging?: SE.ObjectBelonging
  passwordMode?: boolean
  quickChoice?: SE.UseQuickChoice
  synonym?: I8nText
  tooltip?: I8nText
  type?: TypeDescription
  use?: SE.AttributeUse
}

export interface MetadataAttributeXML {
  BinaryDataStorageLocationUse?: SE.BinaryDataStorageLocationUse
  BinaryDataStorageLocationUseField?: boolean
  ChoiceFoldersAndItems?: SE.FoldersAndItemsUse
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
  FillingValue?: MetadataValueXML
  Format?: I8nTextXML
  FullTextSearch?: SE.UseFullTextSearch
  Indexing?: SE.Indexing
  LinkByType?: TypeLinkXML
  MarkNegatives?: boolean
  Mask?: string
  MaxValue?: number
  MinValue?: number
  MultiLine?: boolean
  ObjectBelonging?: SE.ObjectBelonging
  PasswordMode?: boolean
  QuickChoice?: SE.UseQuickChoice
  Synonym?: I8nTextXML
  Tooltip?: I8nTextXML
  Type?: TypeDescriptionXML
  Use?: SE.AttributeUse
}

export interface MetadataAttributeEnterprise {
  ИспользованиеХраненияВХранилищеДвоичныхДанных?: SE.BinaryDataStorageLocationUseEnterprise
  ПолеИспользованияХраненияВХранилищеДвоичныхДанных?: boolean
  ВыборГруппИЭлементов?: SE.FoldersAndItemsUseEnterprise
  ФормаВыбора?: string
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputEnterprise
  СвязиПараметровВыбора?: ChoiceParameterLinksEnterprise
  ПараметрыВыбора?: ChoiceParameterLinksEnterprise
  Комментарий?: string
  СозданиеПриВводе?: SE.CreateOnInputEnterprise
  ИсторияДанных?: SE.DataHistoryUseEnterprise
  ФорматРедактирования?: I8nTextEnterprise
  РасширенноеРедактирование?: boolean
  ПроверкаЗаполнения?: SE.FillCheckingEnterprise
  ЗаполнятьИзДанныхЗаполнения?: boolean
  ЗначениеЗаполнения?: MetadataValueEnterprise
  Формат?: I8nTextEnterprise
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchEnterprise
  Индексирование?: SE.IndexingEnterprise
  СвязьПоТипу?: TypeLinkEnterprise
  ВыделятьОтрицательные?: boolean
  Маска?: string
  МаксимальноеЗначение?: number
  МинимальноеЗначение?: number
  МногострочныйРежим?: boolean
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise
  РежимПароля?: boolean
  БыстрыйВыбор?: SE.UseQuickChoiceEnterprise
  Синоним?: I8nTextEnterprise
  Подсказка?: I8nTextEnterprise
  Тип?: TypeDescriptionEnterprise
  Использование?: SE.AttributeUseEnterprise
}

export type MetadataAttributes = MetadataAttribute[]
export type MetadataAttributesXML = MetadataAttributeXML[]
export type MetadataAttributesEnterprise = MetadataAttributeEnterprise[]
