import { MetadataCommandsXML, MetadataCommandsYAML } from "~/metadata/appliedObjects/metadataCommand/types"
import { AdditionalIndexesXML, AdditionalIndexesYAML } from "~/metadata/commonObjects/additionalIndex/types"
import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import {
  CharacteristicsDescriptionsXML,
  CharacteristicsDescriptionsYAML,
} from "~/metadata/commonObjects/characteristicsDescription/types"
import { I8nTextXML, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataAttributesXML, MetadataAttributesYAML } from "~/metadata/commonObjects/metadataAttribute/types"
import { MetadataFieldsXML, MetadataFieldsYAML } from "~/metadata/commonObjects/metadataField/types"
import {
  MetadataTabularSectionsXML,
  MetadataTabularSectionsYAML,
} from "~/metadata/commonObjects/metadataTabularSection/types"
import { PredefinedItemsXML, PredefinedItemsYAML } from "~/metadata/commonObjects/predefined/types"
import {
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionsYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import * as SE from "~/metadata/systemEnumerations/types"

import {
  MetadataValueCollectionXML,
  MetadataValueCollectionYAML,
} from "~/metadata/commonObjects/metadataValueCollection/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { InternalInfoItemsXML } from "../../commonObjects/internalInfo/types"
import { MetadataCatalogRules } from "./rules"

export const MetadataCatalogStandardAttributeNames: Record<string, string> = {
  PredefinedDataName: "ИмяПредопределенныхДанных",
  Predefined: "Предопределенный",
  Ref: "Ссылка",
  DeletionMark: "ПометкаУдаления",
  IsFolder: "ЭтоГруппа",
  Owner: "Владелец",
  Parent: "Родитель",
  Description: "Наименование",
  Code: "Код",
}

export type MetadataCatalog = MetadataTypeByRule<typeof MetadataCatalogRules>

export const GeneratedTypeCategory = ["Object", "Ref", "Selection", "List", "Manager"] as const
export type GeneratedTypeCategory = (typeof GeneratedTypeCategory)[number]

export type CatalogInternalInfoParamsXML = [
  { name: string; category: "Object" },
  { name: string; category: "Ref" },
  { name: string; category: "Selection" },
  { name: string; category: "List" },
  { name: string; category: "Manager" },
]

export interface MetadataCatalogXML {
  _xmlns?: string
  "_xmlns:app"?: string
  "_xmlns:cfg"?: string
  "_xmlns:cmi"?: string
  "_xmlns:ent"?: string
  "_xmlns:lf"?: string
  "_xmlns:style": string
  "_xmlns:sys": string
  "_xmlns:v8"?: string
  "_xmlns:v8ui": string
  "_xmlns:web"?: string
  "_xmlns:win"?: string
  "_xmlns:xen"?: string
  "_xmlns:xpr"?: string
  "_xmlns:xr"?: string
  "_xmlns:xs"?: string
  "_xmlns:xsi"?: string
  _version: string
  Catalog: {
    _uuid: string
    InternalInfo: InternalInfoItemsXML<CatalogInternalInfoParamsXML> | undefined
    Properties: {
      AdditionalIndexes?: AdditionalIndexesXML
      Autonumbering?: boolean
      AuxiliaryChoiceForm?: string
      AuxiliaryFolderChoiceForm?: string
      AuxiliaryFolderForm?: string
      AuxiliaryListForm?: string
      AuxiliaryObjectForm?: string
      BasedOn?: MetadataValueCollectionXML
      Characteristics?: CharacteristicsDescriptionsXML
      CheckUnique?: boolean
      ChoiceDataGetModeOnInputByString?: SE.ChoiceDataGetModeOnInputByString
      ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput
      ChoiceMode?: SE.ChoiceMode
      CodeAllowedLength?: SE.AllowedLength
      CodeLength?: number
      CodeSeries?: SE.CatalogCodesSeries
      CodeType?: SE.CatalogCodeType
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
      Owners?: MetadataValueCollectionXML
      Predefined?: PredefinedItemsXML
      PredefinedDataUpdate?: SE.PredefinedDataUpdate
      QuickChoice?: boolean
      SearchStringModeOnInputByString?: SE.SearchStringModeOnInputByString
      StandardAttributes?: StandardAttributeDescriptionsXML
      SubordinationUse?: SE.SubordinationUse
      Synonym?: I8nTextXML
      UpdateDataHistoryImmediatelyAfterWrite?: boolean
      UseStandardCommands?: boolean
    }
    ChildObjects?: {
      Attribute?: MetadataAttributesXML
      Command?: MetadataCommandsXML
      Form?: string[]
      Template?: string[]
      TabularSection?: MetadataTabularSectionsXML
    }
  }
}

export const defaults: Partial<MetadataCatalog> = {
  autonumbering: true,
  codeLength: 9,
}

export interface MetadataCatalogYAML {
  Автонумерация?: StringboolYAML
  БыстрыйВыбор?: StringboolYAML
  ВводитсяНаОсновании?: MetadataValueCollectionYAML
  ВводПоСтроке?: MetadataFieldsYAML
  ВидИерархии?: SE.HierarchyTypeYAML
  ВключатьСправкуВСодержание?: StringboolYAML
  Владельцы?: MetadataValueCollectionYAML
  ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных?: StringboolYAML
  ГруппыСверху?: StringboolYAML
  ДлинаКода?: number
  ДлинаНаименования?: number
  ДополнительнаяФормаГруппы?: string
  ДополнительнаяФормаДляВыбора?: string
  ДополнительнаяФормаДляВыбораГруппы?: string
  ДополнительнаяФормаОбъекта?: string
  ДополнительнаяФормаСписка?: string
  ДополнительныеИндексы?: AdditionalIndexesYAML
  ДопустимаяДлинаКода?: SE.AllowedLengthYAML
  Иерархический?: StringboolYAML
  Имя?: string
  ИспользованиеПодчинения?: SE.SubordinationUseYAML
  ИспользоватьСтандартныеКоманды?: StringboolYAML
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputYAML
  ИсторияДанных?: SE.DataHistoryUseYAML
  КоличествоУровней?: number
  Команды?: MetadataCommandsYAML
  Комментарий?: string
  КонтрольУникальности?: StringboolYAML
  ОбновлениеПредопределенныхДанных?: SE.PredefinedDataUpdateYAML
  ОбновлятьИсториюДанныхСразуПослеЗаписи?: StringboolYAML
  ОграничиватьКоличествоУровней?: StringboolYAML
  ОсновнаяФормаГруппы?: string
  ОсновнаяФормаДляВыбора?: string
  ОсновнаяФормаДляВыбораГруппы?: string
  ОсновнаяФормаОбъекта?: string
  ОсновнаяФормаСписка?: string
  ОсновноеПредставление?: SE.CatalogMainPresentationYAML
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchYAML
  ПолнотекстовыйПоискПриВводеПоСтроке?: SE.FullTextSearchOnInputByStringYAML
  ПоляБлокировкиДанных?: MetadataFieldsYAML
  Пояснение?: I8nTextYAML
  Предопределенные?: PredefinedItemsYAML
  ПредставлениеОбъекта?: I8nTextYAML
  ПредставлениеСписка?: I8nTextYAML
  ПринадлежностьОбъекта?: SE.ObjectBelongingYAML
  РасширенноеПредставлениеОбъекта?: I8nTextYAML
  РасширенноеПредставлениеСписка?: I8nTextYAML
  РежимПолученияДанныхВыбораПриВводеПоСтроке?: SE.ChoiceDataGetModeOnInputByStringYAML
  РежимУправленияБлокировкойДанных?: SE.DefaultDataLockControlModeYAML
  Реквизиты?: MetadataAttributesYAML
  СерииКодов?: SE.CatalogCodesSeriesYAML
  Синоним?: I8nTextYAML
  СозданиеПриВводе?: SE.CreateOnInputYAML
  СпособВыбора?: SE.ChoiceModeYAML
  СпособПоискаСтрокиПриВводеПоСтроке?: SE.SearchStringModeOnInputByStringYAML
  СпособРедактирования?: SE.EditTypeYAML
  СтандартныеРеквизиты?: StandardAttributeDescriptionsYAML
  ТабличныеЧасти?: MetadataTabularSectionsYAML
  ТипКода?: SE.CatalogCodeTypeYAML
  Характеристики?: CharacteristicsDescriptionsYAML
}
