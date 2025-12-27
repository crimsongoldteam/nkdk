import {
  MetadataCommands,
  MetadataCommandsEnterprise,
  MetadataCommandsXML,
} from "~/metadata/appliedObjects/metadataCommand/types"
import {
  MetadataDocumentNumerator,
  MetadataDocumentNumeratorEnterprise,
  MetadataDocumentNumeratorXML,
} from "~/metadata/appliedObjects/metadataDocumentNumerator/types"
import {
  AdditionalIndexes,
  AdditionalIndexesEnterprise,
  AdditionalIndexesXML,
} from "~/metadata/commonObjects/additionalIndex/types"
import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import {
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsEnterprise,
  CharacteristicsDescriptionsXML,
} from "~/metadata/commonObjects/characteristicsDescription/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import {
  MetadataAttributes,
  MetadataAttributesEnterprise,
  MetadataAttributesXML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import {
  MetadataFields,
  MetadataFieldsEnterprise,
  MetadataFieldsXML,
} from "~/metadata/commonObjects/metadataField/types"
import {
  MetadataItemLinks,
  MetadataItemLinksEnterprise,
  MetadataItemLinksXML,
} from "~/metadata/commonObjects/metadataRef/types"
import {
  MetadataTabularSections,
  MetadataTabularSectionsEnterprise,
  MetadataTabularSectionsXML,
} from "~/metadata/commonObjects/metadataTabularSection/types"
import {
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
  StandardAttributeDescriptionsXML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface MetadataDocument {
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
  Name: string
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
  Автонумерация?: StringboolEnterprise
  ВводитсяНаОсновании?: MetadataItemLinksEnterprise
  ВводПоСтроке?: MetadataFieldsEnterprise
  ВключатьСправкуВСодержание?: StringboolEnterprise
  ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных?: StringboolEnterprise
  Движения?: MetadataItemLinksEnterprise
  ДлинаНомера?: number
  ДополнительнаяФормаДляВыбора?: string
  ДополнительнаяФормаОбъекта?: string
  ДополнительнаяФормаСписка?: string
  ДополнительныеИндексы?: AdditionalIndexesEnterprise
  ДопустимаяДлинаНомера?: SE.AllowedLengthEnterprise
  ЗаписьДвиженийПриПроведении?: SE.RegisterRecordsWritingOnPostEnterprise
  ЗаполнениеПоследовательностей?: SE.SequenceFillingEnterprise
  Имя?: string
  ИспользоватьСтандартныеКоманды?: StringboolEnterprise
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputEnterprise
  ИсторияДанных?: SE.DataHistoryUseEnterprise
  Команды?: MetadataCommandsEnterprise
  Комментарий?: string
  КонтрольУникальности?: StringboolEnterprise
  Нумератор?: MetadataDocumentNumeratorEnterprise
  ОбновлятьИсториюДанныхСразуПослеЗаписи?: StringboolEnterprise
  ОперативноеПроведение?: SE.RealTimePostingEnterprise
  ОсновнаяФормаДляВыбора?: string
  ОсновнаяФормаОбъекта?: string
  ОсновнаяФормаСписка?: string
  ПериодичностьНомера?: SE.BusinessProcessNumberPeriodicityEnterprise
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchEnterprise
  ПолнотекстовыйПоискПриВводеПоСтроке?: SE.FullTextSearchOnInputByStringEnterprise
  ПоляБлокировкиДанных?: MetadataFieldsEnterprise
  Пояснение?: I8nTextEnterprise
  ПредставлениеОбъекта?: I8nTextEnterprise
  ПредставлениеСписка?: I8nTextEnterprise
  ПривилегированныйРежимПриОтменеПроведения?: StringboolEnterprise
  ПривилегированныйРежимПриПроведении?: StringboolEnterprise
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise
  Проведение?: SE.PostingEnterprise
  РасширенноеПредставлениеОбъекта?: I8nTextEnterprise
  РасширенноеПредставлениеСписка?: I8nTextEnterprise
  РежимПолученияДанныхВыбораПриВводеПоСтроке?: SE.ChoiceDataGetModeOnInputByStringEnterprise
  РежимУправленияБлокировкойДанных?: SE.DefaultDataLockControlModeEnterprise
  Реквизиты?: MetadataAttributesEnterprise
  Синоним?: I8nTextEnterprise
  СозданиеПриВводе?: SE.CreateOnInputEnterprise
  СпособПоискаСтрокиПриВводеПоСтроке?: SE.SearchStringModeOnInputByStringEnterprise
  СтандартныеРеквизиты?: StandardAttributeDescriptionsEnterprise
  ТабличныеЧасти?: MetadataTabularSectionsEnterprise
  ТипНомера?: SE.DocumentNumberTypeEnterprise
  УдалениеДвижений?: SE.RegisterRecordsDeletionEnterprise
  Характеристики?: CharacteristicsDescriptionsEnterprise
}
