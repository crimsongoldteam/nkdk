import { createOwnerAttributeCollectionRuleBuilder } from "../../commonObjects/metadataAttribute/registerOwnerCollection"
import { createOwnerTabularSectionCollectionRuleBuilder } from "../../commonObjects/metadataTabularSection/registerOwnerCollection"
import { MetadataCommands, MetadataCommandsXML, MetadataCommandsYAML } from "../metadataCommand/types"
import {
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexesYAML,
} from "../../commonObjects/additionalIndex/types"
import { StringboolYAML } from "../../commonObjects/boolean/types"
import {
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsXML,
  CharacteristicsDescriptionsYAML,
} from "../../commonObjects/characteristicsDescription/types"
import { I8nText, I8nTextXML, I8nTextYAML } from "../../commonObjects/i8nText/types"
import {
  MetadataAttributes,
  MetadataAttributesXML,
  MetadataAttributesYAML,
} from "../../commonObjects/metadataAttribute/types"
import { MetadataFields, MetadataFieldsXML, MetadataFieldsYAML } from "../../commonObjects/metadataField/types"
import { MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinksYAML } from "../../commonObjects/metadataRef/types"
import {
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionsYAML,
} from "../../commonObjects/metadataTabularSection/types"
import {
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionsYAML,
} from "../../commonObjects/standardAttributeDescription/types"
import * as SE from "../../systemEnumerations/types"

export interface MetadataDocument {
  itemType?: "MetadataDocument"
  actionsWritingOnPost?: SE.RegisterRecordsWritingOnPost
  additionalIndexes?: AdditionalIndexes
  attributes?: MetadataAttributes
  autonumbering?: boolean
  auxiliaryChoiceForm?: string
  auxiliaryListForm?: string
  auxiliaryObjectForm?: string
  basedOn?: MetadataItemLinks
  characteristics?: CharacteristicsDescriptions
  checkUnique?: boolean
  choiceDataGetModeOnInputByString?: SE.ChoiceDataGetModeOnInputByString
  choiceHistoryOnInput?: SE.ChoiceHistoryOnInput
  commands?: MetadataCommands
  comment?: string
  createOnInput?: SE.CreateOnInput
  dataHistory?: SE.DataHistoryUse
  dataLockControlMode?: SE.DefaultDataLockControlMode
  dataLockFields?: MetadataFields
  defaultChoiceForm?: string
  defaultListForm?: string
  defaultObjectForm?: string
  executeAfterWriteDataHistoryVersionProcessing?: boolean
  explanation?: I8nText
  extendedListPresentation?: I8nText
  extendedObjectPresentation?: I8nText
  fullTextSearch?: SE.UseFullTextSearch
  fullTextSearchOnInputByString?: SE.FullTextSearchOnInputByString
  includeHelpInContents?: boolean
  inputByString?: MetadataFields
  listPresentation?: I8nText
  name: string
  numberAllowedLength?: SE.AllowedLength
  numberLength?: number
  numberPeriodicity?: SE.BusinessProcessNumberPeriodicity
  numberType?: SE.DocumentNumberType
  numerator?: string
  objectBelonging?: SE.ObjectBelonging
  objectPresentation?: I8nText
  posting?: SE.Posting
  privilegedPostingMode?: boolean
  privilegedUnpostingMode?: boolean
  realTimePosting?: SE.RealTimePosting
  registerRecords?: MetadataItemLinks
  registerRecordsDeletion?: SE.RegisterRecordsDeletion
  searchStringModeOnInputByString?: SE.SearchStringModeOnInputByString
  sequenceFilling?: SE.SequenceFilling
  standardAttributes?: StandardAttributeDescriptions
  synonym?: I8nText
  tabularSections?: MetadataTabularSections
  updateDataHistoryImmediatelyAfterWrite?: boolean
  useStandardCommands?: boolean
}

