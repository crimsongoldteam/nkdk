import {
  MetadataCommands,
  MetadataCommandsEnterprise,
  MetadataCommandsXML,
} from "~/lib/metadata/appliedObjects/metadataCommand/types"
import {
  AdditionalIndexes,
  AdditionalIndexesEnterprise,
  AdditionalIndexesXML,
} from "~/lib/metadata/commonObjects/additionalIndex/types"
import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
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
  PredefinedItems,
  PredefinedItemsEnterprise,
  PredefinedItemsXML,
} from "~/lib/metadata/commonObjects/predifined/types"
import {
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
  StandardAttributeDescriptionsXML,
} from "~/lib/metadata/commonObjects/standardAttributeDescription/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface MetadataCatalog {
  additionalIndexes?: AdditionalIndexes
  attributes?: MetadataAttributes
  autonumbering?: boolean
  auxiliaryChoiceForm?: string
  auxiliaryFolderChoiceForm?: string
  auxiliaryFolderForm?: string
  auxiliaryListForm?: string
  auxiliaryObjectForm?: string
  basedOn?: MetadataItemLinks
  characteristics?: CharacteristicsDescriptions
  checkUnique?: boolean
  choiceDataGetModeOnInputByString?: SE.ChoiceDataGetModeOnInputByString
  choiceHistoryOnInput?: SE.ChoiceHistoryOnInput
  choiceMode?: SE.ChoiceMode
  codeAllowedLength?: SE.AllowedLength
  codeLength?: number
  codeSeries?: SE.CharacteristicKindCodesSeries
  codeType?: SE.CatalogCodeType
  commands?: MetadataCommands
  comment?: string
  createOnInput?: SE.CreateOnInput
  dataHistory?: SE.DataHistoryUse
  dataLockControlMode?: SE.DefaultDataLockControlMode
  dataLockFields?: MetadataFields
  defaultChoiceForm?: string
  defaultFolderChoiceForm?: string
  defaultFolderForm?: string
  defaultListForm?: string
  defaultObjectForm?: string
  defaultPresentation?: SE.CatalogMainPresentation
  descriptionLength?: number
  editType?: SE.EditType
  executeAfterWriteDataHistoryVersionProcessing?: boolean
  explanation?: I8nText
  extendedListPresentation?: I8nText
  extendedObjectPresentation?: I8nText
  foldersOnTop?: boolean
  fullTextSearch?: SE.UseFullTextSearch
  fullTextSearchOnInputByString?: SE.FullTextSearchOnInputByString
  hierarchical?: boolean
  hierarchyType?: SE.HierarchyType
  includeHelpInContents?: boolean
  inputByString?: MetadataFields
  levelCount?: number
  limitLevelCount?: boolean
  listPresentation?: I8nText
  name: string
  objectBelonging?: SE.ObjectBelonging
  objectPresentation?: I8nText
  owners?: MetadataItemLinks
  predefined?: PredefinedItems
  predefinedDataUpdate?: SE.PredefinedDataUpdate
  quickChoice?: boolean
  searchStringModeOnInputByString?: SE.SearchStringModeOnInputByString
  standardAttributes?: StandardAttributeDescriptions
  subordinationUse?: SE.SubordinationUse
  synonym?: I8nText
  tabularSections?: MetadataTabularSections
  updateDataHistoryImmediatelyAfterWrite?: boolean
  useStandardCommands?: boolean
}

export interface MetadataCatalogXML {
  AdditionalIndexes?: AdditionalIndexesXML
  Attributes?: MetadataAttributesXML
  Autonumbering?: boolean
  AuxiliaryChoiceForm?: string
  AuxiliaryFolderChoiceForm?: string
  AuxiliaryFolderForm?: string
  AuxiliaryListForm?: string
  AuxiliaryObjectForm?: string
  BasedOn?: MetadataItemLinksXML
  Characteristics?: CharacteristicsDescriptionsXML
  CheckUnique?: boolean
  ChoiceDataGetModeOnInputByString?: SE.ChoiceDataGetModeOnInputByString
  ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput
  ChoiceMode?: SE.ChoiceMode
  CodeAllowedLength?: SE.AllowedLength
  CodeLength?: number
  CodeSeries?: SE.CharacteristicKindCodesSeries
  CodeType?: SE.CatalogCodeType
  Commands?: MetadataCommandsXML
  Comment?: string
  CreateOnInput?: SE.CreateOnInput
  DataHistory?: SE.DataHistoryUse
  DataLockControlMode?: SE.DefaultDataLockControlMode
  DataLockFields?: MetadataFieldsXML
  DefaultChoiceForm?: string
  DefaultFolderChoiceForm?: string
  DefaultFolderForm?: string
  DefaultListForm?: string
  DefaultObjectForm?: string
  DefaultPresentation?: SE.CatalogMainPresentation
  DescriptionLength?: number
  EditType?: SE.EditType
  ExecuteAfterWriteDataHistoryVersionProcessing?: boolean
  Explanation?: I8nTextXML
  ExtendedListPresentation?: I8nTextXML
  ExtendedObjectPresentation?: I8nTextXML
  FoldersOnTop?: boolean
  FullTextSearch?: SE.UseFullTextSearch
  FullTextSearchOnInputByString?: SE.FullTextSearchOnInputByString
  Hierarchical?: boolean
  HierarchyType?: SE.HierarchyType
  IncludeHelpInContents?: boolean
  InputByString?: MetadataFieldsXML
  LevelCount?: number
  LimitLevelCount?: boolean
  ListPresentation?: I8nTextXML
  Name: string
  ObjectBelonging?: SE.ObjectBelonging
  ObjectPresentation?: I8nTextXML
  Owners?: MetadataItemLinksXML
  Predefined?: PredefinedItemsXML
  PredefinedDataUpdate?: SE.PredefinedDataUpdate
  QuickChoice?: boolean
  SearchStringModeOnInputByString?: SE.SearchStringModeOnInputByString
  StandardAttributes?: StandardAttributeDescriptionsXML
  SubordinationUse?: SE.SubordinationUse
  Synonym?: I8nTextXML
  TabularSections?: MetadataTabularSectionsXML
  UpdateDataHistoryImmediatelyAfterWrite?: boolean
  UseStandardCommands?: boolean
}

