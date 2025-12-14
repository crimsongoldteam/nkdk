import { FieldList, FieldListEnterprise, FieldListXML } from "~/lib/metadata/commonObjects/field/types"
import { I8nText, I8nTextEnterprise, I8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import {
  MetadataAttributes,
  MetadataAttributesEnterprise,
  MetadataAttributesXML,
} from "~/lib/metadata/commonObjects/metadataAttribute/types"
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
  PredefinedList,
  PredefinedListEnterprise,
  PredefinedListXML,
} from "~/lib/metadata/commonObjects/predifined/types"
import {
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
  StandardAttributeDescriptionsXML,
} from "~/lib/metadata/commonObjects/standardAttributeDescription/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface Catalog {
  attributes?: MetadataAttributes
  autonumbering?: boolean
  auxiliaryChoiceForm?: string
  auxiliaryFolderChoiceForm?: string
  auxiliaryFolderForm?: string
  auxiliaryListForm?: string
  auxiliaryObjectForm?: string
  basedOn?: MetadataItemLinks
  choiceDataGetModeOnInputByString?: SE.ChoiceDataGetModeOnInputByString
  choiceHistoryOnInput?: SE.ChoiceHistoryOnInput
  choiceMode?: SE.ChoiceMode
  codeAllowedLength?: SE.AllowedLength
  codeLength?: number
  codeSeries?: SE.CharacteristicKindCodesSeries
  codeType?: SE.CatalogCodeType
  // commands?: CommandList
  comment?: string
  createOnInput?: SE.CreateOnInput
  dataHistory?: SE.DataHistoryUse
  dataLockControlMode?: SE.DefaultDataLockControlMode
  dataLockFields?: FieldList
  defaultChoiceForm?: string
  defaultFolderChoiceForm?: string
  defaultFolderForm?: string
  defaultListForm?: string
  defaultObjectForm?: string
  defaultPresentation?: SE.CatalogMainPresentation
  descriptionLength?: number
  editType?: SE.EditType
  executeAfterWriteDataHistoryVersionProcessing?: boolean
  explanation?: string
  extendedListPresentation?: string
  extendedObjectPresentation?: string
  foldersOnTop?: boolean
  fullTextSearch?: SE.UseFullTextSearch
  fullTextSearchOnInputByString?: SE.FullTextSearchOnInputByString
  hierarchical?: boolean
  hierarchyType?: SE.HierarchyType
  includeHelpInContents?: boolean
  inputByString?: FieldList
  levelCount?: number
  limitLevelCount?: boolean
  listPresentation?: string
  objectBelonging?: SE.ObjectBelonging
  objectPresentation?: I8nText
  owners?: MetadataItemLinks
  predefined?: PredefinedList
  predefinedDataUpdate?: SE.PredefinedDataUpdate
  quickChoice?: boolean
  searchStringModeOnInputByString?: SE.SearchStringModeOnInputByString
  standardAttributes?: StandardAttributeDescriptions
  subordinationUse?: SE.SubordinationUse
  synonym?: I8nText
  tabularSections?: MetadataTabularSections
  updateDataHistoryImmediatelyAfterWrite?: boolean
  userVisible?: UserVisible
  useStandardCommands?: boolean
}

export interface CatalogXML {
  Attributes?: MetadataAttributesXML
  Autonumbering?: boolean
  AuxiliaryChoiceForm?: string
  AuxiliaryFolderChoiceForm?: string
  AuxiliaryFolderForm?: string
  AuxiliaryListForm?: string
  AuxiliaryObjectForm?: string
  BasedOn?: MetadataItemLinksXML
  CheckUnique?: boolean
  ChoiceDataGetModeOnInputByString?: SE.ChoiceDataGetModeOnInputByString
  ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput
  ChoiceMode?: SE.ChoiceMode
  CodeAllowedLength?: SE.AllowedLength
  CodeLength?: number
  CodeSeries?: SE.CharacteristicKindCodesSeries
  CodeType?: SE.CatalogCodeType
  // Commands?: CommandListXML
  Comment?: string
  CreateOnInput?: SE.CreateOnInput
  DataHistory?: SE.DataHistoryUse
  DataLockControlMode?: SE.DefaultDataLockControlMode
  DataLockFields?: FieldListXML
  DefaultChoiceForm?: string
  DefaultFolderChoiceForm?: string
  DefaultFolderForm?: string
  DefaultListForm?: string
  DefaultObjectForm?: string
  DefaultPresentation?: SE.CatalogMainPresentation
  DescriptionLength?: number
  EditType?: SE.EditType
  ExecuteAfterWriteDataHistoryVersionProcessing?: boolean
  Explanation?: string
  ExtendedListPresentation?: string
  ExtendedObjectPresentation?: string
  FoldersOnTop?: boolean
  FullTextSearch?: SE.UseFullTextSearch
  FullTextSearchOnInputByString?: SE.FullTextSearchOnInputByString
  Hierarchical?: boolean
  HierarchyType?: SE.HierarchyType
  IncludeHelpInContents?: boolean
  InputByString?: FieldListXML
  LevelCount?: number
  LimitLevelCount?: boolean
  ListPresentation?: string
  ObjectBelonging?: SE.ObjectBelonging
  ObjectPresentation?: I8nTextXML
  Owners?: MetadataItemLinksXML
  Predefined?: PredefinedListXML
  PredefinedDataUpdate?: SE.PredefinedDataUpdate
  QuickChoice?: boolean
  SearchStringModeOnInputByString?: SE.SearchStringModeOnInputByString
  StandardAttributes?: StandardAttributeDescriptionsXML
  SubordinationUse?: SE.SubordinationUse
  Synonym?: I8nTextXML
  TabularSections?: MetadataTabularSectionsXML
  UpdateDataHistoryImmediatelyAfterWrite?: boolean
  UserVisible?: UserVisibleXML
  UseStandardCommands?: boolean
}

