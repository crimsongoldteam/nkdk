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



export interface MetadataCatalog  {

  additionalIndexes?: AdditionalIndexes,
  attributes?: MetadataAttributes,
  autonumbering?: boolean,
  auxiliaryChoiceForm?: string,
  auxiliaryFolderChoiceForm?: string,
  auxiliaryFolderForm?: string,
  auxiliaryListForm?: string,
  auxiliaryObjectForm?: string,
  basedOn?: MetadataItemLinks,
  characteristics?: CharacteristicsDescriptions,
  checkUnique?: boolean,
  choiceDataGetModeOnInputByString?: SE.ChoiceDataGetModeOnInputByString,
  choiceHistoryOnInput?: SE.ChoiceHistoryOnInput,
  choiceMode?: SE.ChoiceMode,
  codeAllowedLength?: SE.AllowedLength,
  codeLength?: number,
  codeSeries?: SE.CharacteristicKindCodesSeries,
  codeType?: SE.CatalogCodeType,
  commands?: MetadataCommands,
  comment?: string,
  createOnInput?: SE.CreateOnInput,
  dataHistory?: SE.DataHistoryUse,
  dataLockControlMode?: SE.DefaultDataLockControlMode,
  dataLockFields?: MetadataFields,
  defaultChoiceForm?: string,
  defaultFolderChoiceForm?: string,
  defaultFolderForm?: string,
  defaultListForm?: string,
  defaultObjectForm?: string,
  defaultPresentation?: SE.CatalogMainPresentation,
  descriptionLength?: number,
  editType?: SE.EditType,
  executeAfterWriteDataHistoryVersionProcessing?: boolean,
  explanation?: string,
  extendedListPresentation?: string,
  extendedObjectPresentation?: string,
  foldersOnTop?: boolean,
  fullTextSearch?: SE.UseFullTextSearch,
  fullTextSearchOnInputByString?: SE.FullTextSearchOnInputByString,
  hierarchical?: boolean,
  hierarchyType?: SE.HierarchyType,
  includeHelpInContents?: boolean,
  inputByString?: MetadataFields,
  levelCount?: number,
  limitLevelCount?: boolean,
  listPresentation?: string,
  objectBelonging?: SE.ObjectBelonging,
  objectPresentation?: I8nText,
  owners?: MetadataItemLinks,
  predefined?: PredefinedList,
  predefinedDataUpdate?: SE.PredefinedDataUpdate,
  quickChoice?: boolean,
  searchStringModeOnInputByString?: SE.SearchStringModeOnInputByString,
  standardAttributes?: StandardAttributeDescriptions,
  subordinationUse?: SE.SubordinationUse,
  synonym?: I8nText,
  tabularSections?: MetadataTabularSections,
  updateDataHistoryImmediatelyAfterWrite?: boolean,
  useStandardCommands?: boolean,
}

export interface MetadataCatalogXML  {
  
  AdditionalIndexes?: AdditionalIndexesXML,
  Attributes?: MetadataAttributesXML,
  Autonumbering?: boolean,
  AuxiliaryChoiceForm?: string,
  AuxiliaryFolderChoiceForm?: string,
  AuxiliaryFolderForm?: string,
  AuxiliaryListForm?: string,
  AuxiliaryObjectForm?: string,
  BasedOn?: MetadataItemLinksXML,
  Characteristics?: CharacteristicsDescriptionsXML,
  CheckUnique?: boolean,
  ChoiceDataGetModeOnInputByString?: SE.ChoiceDataGetModeOnInputByString,
  ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput,
  ChoiceMode?: SE.ChoiceMode,
  CodeAllowedLength?: SE.AllowedLength,
  CodeLength?: number,
  CodeSeries?: SE.CharacteristicKindCodesSeries,
  CodeType?: SE.CatalogCodeType,
  Commands?: MetadataCommandsXML,
  Comment?: string,
  CreateOnInput?: SE.CreateOnInput,
  DataHistory?: SE.DataHistoryUse,
  DataLockControlMode?: SE.DefaultDataLockControlMode,
  DataLockFields?: MetadataFieldsXML,
  DefaultChoiceForm?: string,
  DefaultFolderChoiceForm?: string,
  DefaultFolderForm?: string,
  DefaultListForm?: string,
  DefaultObjectForm?: string,
  DefaultPresentation?: SE.CatalogMainPresentation,
  DescriptionLength?: number,
  EditType?: SE.EditType,
  ExecuteAfterWriteDataHistoryVersionProcessing?: boolean,
  Explanation?: string,
  ExtendedListPresentation?: string,
  ExtendedObjectPresentation?: string,
  FoldersOnTop?: boolean,
  FullTextSearch?: SE.UseFullTextSearch,
  FullTextSearchOnInputByString?: SE.FullTextSearchOnInputByString,
  Hierarchical?: boolean,
  HierarchyType?: SE.HierarchyType,
  IncludeHelpInContents?: boolean,
  InputByString?: MetadataFieldsXML,
  LevelCount?: number,
  LimitLevelCount?: boolean,
  ListPresentation?: string,
  ObjectBelonging?: SE.ObjectBelonging,
  ObjectPresentation?: I8nTextXML,
  Owners?: MetadataItemLinksXML,
  Predefined?: PredefinedListXML,
  PredefinedDataUpdate?: SE.PredefinedDataUpdate,
  QuickChoice?: boolean,
  SearchStringModeOnInputByString?: SE.SearchStringModeOnInputByString,
  StandardAttributes?: StandardAttributeDescriptionsXML,
  SubordinationUse?: SE.SubordinationUse,
  Synonym?: I8nTextXML,
  TabularSections?: MetadataTabularSectionsXML,
  UpdateDataHistoryImmediatelyAfterWrite?: boolean,
  UseStandardCommands?: boolean,
}