export interface MetadataDocumentXML {
  ActionsWritingOnPost?: SE.RegisterRecordsWritingOnPost
  AdditionalIndexes?: AdditionalIndexesXML
  Attributes?: MetadataAttributesXML
  Autonumbering?: boolean
  AuxiliaryChoiceForm?: string
  AuxiliaryListForm?: string
  AuxiliaryObjectForm?: string
  BasedOn?: MetadataItemLinksXML
  Characteristics?: CharacteristicsDescriptionsXML
  CheckUnique?: boolean
  ChoiceDataGetModeOnInputByString?: SE.ChoiceDataGetModeOnInputByString
  ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput
  Commands?: MetadataCommandsXML
  Comment?: string
  CreateOnInput?: SE.CreateOnInput
  DataHistory?: SE.DataHistoryUse
  DataLockControlMode?: SE.DefaultDataLockControlMode
  DataLockFields?: MetadataFieldsXML
  DefaultChoiceForm?: string
  DefaultListForm?: string
  DefaultObjectForm?: string
  ExecuteAfterWriteDataHistoryVersionProcessing?: boolean
  Explanation?: I8nTextXML
  ExtendedListPresentation?: I8nTextXML
  ExtendedObjectPresentation?: I8nTextXML
  FullTextSearch?: SE.UseFullTextSearch
  FullTextSearchOnInputByString?: SE.FullTextSearchOnInputByString
  IncludeHelpInContents?: boolean
  InputByString?: MetadataFieldsXML
  ListPresentation?: I8nTextXML
  Name: string
  NumberAllowedLength?: SE.AllowedLength
  NumberLength?: number
  NumberPeriodicity?: SE.BusinessProcessNumberPeriodicity
  NumberType?: SE.DocumentNumberType
  Numerator?: string
  ObjectBelonging?: SE.ObjectBelonging
  ObjectPresentation?: I8nTextXML
  Posting?: SE.Posting
  PrivilegedPostingMode?: boolean
  PrivilegedUnpostingMode?: boolean
  RealTimePosting?: SE.RealTimePosting
  RegisterRecords?: MetadataItemLinksXML
  RegisterRecordsDeletion?: SE.RegisterRecordsDeletion
  SearchStringModeOnInputByString?: SE.SearchStringModeOnInputByString
  SequenceFilling?: SE.SequenceFilling
  StandardAttributes?: StandardAttributeDescriptionsXML
  Synonym?: I8nTextXML
  TabularSections?: MetadataTabularSectionsXML
  UpdateDataHistoryImmediatelyAfterWrite?: boolean
  UseStandardCommands?: boolean
}

export interface MetadataDocumentYAML {
  Автонумерация?: StringboolYAML
  ВводитсяНаОсновании?: MetadataItemLinksYAML
  ВводПоСтроке?: MetadataFieldsYAML
  ВключатьСправкуВСодержание?: StringboolYAML
  ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных?: StringboolYAML
  Движения?: MetadataItemLinksYAML
  ДлинаНомера?: number
  ДополнительнаяФормаДляВыбора?: string
  ДополнительнаяФормаОбъекта?: string
  ДополнительнаяФормаСписка?: string
  ДополнительныеИндексы?: AdditionalIndexesYAML
  ДопустимаяДлинаНомера?: SE.AllowedLengthYAML
  ЗаписьДвиженийПриПроведении?: SE.RegisterRecordsWritingOnPostYAML
  ЗаполнениеПоследовательностей?: SE.SequenceFillingYAML
  Имя?: string
  ИспользоватьСтандартныеКоманды?: StringboolYAML
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputYAML
  ИсторияДанных?: SE.DataHistoryUseYAML
  Команды?: MetadataCommandsYAML
  Комментарий?: string
  КонтрольУникальности?: StringboolYAML
  Нумератор?: string
  ОбновлятьИсториюДанныхСразуПослеЗаписи?: StringboolYAML
  ОперативноеПроведение?: SE.RealTimePostingYAML
  ОсновнаяФормаДляВыбора?: string
  ОсновнаяФормаОбъекта?: string
  ОсновнаяФормаСписка?: string
  ПериодичностьНомера?: SE.BusinessProcessNumberPeriodicityYAML
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchYAML
  ПолнотекстовыйПоискПриВводеПоСтроке?: SE.FullTextSearchOnInputByStringYAML
  ПоляБлокировкиДанных?: MetadataFieldsYAML
  Пояснение?: I8nTextYAML
  ПредставлениеОбъекта?: I8nTextYAML
  ПредставлениеСписка?: I8nTextYAML
  ПривилегированныйРежимПриОтменеПроведения?: StringboolYAML
  ПривилегированныйРежимПриПроведении?: StringboolYAML
  ПринадлежностьОбъекта?: SE.ObjectBelongingYAML
  Проведение?: SE.PostingYAML
  РасширенноеПредставлениеОбъекта?: I8nTextYAML
  РасширенноеПредставлениеСписка?: I8nTextYAML
  РежимПолученияДанныхВыбораПриВводеПоСтроке?: SE.ChoiceDataGetModeOnInputByStringYAML
  РежимУправленияБлокировкойДанных?: SE.DefaultDataLockControlModeYAML
  Реквизиты?: MetadataAttributesYAML
  Синоним?: I8nTextYAML
  СозданиеПриВводе?: SE.CreateOnInputYAML
  СпособПоискаСтрокиПриВводеПоСтроке?: SE.SearchStringModeOnInputByStringYAML
  СтандартныеРеквизиты?: StandardAttributeDescriptionsYAML
  ТабличныеЧасти?: MetadataTabularSectionsYAML
  ТипНомера?: SE.DocumentNumberTypeYAML
  УдалениеДвижений?: SE.RegisterRecordsDeletionYAML
  Характеристики?: CharacteristicsDescriptionsYAML
}

export const metadataDocumentAttributesRule = createOwnerAttributeCollectionRuleBuilder("MetadataDocumentAttributes")
export const metadataDocumentTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataDocumentTabularSections"
)