export interface CatalogEnterprise {
  Реквизиты?: MetadataAttributesEnterprise
  Автонумерация?: boolean
  ДополнительнаяФормаДляВыбора?: string
  ДополнительнаяФормаДляВыбораГруппы?: string
  ДополнительнаяФормаГруппы?: string
  ДополнительнаяФормаСписка?: string
  ДополнительнаяФормаОбъекта?: string
  ВводитсяНаОсновании?: MetadataItemLinksEnterprise
  КонтрольУникальности?: boolean
  РежимПолученияДанныхВыбораПриВводеПоСтроке?: SE.ChoiceDataGetModeOnInputByStringEnterprise
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputEnterprise
  СпособВыбора?: SE.ChoiceModeEnterprise
  ДопустимаяДлинаКода?: SE.AllowedLengthEnterprise
  ДлинаКода?: number
  СерииКодов?: SE.CharacteristicKindCodesSeriesEnterprise
  ТипКода?: SE.CatalogCodeTypeEnterprise
  // Команды?: CommandListEnterprise
  Комментарий?: string
  СозданиеПриВводе?: SE.CreateOnInputEnterprise
  ИсторияДанных?: SE.DataHistoryUseEnterprise
  РежимУправленияБлокировкойДанных?: SE.DefaultDataLockControlModeEnterprise
  ПоляБлокировкиДанных?: FieldListEnterprise
  ОсновнаяФормаДляВыбора?: string
  ОсновнаяФормаДляВыбораГруппы?: string
  ОсновнаяФормаГруппы?: string
  ОсновнаяФормаСписка?: string
  ОсновнаяФормаОбъекта?: string
  ОсновноеПредставление?: SE.CatalogMainPresentationEnterprise
  ДлинаНаименования?: number
  СпособРедактирования?: SE.EditTypeEnterprise
  ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных?: boolean
  Пояснение?: string
  РасширенноеПредставлениеСписка?: string
  РасширенноеПредставлениеОбъекта?: string
  ГруппыСверху?: boolean
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchEnterprise
  ПолнотекстовыйПоискПриВводеПоСтроке?: SE.FullTextSearchOnInputByStringEnterprise
  Иерархический?: boolean
  ВидИерархии?: SE.HierarchyTypeEnterprise
  ВключатьСправкуВСодержание?: boolean
  ВводПоСтроке?: FieldListEnterprise
  КоличествоУровней?: number
  ОграничиватьКоличествоУровней?: boolean
  ПредставлениеСписка?: string
  ПринадлежностьОбъекта?: SE.ObjectBelongingEnterprise
  ПредставлениеОбъекта?: I8nTextEnterprise
  Владельцы?: MetadataItemLinksEnterprise
  Предопределенные?: PredefinedListEnterprise
  ОбновлениеПредопределенныхДанных?: SE.PredefinedDataUpdateEnterprise
  БыстрыйВыбор?: boolean
  СпособПоискаСтрокиПриВводеПоСтроке?: SE.SearchStringModeOnInputByStringEnterprise
  СтандартныеРеквизиты?: StandardAttributeDescriptionsEnterprise
  ИспользованиеПодчинения?: SE.SubordinationUseEnterprise
  Синоним?: I8nTextEnterprise
  ТабличныеЧасти?: MetadataTabularSectionsEnterprise
  ОбновлятьИсториюДанныхСразуПослеЗаписи?: boolean
  ПользовательскаяВидимость?: UserVisibleEnterprise
  ИспользоватьСтандартныеКоманды?: boolean
}