export interface MetadataCatalogEnterprise  {
  ДополнительныеИндексы?: AdditionalIndexesEnterprise,
  Реквизиты?: MetadataAttributesEnterprise,
  Автонумерация?: boolean,
  ДополнительнаяФормаДляВыбора?: string,
  ДополнительнаяФормаДляВыбораГруппы?: string,
  ДополнительнаяФормаГруппы?: string,
  ДополнительнаяФормаСписка?: string,
  ДополнительнаяФормаОбъекта?: string,
  ВводитсяНаОсновании?: MetadataItemLinksEnterprise,
  Характеристики?: CharacteristicsDescriptionsEnterprise,
  КонтрольУникальности?: boolean,
  РежимПолученияДанныхВыбораПриВводеПоСтроке?: SE.ChoiceDataGetModeOnInputByStringEnterprise,
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputEnterprise,
  СпособВыбора?: SE.ChoiceModeEnterprise,
  ДопустимаяДлинаКода?: SE.AllowedLengthEnterprise,
  ДлинаКода?: number,
  СерииКодов?: SE.CharacteristicKindCodesSeriesEnterprise,
  ТипКода?: SE.CatalogCodeTypeEnterprise,
  Команды?: MetadataCommandsEnterprise,
  Комментарий?: string,
  СозданиеПриВводе?: SE.CreateOnInputEnterprise,
  ИсторияДанных?: SE.DataHistoryUseEnterprise,
  РежимУправленияБлокировкойДанных?: SE.DefaultDataLockControlModeEnterprise,
  ПоляБлокировкиДанных?: MetadataFieldsEnterprise,
  ОсновнаяФормаДляВыбора?: string,
  ОсновнаяФормаДляВыбораГруппы?: string,
  ОсновнаяФормаГруппы?: string,
  ОсновнаяФормаСписка?: string,
  ОсновнаяФормаОбъекта?: string,
  ОсновноеПредставление?: SE.CatalogMainPresentationEnterprise,
  ДлинаНаименования?: number,
  СпособРедактирования?: SE.EditTypeEnterprise,
  ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных?: boolean,
  Пояснение?: string,
  РасширенноеПредставлениеСписка?: string,
  РасширенноеПредставлениеОбъекта?: string,
  ГруппыСверху?: boolean,
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchEnterprise,
  ПолнотекстовыйПоискПриВводеПоСтроке?: SE.FullTextSearchOnInputByStringEnterprise,
  Иерархический?: boolean,
  ВидИерархии?: SE.HierarchyTypeEnterprise,
  ВключатьСправкуВСодержание?: boolean,
  ВводПоСтроке?: MetadataFieldsEnterprise,
  КоличествоУровней?: number,
  ОграничиватьКоличествоУровней?: boolean,
  ПредставлениеСписка?: string,
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise,
  ПредставлениеОбъекта?: I8nTextEnterprise,
  Владельцы?: MetadataItemLinksEnterprise,
  Предопределенные?: PredefinedListEnterprise,
  ОбновлениеПредопределенныхДанных?: SE.PredefinedDataUpdateEnterprise,
  БыстрыйВыбор?: boolean,
  СпособПоискаСтрокиПриВводеПоСтроке?: SE.SearchStringModeOnInputByStringEnterprise,
  СтандартныеРеквизиты?: StandardAttributeDescriptionsEnterprise,
  ИспользованиеПодчинения?: SE.SubordinationUseEnterprise,
  Синоним?: I8nTextEnterprise,
  ТабличныеЧасти?: MetadataTabularSectionsEnterprise,
  ОбновлятьИсториюДанныхСразуПослеЗаписи?: boolean,
  ИспользоватьСтандартныеКоманды?: boolean,
}