export interface MetadataCatalogEnterprise {
  Автонумерация?: StringboolEnterprise
  БыстрыйВыбор?: StringboolEnterprise
  ВводитсяНаОсновании?: MetadataItemLinksEnterprise
  ВводПоСтроке?: MetadataFieldsEnterprise
  ВидИерархии?: SE.HierarchyTypeEnterprise
  ВключатьСправкуВСодержание?: StringboolEnterprise
  Владельцы?: MetadataItemLinksEnterprise
  ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных?: StringboolEnterprise
  ГруппыСверху?: StringboolEnterprise
  ДлинаКода?: number
  ДлинаНаименования?: number
  ДополнительнаяФормаГруппы?: string
  ДополнительнаяФормаДляВыбора?: string
  ДополнительнаяФормаДляВыбораГруппы?: string
  ДополнительнаяФормаОбъекта?: string
  ДополнительнаяФормаСписка?: string
  ДополнительныеИндексы?: AdditionalIndexesEnterprise
  ДопустимаяДлинаКода?: SE.AllowedLengthEnterprise
  Иерархический?: StringboolEnterprise
  Имя?: string
  ИспользованиеПодчинения?: SE.SubordinationUseEnterprise
  ИспользоватьСтандартныеКоманды?: StringboolEnterprise
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputEnterprise
  ИсторияДанных?: SE.DataHistoryUseEnterprise
  КоличествоУровней?: number
  Команды?: MetadataCommandsEnterprise
  Комментарий?: string
  КонтрольУникальности?: StringboolEnterprise
  ОбновлениеПредопределенныхДанных?: SE.PredefinedDataUpdateEnterprise
  ОбновлятьИсториюДанныхСразуПослеЗаписи?: StringboolEnterprise
  ОграничиватьКоличествоУровней?: StringboolEnterprise
  ОсновнаяФормаГруппы?: string
  ОсновнаяФормаДляВыбора?: string
  ОсновнаяФормаДляВыбораГруппы?: string
  ОсновнаяФормаОбъекта?: string
  ОсновнаяФормаСписка?: string
  ОсновноеПредставление?: SE.CatalogMainPresentationEnterprise
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchEnterprise
  ПолнотекстовыйПоискПриВводеПоСтроке?: SE.FullTextSearchOnInputByStringEnterprise
  ПоляБлокировкиДанных?: MetadataFieldsEnterprise
  Пояснение?: I8nTextEnterprise
  Предопределенные?: PredefinedItemsEnterprise
  ПредставлениеОбъекта?: I8nTextEnterprise
  ПредставлениеСписка?: I8nTextEnterprise
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise
  РасширенноеПредставлениеОбъекта?: I8nTextEnterprise
  РасширенноеПредставлениеСписка?: I8nTextEnterprise
  РежимПолученияДанныхВыбораПриВводеПоСтроке?: SE.ChoiceDataGetModeOnInputByStringEnterprise
  РежимУправленияБлокировкойДанных?: SE.DefaultDataLockControlModeEnterprise
  Реквизиты?: MetadataAttributesEnterprise
  СерииКодов?: SE.CharacteristicKindCodesSeriesEnterprise
  Синоним?: I8nTextEnterprise
  СозданиеПриВводе?: SE.CreateOnInputEnterprise
  СпособВыбора?: SE.ChoiceModeEnterprise
  СпособПоискаСтрокиПриВводеПоСтроке?: SE.SearchStringModeOnInputByStringEnterprise
  СпособРедактирования?: SE.EditTypeEnterprise
  СтандартныеРеквизиты?: StandardAttributeDescriptionsEnterprise
  ТабличныеЧасти?: MetadataTabularSectionsEnterprise
  ТипКода?: SE.CatalogCodeTypeEnterprise
  Характеристики?: CharacteristicsDescriptionsEnterprise
}
