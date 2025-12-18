import { MetadataCatalog, MetadataCatalogEnterprise } from "~/lib/metadata/appliedObjects/metadataCatalog/types"
import { exportMetadataCommandsToEnterprise } from "~/lib/metadata/appliedObjects/metadataCommand/exportToEnterprise"
import { exportAdditionalIndexesToEnterprise } from "~/lib/metadata/commonObjects/additionalIndex/exportToEnterprise"
import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportCharacteristicsDescriptionsToEnterprise } from "~/lib/metadata/commonObjects/characteristicsDescription/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataAttributesToEnterprise } from "~/lib/metadata/commonObjects/metadataAttribute/exportToEnterprise"
import { exportMetadataFieldsToEnterprise } from "~/lib/metadata/commonObjects/metadataField/exportToEnterprise"
import { exportMetadataItemLinksToEnterprise } from "~/lib/metadata/commonObjects/metadataItemLink/exportToEnterprise"
import { exportMetadataTabularSectionsToEnterprise } from "~/lib/metadata/commonObjects/metadataTabularSection/exportToEnterprise"
import { exportPredefinedItemsToEnterprise } from "~/lib/metadata/commonObjects/predifined/exportToEnterprise"
import { exportStandardAttributeDescriptionsToEnterprise } from "~/lib/metadata/commonObjects/standardAttributeDescription/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataCatalogToEnterprise = (
  data: MetadataCatalog | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCatalogEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ДополнительныеИндексы: exportAdditionalIndexesToEnterprise(data.additionalIndexes, configurationSettings),
    Реквизиты: exportMetadataAttributesToEnterprise(data.attributes, configurationSettings),
    Автонумерация: exportBooleanToEnterprise(data.autonumbering, configurationSettings),
    ДополнительнаяФормаДляВыбора: data.auxiliaryChoiceForm,
    ДополнительнаяФормаДляВыбораГруппы: data.auxiliaryFolderChoiceForm,
    ДополнительнаяФормаГруппы: data.auxiliaryFolderForm,
    ДополнительнаяФормаСписка: data.auxiliaryListForm,
    ДополнительнаяФормаОбъекта: data.auxiliaryObjectForm,
    ВводитсяНаОсновании: exportMetadataItemLinksToEnterprise(data.basedOn, configurationSettings),
    Характеристики: exportCharacteristicsDescriptionsToEnterprise(data.characteristics, configurationSettings),
    КонтрольУникальности: exportBooleanToEnterprise(data.checkUnique, configurationSettings),
    РежимПолученияДанныхВыбораПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      data.choiceDataGetModeOnInputByString,
      SE.ChoiceDataGetModeOnInputByStringToEnterprise,
      configurationSettings
    ),
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise,
      configurationSettings
    ),
    СпособВыбора: exportSystemEnumerationToEnterprise(
      data.choiceMode,
      SE.ChoiceModeToEnterprise,
      configurationSettings
    ),
    ДопустимаяДлинаКода: exportSystemEnumerationToEnterprise(
      data.codeAllowedLength,
      SE.AllowedLengthToEnterprise,
      configurationSettings
    ),
    ДлинаКода: data.codeLength,
    СерииКодов: exportSystemEnumerationToEnterprise(
      data.codeSeries,
      SE.CharacteristicKindCodesSeriesToEnterprise,
      configurationSettings
    ),
    ТипКода: exportSystemEnumerationToEnterprise(data.codeType, SE.CatalogCodeTypeToEnterprise, configurationSettings),
    Команды: exportMetadataCommandsToEnterprise(data.commands, configurationSettings),
    Комментарий: data.comment,
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(
      data.createOnInput,
      SE.CreateOnInputToEnterprise,
      configurationSettings
    ),
    ИсторияДанных: exportSystemEnumerationToEnterprise(
      data.dataHistory,
      SE.DataHistoryUseToEnterprise,
      configurationSettings
    ),
    РежимУправленияБлокировкойДанных: exportSystemEnumerationToEnterprise(
      data.dataLockControlMode,
      SE.DefaultDataLockControlModeToEnterprise,
      configurationSettings
    ),
    ПоляБлокировкиДанных: exportMetadataFieldsToEnterprise(data.dataLockFields, configurationSettings),
    ОсновнаяФормаДляВыбора: data.defaultChoiceForm,
    ОсновнаяФормаДляВыбораГруппы: data.defaultFolderChoiceForm,
    ОсновнаяФормаГруппы: data.defaultFolderForm,
    ОсновнаяФормаСписка: data.defaultListForm,
    ОсновнаяФормаОбъекта: data.defaultObjectForm,
    ОсновноеПредставление: exportSystemEnumerationToEnterprise(
      data.defaultPresentation,
      SE.CatalogMainPresentationToEnterprise,
      configurationSettings
    ),
    ДлинаНаименования: data.descriptionLength,
    СпособРедактирования: exportSystemEnumerationToEnterprise(
      data.editType,
      SE.EditTypeToEnterprise,
      configurationSettings
    ),
    ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: exportBooleanToEnterprise(
      data.executeAfterWriteDataHistoryVersionProcessing,
      configurationSettings
    ),
    Пояснение: exportI8nTextToEnterprise(data.explanation, configurationSettings),
    РасширенноеПредставлениеСписка: exportI8nTextToEnterprise(data.extendedListPresentation, configurationSettings),
    РасширенноеПредставлениеОбъекта: exportI8nTextToEnterprise(data.extendedObjectPresentation, configurationSettings),
    ГруппыСверху: exportBooleanToEnterprise(data.foldersOnTop, configurationSettings),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(
      data.fullTextSearch,
      SE.UseFullTextSearchToEnterprise,
      configurationSettings
    ),
    ПолнотекстовыйПоискПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      data.fullTextSearchOnInputByString,
      SE.FullTextSearchOnInputByStringToEnterprise,
      configurationSettings
    ),
    Иерархический: exportBooleanToEnterprise(data.hierarchical, configurationSettings),
    ВидИерархии: exportSystemEnumerationToEnterprise(
      data.hierarchyType,
      SE.HierarchyTypeToEnterprise,
      configurationSettings
    ),
    ВключатьСправкуВСодержание: exportBooleanToEnterprise(data.includeHelpInContents, configurationSettings),
    ВводПоСтроке: exportMetadataFieldsToEnterprise(data.inputByString, configurationSettings),
    КоличествоУровней: data.levelCount,
    ОграничиватьКоличествоУровней: exportBooleanToEnterprise(data.limitLevelCount, configurationSettings),
    ПредставлениеСписка: exportI8nTextToEnterprise(data.listPresentation, configurationSettings),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise,
      configurationSettings
    ),
    ПредставлениеОбъекта: exportI8nTextToEnterprise(data.objectPresentation, configurationSettings),
    Владельцы: exportMetadataItemLinksToEnterprise(data.owners, configurationSettings),
    Предопределенные: exportPredefinedItemsToEnterprise(data.predefined, configurationSettings),
    ОбновлениеПредопределенныхДанных: exportSystemEnumerationToEnterprise(
      data.predefinedDataUpdate,
      SE.PredefinedDataUpdateToEnterprise,
      configurationSettings
    ),
    БыстрыйВыбор: exportBooleanToEnterprise(data.quickChoice, configurationSettings),
    СпособПоискаСтрокиПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      data.searchStringModeOnInputByString,
      SE.SearchStringModeOnInputByStringToEnterprise,
      configurationSettings
    ),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(
      data.standardAttributes,
      configurationSettings
    ),
    ИспользованиеПодчинения: exportSystemEnumerationToEnterprise(
      data.subordinationUse,
      SE.SubordinationUseToEnterprise,
      configurationSettings
    ),
    Синоним: exportI8nTextToEnterprise(data.synonym, configurationSettings),
    ТабличныеЧасти: exportMetadataTabularSectionsToEnterprise(data.tabularSections, configurationSettings),
    ОбновлятьИсториюДанныхСразуПослеЗаписи: exportBooleanToEnterprise(
      data.updateDataHistoryImmediatelyAfterWrite,
      configurationSettings
    ),
    ИспользоватьСтандартныеКоманды: exportBooleanToEnterprise(data.useStandardCommands, configurationSettings),
  })
}
