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
    Автонумерация: exportBooleanToEnterprise(data.autonumbering, configurationSettings),
    БыстрыйВыбор: exportBooleanToEnterprise(data.quickChoice, configurationSettings),
    ВводитсяНаОсновании: exportMetadataItemLinksToEnterprise(data.basedOn, configurationSettings),
    ВводПоСтроке: exportMetadataFieldsToEnterprise(data.inputByString, configurationSettings),
    ВидИерархии: exportSystemEnumerationToEnterprise(
      data.hierarchyType,
      SE.HierarchyTypeToEnterprise,
      configurationSettings
    ),
    ВключатьСправкуВСодержание: exportBooleanToEnterprise(data.includeHelpInContents, configurationSettings),
    Владельцы: exportMetadataItemLinksToEnterprise(data.owners, configurationSettings),
    ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: exportBooleanToEnterprise(
      data.executeAfterWriteDataHistoryVersionProcessing,
      configurationSettings
    ),
    ГруппыСверху: exportBooleanToEnterprise(data.foldersOnTop, configurationSettings),
    ДлинаКода: data.codeLength,
    ДлинаНаименования: data.descriptionLength,
    ДополнительнаяФормаГруппы: data.auxiliaryFolderForm,
    ДополнительнаяФормаДляВыбора: data.auxiliaryChoiceForm,
    ДополнительнаяФормаДляВыбораГруппы: data.auxiliaryFolderChoiceForm,
    ДополнительнаяФормаОбъекта: data.auxiliaryObjectForm,
    ДополнительнаяФормаСписка: data.auxiliaryListForm,
    ДополнительныеИндексы: exportAdditionalIndexesToEnterprise(data.additionalIndexes, configurationSettings),
    ДопустимаяДлинаКода: exportSystemEnumerationToEnterprise(
      data.codeAllowedLength,
      SE.AllowedLengthToEnterprise,
      configurationSettings
    ),
    Иерархический: exportBooleanToEnterprise(data.hierarchical, configurationSettings),
    ИспользованиеПодчинения: exportSystemEnumerationToEnterprise(
      data.subordinationUse,
      SE.SubordinationUseToEnterprise,
      configurationSettings
    ),
    ИспользоватьСтандартныеКоманды: exportBooleanToEnterprise(data.useStandardCommands, configurationSettings),
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise,
      configurationSettings
    ),
    ИсторияДанных: exportSystemEnumerationToEnterprise(
      data.dataHistory,
      SE.DataHistoryUseToEnterprise,
      configurationSettings
    ),
    КоличествоУровней: data.levelCount,
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(data.checkUnique, configurationSettings),
    ОбновлениеПредопределенныхДанных: exportSystemEnumerationToEnterprise(
      data.predefinedDataUpdate,
      SE.PredefinedDataUpdateToEnterprise,
      configurationSettings
    ),
    ОбновлятьИсториюДанныхСразуПослеЗаписи: exportBooleanToEnterprise(
      data.updateDataHistoryImmediatelyAfterWrite,
      configurationSettings
    ),
    ОграничиватьКоличествоУровней: exportBooleanToEnterprise(data.limitLevelCount, configurationSettings),
    ОсновнаяФормаГруппы: data.defaultFolderForm,
    ОсновнаяФормаДляВыбора: data.defaultChoiceForm,
    ОсновнаяФормаДляВыбораГруппы: data.defaultFolderChoiceForm,
    ОсновнаяФормаОбъекта: data.defaultObjectForm,
    ОсновнаяФормаСписка: data.defaultListForm,
    ОсновноеПредставление: exportSystemEnumerationToEnterprise(
      data.defaultPresentation,
      SE.CatalogMainPresentationToEnterprise,
      configurationSettings
    ),
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
    ПоляБлокировкиДанных: exportMetadataFieldsToEnterprise(data.dataLockFields, configurationSettings),
    Пояснение: exportI8nTextToEnterprise(data.explanation, configurationSettings),
    Предопределенные: exportPredefinedItemsToEnterprise(data.predefined, configurationSettings),
    ПредставлениеОбъекта: exportI8nTextToEnterprise(data.objectPresentation, configurationSettings),
    ПредставлениеСписка: exportI8nTextToEnterprise(data.listPresentation, configurationSettings),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise,
      configurationSettings
    ),
    РасширенноеПредставлениеОбъекта: exportI8nTextToEnterprise(data.extendedObjectPresentation, configurationSettings),
    РасширенноеПредставлениеСписка: exportI8nTextToEnterprise(data.extendedListPresentation, configurationSettings),
    РежимПолученияДанныхВыбораПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      data.choiceDataGetModeOnInputByString,
      SE.ChoiceDataGetModeOnInputByStringToEnterprise,
      configurationSettings
    ),
    РежимУправленияБлокировкойДанных: exportSystemEnumerationToEnterprise(
      data.dataLockControlMode,
      SE.DefaultDataLockControlModeToEnterprise,
      configurationSettings
    ),
    СерииКодов: exportSystemEnumerationToEnterprise(
      data.codeSeries,
      SE.CharacteristicKindCodesSeriesToEnterprise,
      configurationSettings
    ),
    Синоним: exportI8nTextToEnterprise(data.synonym, configurationSettings),
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(
      data.createOnInput,
      SE.CreateOnInputToEnterprise,
      configurationSettings
    ),
    СпособВыбора: exportSystemEnumerationToEnterprise(
      data.choiceMode,
      SE.ChoiceModeToEnterprise,
      configurationSettings
    ),
    СпособПоискаСтрокиПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      data.searchStringModeOnInputByString,
      SE.SearchStringModeOnInputByStringToEnterprise,
      configurationSettings
    ),
    СпособРедактирования: exportSystemEnumerationToEnterprise(
      data.editType,
      SE.EditTypeToEnterprise,
      configurationSettings
    ),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(
      data.standardAttributes,
      configurationSettings
    ),
    ТипКода: exportSystemEnumerationToEnterprise(data.codeType, SE.CatalogCodeTypeToEnterprise, configurationSettings),
    Характеристики: exportCharacteristicsDescriptionsToEnterprise(data.characteristics, configurationSettings),
    Реквизиты: exportMetadataAttributesToEnterprise(data.attributes, configurationSettings),
    ТабличныеЧасти: exportMetadataTabularSectionsToEnterprise(data.tabularSections, configurationSettings),
    Команды: exportMetadataCommandsToEnterprise(data.commands, configurationSettings),
  })
}
