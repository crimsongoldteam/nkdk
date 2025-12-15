import { Color, ColorXML, ColorEnterprise } from "~/lib/metadata/commonObjects/color/types";
import { I8nText, I8nTextXML, I8nTextEnterprise } from "~/lib/metadata/commonObjects/i8nText/types";
import { Picture, PictureXML, PictureEnterprise } from "~/lib/metadata/commonObjects/pictures/types";
import { UserVisible, UserVisibleXML, UserVisibleEnterprise } from "~/lib/metadata/commonObjects/userVisible/types";
import * as SE from "~/lib/metadata/systemEnumerations/types";
import { FormGroup, FormGroupXML, FormGroupEnterprise } from "../formGroup/types";
import { Table, TableXML, TableEnterprise } from "../table/types";
import { CommandBar, CommandBarXML, CommandBarEnterprise } from "../commandBar/types";
import { BaseElement, BaseElementXML, BaseElementEnterprise } from "../baseElement/types";
import { Font, FontXML, FontEnterprise } from "~/lib/metadata/commonObjects/font/types";
import { TypeDescription, TypeDescriptionXML, TypeDescriptionEnterprise } from "~/lib/metadata/commonObjects/typeDescription/types";
import { Border, BorderXML, BorderEnterprise } from "~/lib/metadata/commonObjects/border/types";
import { FormField, FormFieldXML, FormFieldEnterprise } from "../formField/types";
import { FormDecoration, FormDecorationEnterprise, FormDecorationXML } from "../formDecoration/types"
import { ChoiceList, ChoiceListXML, ChoiceListEnterprise } from "~/lib/metadata/commonObjects/choiceList/types"
import { FormItemAddition, FormItemAdditionXML, FormItemAdditionEnterprise } from "../formItemAddition/types"
import { TypeLink, TypeLinkXML, TypeLinkEnterprise } from "~/lib/metadata/commonObjects/typeLink/types"
import { ChoiceParameterLinks, ChoiceParameterLinksXML, ChoiceParameterLinksEnterprise } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/types"
import { SearchStringAddition, SearchStringAdditionXML, SearchStringAdditionEnterprise } from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { ViewStatusAddition, ViewStatusAdditionXML, ViewStatusAdditionEnterprise } from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { SearchControlAddition, SearchControlAdditionXML, SearchControlAdditionEnterprise } from "~/lib/metadata/forms/elements/searchControlAddition/types"
import { CommandSet, CommandSetXML, CommandSetEnterprise } from "~/lib/metadata/forms/commandSet/types"
import { EventsXML } from "~/lib/metadata/forms/events/types";
import { ChildItems, ChildItemsXML } from "../childItems/types";
import { MetadataAttributes, MetadataAttributesEnterprise, MetadataAttributesXML } from "~/lib/metadata/commonObjects/metadataAttribute/types"
import { StandardAttributeDescriptions, StandardAttributeDescriptionsXML, StandardAttributeDescriptionsEnterprise } from "~/lib/metadata/commonObjects/standardAttributeDescription/types";
import { MetadataValue, MetadataValueXML, MetadataValueEnterprise } from "~/lib/metadata/commonObjects/metadataValue/types";
import { MetadataTabularSections, MetadataTabularSectionsXML, MetadataTabularSectionsEnterprise } from "~/lib/metadata/commonObjects/metadataTabularSection/types";
import { FieldList, FieldListXML, FieldListEnterprise } from "~/lib/metadata/commonObjects/field/types"
import { PredefinedList, PredefinedListXML, PredefinedListEnterprise } from "~/lib/metadata/commonObjects/predifined/types"
import { MetadataCommands, MetadataCommandsXML, MetadataCommandsEnterprise } from "~/lib/metadata/commonObjects/metadataCommand/types"
import { MetadataItemLinks, MetadataItemLinksEnterprise,MetadataItemLinksXML } from "~/lib/metadata/commonObjects/metadataItemLink/types"
import { IndexFields, IndexFieldsXML, IndexFieldsEnterprise } from "~/lib/metadata/commonObjects/indexField/types"
import { MetadataFields, MetadataFieldsXML, MetadataFieldsEnterprise } from "~/lib/metadata/commonObjects/metadataField/types";
import { MetadataItemLink, MetadataItemLinkEnterprise, MetadataItemLinkXML } from "~/lib/metadata/commonObjects/metadataItemLink/types"
import { AdditionalIndexes, AdditionalIndexesXML, AdditionalIndexesEnterprise } from "~/lib/metadata/commonObjects/additionalIndex/types";
import { CharacteristicsDescriptions, CharacteristicsDescriptionsXML, CharacteristicsDescriptionsEnterprise } from "~/lib/metadata/commonObjects/characteristicsDescription/types";
import { MetadataCommandGroup, MetadataCommandGroupXML, MetadataCommandGroupEnterprise } from "~/lib/metadata/commonObjects/metadataCommandGroup/types";



