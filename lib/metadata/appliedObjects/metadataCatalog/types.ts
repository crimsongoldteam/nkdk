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

import { tags } from "typia"

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

// <xr:GeneratedType name="CatalogObject.Контрагенты" category="Object">
// <xr:TypeId>26b3549b-c3c7-4670-85ac-1f213210cc50</xr:TypeId>
// <xr:ValueId>f7beb6fa-01b7-42d5-af21-8426469fbf3b</xr:ValueId>
// </xr:GeneratedType>
// <xr:GeneratedType name="CatalogRef.Контрагенты" category="Ref">
// <xr:TypeId>b692a3bc-f9d8-4bec-836e-67bb38767199</xr:TypeId>
// <xr:ValueId>0fd40096-7bec-4145-9be5-5a464e0589ab</xr:ValueId>
// </xr:GeneratedType>
// <xr:GeneratedType name="CatalogSelection.Контрагенты" category="Selection">
// <xr:TypeId>86d68206-17c5-4f8b-9f1e-cb83bb32bd18</xr:TypeId>
// <xr:ValueId>f7046d6d-ecfe-464d-9cc7-2de3fdfe9900</xr:ValueId>
// </xr:GeneratedType>
// <xr:GeneratedType name="CatalogList.Контрагенты" category="List">
// <xr:TypeId>b2b1e80f-b136-4c2e-b770-ed32334a060a</xr:TypeId>
// <xr:ValueId>ca26fb8a-8414-468c-a0f8-f574ca1906b8</xr:ValueId>
// </xr:GeneratedType>
// <xr:GeneratedType name="CatalogManager.Контрагенты" category="Manager">
// <xr:TypeId>e87aa731-0f4b-482e-80c5-6d9e80b04a4c</xr:TypeId>
// <xr:ValueId>444ed280-0682-4349-8215-a9a08dc04009</xr:ValueId>
// </xr:GeneratedType>

export interface GeneratedType {
  _name: string
  _category: string
  "xr:TypeId": string & tags.Format<"uuid">
  "xr:ValueId": string & tags.Format<"uuid">
}

export interface MetadataCatalogXML {
  Catalog: {
    _uuid?: string
    InternalInfo: {
      "xr:GeneratedType": GeneratedType[]
    }
    Properties: {
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
  }
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
