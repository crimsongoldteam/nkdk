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
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataCatalogToEnterprise = (
  data: MetadataCatalog | undefined
): MetadataCatalogEnterprise | undefined => {
  if (!data) return undefined

  return {
    ДополнительныеИндексы: exportAdditionalIndexesToEnterprise(data.additionalIndexes),
    Реквизиты: exportMetadataAttributesToEnterprise(data.attributes),
    Автонумерация: exportBooleanToEnterprise(data.autonumbering),
    ДополнительнаяФормаДляВыбора: data.auxiliaryChoiceForm,
    ДополнительнаяФормаДляВыбораГруппы: data.auxiliaryFolderChoiceForm,
    ДополнительнаяФормаГруппы: data.auxiliaryFolderForm,
    ДополнительнаяФормаСписка: data.auxiliaryListForm,
    ДополнительнаяФормаОбъекта: data.auxiliaryObjectForm,
    ВводитсяНаОсновании: exportMetadataItemLinksToEnterprise(data.basedOn),
    Характеристики: exportCharacteristicsDescriptionsToEnterprise(data.characteristics),
    КонтрольУникальности: exportBooleanToEnterprise(data.checkUnique),
    РежимПолученияДанныхВыбораПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      data.choiceDataGetModeOnInputByString,
      SE.ChoiceDataGetModeOnInputByStringToEnterprise
    ),
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise
    ),
    СпособВыбора: exportSystemEnumerationToEnterprise(data.choiceMode, SE.ChoiceModeToEnterprise),
    ДопустимаяДлинаКода: exportSystemEnumerationToEnterprise(data.codeAllowedLength, SE.AllowedLengthToEnterprise),
    ДлинаКода: data.codeLength,
    СерииКодов: exportSystemEnumerationToEnterprise(data.codeSeries, SE.CharacteristicKindCodesSeriesToEnterprise),
    ТипКода: exportSystemEnumerationToEnterprise(data.codeType, SE.CatalogCodeTypeToEnterprise),
    Команды: exportMetadataCommandsToEnterprise(data.commands),
    Комментарий: data.comment,
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(data.createOnInput, SE.CreateOnInputToEnterprise),
    ИсторияДанных: exportSystemEnumerationToEnterprise(data.dataHistory, SE.DataHistoryUseToEnterprise),
    РежимУправленияБлокировкойДанных: exportSystemEnumerationToEnterprise(
      data.dataLockControlMode,
      SE.DefaultDataLockControlModeToEnterprise
    ),
    ПоляБлокировкиДанных: exportMetadataFieldsToEnterprise(data.dataLockFields),
    ОсновнаяФормаДляВыбора: data.defaultChoiceForm,
    ОсновнаяФормаДляВыбораГруппы: data.defaultFolderChoiceForm,
    ОсновнаяФормаГруппы: data.defaultFolderForm,
    ОсновнаяФормаСписка: data.defaultListForm,
    ОсновнаяФормаОбъекта: data.defaultObjectForm,
    ОсновноеПредставление: exportSystemEnumerationToEnterprise(
      data.defaultPresentation,
      SE.CatalogMainPresentationToEnterprise
    ),
    ДлинаНаименования: data.descriptionLength,
    СпособРедактирования: exportSystemEnumerationToEnterprise(data.editType, SE.EditTypeToEnterprise),
    ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: exportBooleanToEnterprise(
      data.executeAfterWriteDataHistoryVersionProcessing
    ),
    Пояснение: exportI8nTextToEnterprise(data.explanation),
    РасширенноеПредставлениеСписка: exportI8nTextToEnterprise(data.extendedListPresentation),
    РасширенноеПредставлениеОбъекта: exportI8nTextToEnterprise(data.extendedObjectPresentation),
    ГруппыСверху: exportBooleanToEnterprise(data.foldersOnTop),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(data.fullTextSearch, SE.UseFullTextSearchToEnterprise),
    ПолнотекстовыйПоискПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      data.fullTextSearchOnInputByString,
      SE.FullTextSearchOnInputByStringToEnterprise
    ),
    Иерархический: exportBooleanToEnterprise(data.hierarchical),
    ВидИерархии: exportSystemEnumerationToEnterprise(data.hierarchyType, SE.HierarchyTypeToEnterprise),
    ВключатьСправкуВСодержание: exportBooleanToEnterprise(data.includeHelpInContents),
    ВводПоСтроке: exportMetadataFieldsToEnterprise(data.inputByString),
    КоличествоУровней: data.levelCount,
    ОграничиватьКоличествоУровней: exportBooleanToEnterprise(data.limitLevelCount),
    ПредставлениеСписка: exportI8nTextToEnterprise(data.listPresentation),
    Имя: data.name,
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(data.objectBelonging, SE.ObjectBelongingToEnterprise),
    ПредставлениеОбъекта: exportI8nTextToEnterprise(data.objectPresentation),
    Владельцы: exportMetadataItemLinksToEnterprise(data.owners),
    Предопределенные: exportPredefinedItemsToEnterprise(data.predefined),
    ОбновлениеПредопределенныхДанных: exportSystemEnumerationToEnterprise(
      data.predefinedDataUpdate,
      SE.PredefinedDataUpdateToEnterprise
    ),
    БыстрыйВыбор: exportBooleanToEnterprise(data.quickChoice),
    СпособПоискаСтрокиПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      data.searchStringModeOnInputByString,
      SE.SearchStringModeOnInputByStringToEnterprise
    ),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(data.standardAttributes),
    ИспользованиеПодчинения: exportSystemEnumerationToEnterprise(
      data.subordinationUse,
      SE.SubordinationUseToEnterprise
    ),
    Синоним: exportI8nTextToEnterprise(data.synonym),
    ТабличныеЧасти: exportMetadataTabularSectionsToEnterprise(data.tabularSections),
    ОбновлятьИсториюДанныхСразуПослеЗаписи: exportBooleanToEnterprise(data.updateDataHistoryImmediatelyAfterWrite),
    ИспользоватьСтандартныеКоманды: exportBooleanToEnterprise(data.useStandardCommands),
  }
}
