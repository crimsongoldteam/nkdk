import { tags } from "typia"
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
    Name: string
    ObjectBelonging?: SE.ObjectBelonging
    PasswordMode?: boolean
    QuickChoice?: SE.UseQuickChoice
    Synonym?: I8nTextXML
    Tooltip?: I8nTextXML
    Type: TypeDescriptionXML
    Use?: SE.AttributeUse
  }
}

export interface MetadataAttributeEnterprise {
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
  МаксимальноеЗначение?: number
  Маска?: string
  МинимальноеЗначение?: number
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

export type MetadataAttributes = MetadataAttribute[]

export type MetadataAttributesXML = MetadataAttributeXML | MetadataAttributeXML[]

export type MetadataAttributesEnterprise = Record<string, MetadataAttributeEnterprise>
