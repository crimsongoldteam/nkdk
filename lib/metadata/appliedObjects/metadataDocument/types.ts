import {
  AdditionalIndexes,
  AdditionalIndexesEnterprise,
  AdditionalIndexesXML,
} from "~/lib/metadata/commonObjects/additionalIndex/types"
import {
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsEnterprise,
  CharacteristicsDescriptionsXML,
} from "~/lib/metadata/commonObjects/characteristicsDescription/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import {
  MetadataAttributes,
  MetadataAttributesEnterprise,
  MetadataAttributesXML,
} from "~/lib/metadata/commonObjects/metadataAttribute/types"
import {
  MetadataCommands,
  MetadataCommandsEnterprise,
  MetadataCommandsXML,
} from "~/lib/metadata/commonObjects/metadataCommand/types"
import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorEnterprise,
  MetadataDocumentNumeratorXML,
} from "~/lib/metadata/commonObjects/metadataDocumentNumerator/types"
import {
  MetadataFields,
  MetadataFieldsEnterprise,
  MetadataFieldsXML,
} from "~/lib/metadata/commonObjects/metadataField/types"
import {
  MetadataItemLinks,
  MetadataItemLinksEnterprise,
  MetadataItemLinksXML,
} from "~/lib/metadata/commonObjects/metadataItemLink/types"
import {
  MetadataTabularSections,
  MetadataTabularSectionsEnterprise,
  MetadataTabularSectionsXML,
} from "~/lib/metadata/commonObjects/metadataTabularSection/types"
import {
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
  StandardAttributeDescriptionsXML,
} from "~/lib/metadata/commonObjects/standardAttributeDescription/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface MetadataDocument {
  actionsWritingOnPost?: SE.RegisterRecordsWritingOnPost
  additionalIndexes?: AdditionalIndexes
  attributes?: MetadataAttributes
  autonumbering?: boolean
  auxiliaryChoiceForm?: string
  auxiliaryListForm?: string
  auxiliaryObjectForm?: string
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
  numberAllowedLength?: SE.AllowedLength
  numberLength?: number
  numberPeriodicity?: SE.BusinessProcessNumberPeriodicity
  numberType?: SE.DocumentNumberType
  numerator?: MetadataDocumentNumerator
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
  NumberAllowedLength?: SE.AllowedLength
  NumberLength?: number
  NumberPeriodicity?: SE.BusinessProcessNumberPeriodicity
  NumberType?: SE.DocumentNumberType
  Numerator?: MetadataDocumentNumeratorXML
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

export interface MetadataDocumentEnterprise {
  ЗаписьДвиженийПриПроведении?: SE.RegisterRecordsWritingOnPostEnterprise
  ДополнительныеИндексы?: AdditionalIndexesEnterprise
  Реквизиты?: MetadataAttributesEnterprise
  Автонумерация?: boolean
  ДополнительнаяФормаДляВыбора?: string
  ДополнительнаяФормаСписка?: string
  ДополнительнаяФормаОбъекта?: string
  ВводитсяНаОсновании?: MetadataItemLinksEnterprise
  Характеристики?: CharacteristicsDescriptionsEnterprise
  КонтрольУникальности?: boolean
  РежимПолученияДанныхВыбораПриВводеПоСтроке?: SE.ChoiceDataGetModeOnInputByStringEnterprise
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputEnterprise
  Команды?: MetadataCommandsEnterprise
  Комментарий?: string
  СозданиеПриВводе?: SE.CreateOnInputEnterprise
  ИсторияДанных?: SE.DataHistoryUseEnterprise
  РежимУправленияБлокировкойДанных?: SE.DefaultDataLockControlModeEnterprise
  ПоляБлокировкиДанных?: MetadataFieldsEnterprise
  ОсновнаяФормаДляВыбора?: string
  ОсновнаяФормаСписка?: string
  ОсновнаяФормаОбъекта?: string
  ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных?: boolean
  Пояснение?: I8nTextEnterprise
  РасширенноеПредставлениеСписка?: I8nTextEnterprise
  РасширенноеПредставлениеОбъекта?: I8nTextEnterprise
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchEnterprise
  ПолнотекстовыйПоискПриВводеПоСтроке?: SE.FullTextSearchOnInputByStringEnterprise
  ВключатьСправкуВСодержание?: boolean
  ВводПоСтроке?: MetadataFieldsEnterprise
  ПредставлениеСписка?: I8nTextEnterprise
  ДопустимаяДлинаНомера?: SE.AllowedLengthEnterprise
  ДлинаНомера?: number
  ПериодичностьНомера?: SE.BusinessProcessNumberPeriodicityEnterprise
  ТипНомера?: SE.DocumentNumberTypeEnterprise
  Нумератор?: MetadataDocumentNumeratorEnterprise
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise
  ПредставлениеОбъекта?: I8nTextEnterprise
  Проведение?: SE.PostingEnterprise
  ПривилегированныйРежимПриПроведении?: boolean
  ПривилегированныйРежимПриОтменеПроведения?: boolean
  ОперативноеПроведение?: SE.RealTimePostingEnterprise
  Движения?: MetadataItemLinksEnterprise
  УдалениеДвижений?: SE.RegisterRecordsDeletionEnterprise
  СпособПоискаСтрокиПриВводеПоСтроке?: SE.SearchStringModeOnInputByStringEnterprise
  ЗаполнениеПоследовательностей?: SE.SequenceFillingEnterprise
  СтандартныеРеквизиты?: StandardAttributeDescriptionsEnterprise
  Синоним?: I8nTextEnterprise
  ТабличныеЧасти?: MetadataTabularSectionsEnterprise
  ОбновлятьИсториюДанныхСразуПослеЗаписи?: boolean
  ИспользоватьСтандартныеКоманды?: boolean
}