export interface MetadataDocument  {

  actionsWritingOnPost?: SE.RegisterRecordsWritingOnPost,
  additionalIndexes?: AdditionalIndexes,
  attributes?: КоллекцияОбъектовМетаданных,
  autonumbering?: boolean,
  auxiliaryChoiceForm?: string,
  auxiliaryListForm?: string,
  auxiliaryObjectForm?: string,
  basedOn?: КоллекцияЗначенийСвойстваОбъектаМетаданных,
  characteristics?: ОписанияХарактеристик,
  checkUnique?: boolean,
  choiceDataGetModeOnInputByString?: SE.ChoiceDataGetModeOnInputByString,
  choiceHistoryOnInput?: SE.ChoiceHistoryOnInput,
  commands?: КоллекцияОбъектовМетаданных,
  comment?: string,
  createOnInput?: SE.CreateOnInput,
  dataHistory?: SE.DataHistoryUse,
  dataLockControlMode?: SE.DefaultDataLockControlMode,
  dataLockFields?: СписокПолей,
  defaultChoiceForm?: string,
  defaultListForm?: string,
  defaultObjectForm?: string,
  executeAfterWriteDataHistoryVersionProcessing?: boolean,
  explanation?: string,
  extendedListPresentation?: string,
  extendedObjectPresentation?: string,
  forms?: КоллекцияОбъектовМетаданных,
  fullTextSearch?: SE.UseFullTextSearch,
  fullTextSearchOnInputByString?: SE.FullTextSearchOnInputByString,
  help?: Неопределено,
  includeHelpInContents?: boolean,
  inputByString?: СписокПолей,
  listPresentation?: string,
  managerModule?: Неопределено,
  numberAllowedLength?: SE.AllowedLength,
  numberLength?: number,
  numberPeriodicity?: SE.BusinessProcessNumberPeriodicity,
  numberType?: SE.DocumentNumberType,
  numerator?: ОбъектМетаданных: Нумератор,
  objectBelonging?: SE.ObjectBelonging,
  objectModule?: Неопределено,
  objectPresentation?: string,
  posting?: SE.Posting,
  privilegedPostingMode?: boolean,
  privilegedUnpostingMode?: boolean,
  realTimePosting?: SE.RealTimePosting,
  registerRecords?: КоллекцияЗначенийСвойстваОбъектаМетаданных,
  registerRecordsDeletion?: SE.RegisterRecordsDeletion,
  searchStringModeOnInputByString?: SE.SearchStringModeOnInputByString,
  sequenceFilling?: SE.SequenceFilling,
  standardAttributes?: ОписанияСтандартныхРеквизитов,
  synonym?: string,
  tabularSections?: КоллекцияОбъектовМетаданных,
  templates?: КоллекцияОбъектовМетаданных,
  updateDataHistoryImmediatelyAfterWrite?: boolean,
  useStandardCommands?: boolean,
}

export interface MetadataDocumentXML  {
  
  ActionsWritingOnPost?: SE.RegisterRecordsWritingOnPost,
  AdditionalIndexes?: AdditionalIndexesXML,
  Attributes?: КоллекцияОбъектовМетаданныхXML,
  Autonumbering?: boolean,
  AuxiliaryChoiceForm?: string,
  AuxiliaryListForm?: string,
  AuxiliaryObjectForm?: string,
  BasedOn?: КоллекцияЗначенийСвойстваОбъектаМетаданныхXML,
  Characteristics?: ОписанияХарактеристикXML,
  CheckUnique?: boolean,
  ChoiceDataGetModeOnInputByString?: SE.ChoiceDataGetModeOnInputByString,
  ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput,
  Commands?: КоллекцияОбъектовМетаданныхXML,
  Comment?: string,
  CreateOnInput?: SE.CreateOnInput,
  DataHistory?: SE.DataHistoryUse,
  DataLockControlMode?: SE.DefaultDataLockControlMode,
  DataLockFields?: СписокПолейXML,
  DefaultChoiceForm?: string,
  DefaultListForm?: string,
  DefaultObjectForm?: string,
  ExecuteAfterWriteDataHistoryVersionProcessing?: boolean,
  Explanation?: string,
  ExtendedListPresentation?: string,
  ExtendedObjectPresentation?: string,
  Forms?: КоллекцияОбъектовМетаданныхXML,
  FullTextSearch?: SE.UseFullTextSearch,
  FullTextSearchOnInputByString?: SE.FullTextSearchOnInputByString,
  Help?: НеопределеноXML,
  IncludeHelpInContents?: boolean,
  InputByString?: СписокПолейXML,
  ListPresentation?: string,
  ManagerModule?: НеопределеноXML,
  NumberAllowedLength?: SE.AllowedLength,
  NumberLength?: number,
  NumberPeriodicity?: SE.BusinessProcessNumberPeriodicity,
  NumberType?: SE.DocumentNumberType,
  Numerator?: ОбъектМетаданных: НумераторXML,
  ObjectBelonging?: SE.ObjectBelonging,
  ObjectModule?: НеопределеноXML,
  ObjectPresentation?: string,
  Posting?: SE.Posting,
  PrivilegedPostingMode?: boolean,
  PrivilegedUnpostingMode?: boolean,
  RealTimePosting?: SE.RealTimePosting,
  RegisterRecords?: КоллекцияЗначенийСвойстваОбъектаМетаданныхXML,
  RegisterRecordsDeletion?: SE.RegisterRecordsDeletion,
  SearchStringModeOnInputByString?: SE.SearchStringModeOnInputByString,
  SequenceFilling?: SE.SequenceFilling,
  StandardAttributes?: ОписанияСтандартныхРеквизитовXML,
  Synonym?: string,
  TabularSections?: КоллекцияОбъектовМетаданныхXML,
  Templates?: КоллекцияОбъектовМетаданныхXML,
  UpdateDataHistoryImmediatelyAfterWrite?: boolean,
  UseStandardCommands?: boolean,
}

