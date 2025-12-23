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
  configurationSettings: ConfigurationSettings,
  data: MetadataCatalog | undefined
): MetadataCatalogEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    Автонумерация: exportBooleanToEnterprise(configurationSettings, data.autonumbering),
    БыстрыйВыбор: exportBooleanToEnterprise(configurationSettings, data.quickChoice),
    ВводитсяНаОсновании: exportMetadataItemLinksToEnterprise(configurationSettings, data.basedOn),
    ВводПоСтроке: exportMetadataFieldsToEnterprise(configurationSettings, data.inputByString),
    ВидИерархии: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.hierarchyType,
      SE.HierarchyTypeToEnterprise
    ),
    ВключатьСправкуВСодержание: exportBooleanToEnterprise(configurationSettings, data.includeHelpInContents),
    Владельцы: exportMetadataItemLinksToEnterprise(configurationSettings, data.owners),
    ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: exportBooleanToEnterprise(
      configurationSettings,
      data.executeAfterWriteDataHistoryVersionProcessing
    ),
    ГруппыСверху: exportBooleanToEnterprise(configurationSettings, data.foldersOnTop),
    ДлинаКода: data.codeLength,
    ДлинаНаименования: data.descriptionLength,
    ДополнительнаяФормаГруппы: data.auxiliaryFolderForm,
    ДополнительнаяФормаДляВыбора: data.auxiliaryChoiceForm,
    ДополнительнаяФормаДляВыбораГруппы: data.auxiliaryFolderChoiceForm,
    ДополнительнаяФормаОбъекта: data.auxiliaryObjectForm,
    ДополнительнаяФормаСписка: data.auxiliaryListForm,
    ДополнительныеИндексы: exportAdditionalIndexesToEnterprise(configurationSettings, data.additionalIndexes),
    ДопустимаяДлинаКода: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.codeAllowedLength,
      SE.AllowedLengthToEnterprise
    ),
    Иерархический: exportBooleanToEnterprise(configurationSettings, data.hierarchical),
    ИспользованиеПодчинения: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.subordinationUse,
      SE.SubordinationUseToEnterprise
    ),
    ИспользоватьСтандартныеКоманды: exportBooleanToEnterprise(configurationSettings, data.useStandardCommands),
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise
    ),
    ИсторияДанных: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.dataHistory,
      SE.DataHistoryUseToEnterprise
    ),
    КоличествоУровней: data.levelCount,
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(configurationSettings, data.checkUnique),
    ОбновлениеПредопределенныхДанных: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.predefinedDataUpdate,
      SE.PredefinedDataUpdateToEnterprise
    ),
    ОбновлятьИсториюДанныхСразуПослеЗаписи: exportBooleanToEnterprise(
      configurationSettings,
      data.updateDataHistoryImmediatelyAfterWrite
    ),
    ОграничиватьКоличествоУровней: exportBooleanToEnterprise(configurationSettings, data.limitLevelCount),
    ОсновнаяФормаГруппы: data.defaultFolderForm,
    ОсновнаяФормаДляВыбора: data.defaultChoiceForm,
    ОсновнаяФормаДляВыбораГруппы: data.defaultFolderChoiceForm,
    ОсновнаяФормаОбъекта: data.defaultObjectForm,
    ОсновнаяФормаСписка: data.defaultListForm,
    ОсновноеПредставление: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.defaultPresentation,
      SE.CatalogMainPresentationToEnterprise
    ),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.fullTextSearch,
      SE.UseFullTextSearchToEnterprise
    ),
    ПолнотекстовыйПоискПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.fullTextSearchOnInputByString,
      SE.FullTextSearchOnInputByStringToEnterprise
    ),
    ПоляБлокировкиДанных: exportMetadataFieldsToEnterprise(configurationSettings, data.dataLockFields),
    Пояснение: exportI8nTextToEnterprise(configurationSettings, data.explanation),
    Предопределенные: exportPredefinedItemsToEnterprise(configurationSettings, data.predefined),
    ПредставлениеОбъекта: exportI8nTextToEnterprise(configurationSettings, data.objectPresentation),
    ПредставлениеСписка: exportI8nTextToEnterprise(configurationSettings, data.listPresentation),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise
    ),
    РасширенноеПредставлениеОбъекта: exportI8nTextToEnterprise(configurationSettings, data.extendedObjectPresentation),
    РасширенноеПредставлениеСписка: exportI8nTextToEnterprise(configurationSettings, data.extendedListPresentation),
    РежимПолученияДанныхВыбораПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.choiceDataGetModeOnInputByString,
      SE.ChoiceDataGetModeOnInputByStringToEnterprise
    ),
    РежимУправленияБлокировкойДанных: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.dataLockControlMode,
      SE.DefaultDataLockControlModeToEnterprise
    ),
    СерииКодов: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.codeSeries,
      SE.CharacteristicKindCodesSeriesToEnterprise
    ),
    Синоним: exportI8nTextToEnterprise(configurationSettings, data.synonym),
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.createOnInput,
      SE.CreateOnInputToEnterprise
    ),
    СпособВыбора: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.choiceMode,
      SE.ChoiceModeToEnterprise
    ),
    СпособПоискаСтрокиПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.searchStringModeOnInputByString,
      SE.SearchStringModeOnInputByStringToEnterprise
    ),
    СпособРедактирования: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.editType,
      SE.EditTypeToEnterprise
    ),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(
      configurationSettings,
      data.standardAttributes
    ),
    ТипКода: exportSystemEnumerationToEnterprise(configurationSettings, data.codeType, SE.CatalogCodeTypeToEnterprise),
    Характеристики: exportCharacteristicsDescriptionsToEnterprise(configurationSettings, data.characteristics),
    Реквизиты: exportMetadataAttributesToEnterprise(configurationSettings, data.attributes),
    ТабличныеЧасти: exportMetadataTabularSectionsToEnterprise(configurationSettings, data.tabularSections),
    Команды: exportMetadataCommandsToEnterprise(configurationSettings, data.commands),
  })
}