export interface MetadataDocumentEnterprise  {
  ЗаписьДвиженийПриПроведении?: SE.RegisterRecordsWritingOnPostEnterprise,
  ДополнительныеИндексы?: AdditionalIndexesEnterprise,
  Реквизиты?: КоллекцияОбъектовМетаданныхEnterprise,
  Автонумерация?: boolean,
  ДополнительнаяФормаДляВыбора?: string,
  ДополнительнаяФормаСписка?: string,
  ДополнительнаяФормаОбъекта?: string,
  ВводитсяНаОсновании?: КоллекцияЗначенийСвойстваОбъектаМетаданныхEnterprise,
  Характеристики?: ОписанияХарактеристикEnterprise,
  КонтрольУникальности?: boolean,
  РежимПолученияДанныхВыбораПриВводеПоСтроке?: SE.ChoiceDataGetModeOnInputByStringEnterprise,
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputEnterprise,
  Команды?: КоллекцияОбъектовМетаданныхEnterprise,
  Комментарий?: string,
  СозданиеПриВводе?: SE.CreateOnInputEnterprise,
  ИсторияДанных?: SE.DataHistoryUseEnterprise,
  РежимУправленияБлокировкойДанных?: SE.DefaultDataLockControlModeEnterprise,
  ПоляБлокировкиДанных?: СписокПолейEnterprise,
  ОсновнаяФормаДляВыбора?: string,
  ОсновнаяФормаСписка?: string,
  ОсновнаяФормаОбъекта?: string,
  ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных?: boolean,
  Пояснение?: string,
  РасширенноеПредставлениеСписка?: string,
  РасширенноеПредставлениеОбъекта?: string,
  Формы?: КоллекцияОбъектовМетаданныхEnterprise,
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchEnterprise,
  ПолнотекстовыйПоискПриВводеПоСтроке?: SE.FullTextSearchOnInputByStringEnterprise,
  Справка?: НеопределеноEnterprise,
  ВключатьСправкуВСодержание?: boolean,
  ВводПоСтроке?: СписокПолейEnterprise,
  ПредставлениеСписка?: string,
  МодульМенеджера?: НеопределеноEnterprise,
  ДопустимаяДлинаНомера?: SE.AllowedLengthEnterprise,
  ДлинаНомера?: number,
  ПериодичностьНомера?: SE.BusinessProcessNumberPeriodicityEnterprise,
  ТипНомера?: SE.DocumentNumberTypeEnterprise,
  Нумератор?: ОбъектМетаданных: НумераторEnterprise,
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise,
  МодульОбъекта?: НеопределеноEnterprise,
  ПредставлениеОбъекта?: string,
  Проведение?: SE.PostingEnterprise,
  ПривилегированныйРежимПриПроведении?: boolean,
  ПривилегированныйРежимПриОтменеПроведения?: boolean,
  ОперативноеПроведение?: SE.RealTimePostingEnterprise,
  Движения?: КоллекцияЗначенийСвойстваОбъектаМетаданныхEnterprise,
  УдалениеДвижений?: SE.RegisterRecordsDeletionEnterprise,
  СпособПоискаСтрокиПриВводеПоСтроке?: SE.SearchStringModeOnInputByStringEnterprise,
  ЗаполнениеПоследовательностей?: SE.SequenceFillingEnterprise,
  СтандартныеРеквизиты?: ОписанияСтандартныхРеквизитовEnterprise,
  Синоним?: string,
  ТабличныеЧасти?: КоллекцияОбъектовМетаданныхEnterprise,
  Макеты?: КоллекцияОбъектовМетаданныхEnterprise,
  ОбновлятьИсториюДанныхСразуПослеЗаписи?: boolean,
  ИспользоватьСтандартныеКоманды?: boolean,
}
