import { MetadataCatalog, MetadataCatalogEnterprise } from "~/metadata/appliedObjects/metadataCatalog/types"
import { exportMetadataCommandsToEnterprise } from "~/metadata/appliedObjects/metadataCommand/exportToEnterprise"
import { exportAdditionalIndexesToEnterprise } from "~/metadata/commonObjects/additionalIndex/exportToEnterprise"
import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportCharacteristicsDescriptionsToEnterprise } from "~/metadata/commonObjects/characteristicsDescription/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataAttributesToEnterprise } from "~/metadata/commonObjects/metadataAttribute/exportToEnterprise"
import { exportMetadataFieldsToEnterprise } from "~/metadata/commonObjects/metadataField/exportToEnterprise"
import { exportMetadataItemLinksToEnterprise } from "~/metadata/commonObjects/metadataRef/exportToEnterprise"
import { exportMetadataTabularSectionsToEnterprise } from "~/metadata/commonObjects/metadataTabularSection/exportToEnterprise"
import { exportPredefinedItemsToEnterprise } from "~/metadata/commonObjects/predifined/exportToEnterprise"
import { exportStandardAttributeDescriptionsToEnterprise } from "~/metadata/commonObjects/standardAttributeDescription/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportMetadataCatalogToEnterprise = (
  context: Context,
  data: MetadataCatalog | undefined
): MetadataCatalogEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    Автонумерация: exportBooleanToEnterprise(context, data.autonumbering),
    БыстрыйВыбор: exportBooleanToEnterprise(context, data.quickChoice),
    ВводитсяНаОсновании: exportMetadataItemLinksToEnterprise(context, data.basedOn),
    ВводПоСтроке: exportMetadataFieldsToEnterprise(context, data.inputByString),
    ВидИерархии: exportSystemEnumerationToEnterprise(context, data.hierarchyType, SE.HierarchyTypeToEnterprise),
    ВключатьСправкуВСодержание: exportBooleanToEnterprise(context, data.includeHelpInContents),
    Владельцы: exportMetadataItemLinksToEnterprise(context, data.owners),
    ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: exportBooleanToEnterprise(
      context,
      data.executeAfterWriteDataHistoryVersionProcessing
    ),
    ГруппыСверху: exportBooleanToEnterprise(context, data.foldersOnTop),
    ДлинаКода: data.codeLength,
    ДлинаНаименования: data.descriptionLength,
    ДополнительнаяФормаГруппы: data.auxiliaryFolderForm,
    ДополнительнаяФормаДляВыбора: data.auxiliaryChoiceForm,
    ДополнительнаяФормаДляВыбораГруппы: data.auxiliaryFolderChoiceForm,
    ДополнительнаяФормаОбъекта: data.auxiliaryObjectForm,
    ДополнительнаяФормаСписка: data.auxiliaryListForm,
    ДополнительныеИндексы: exportAdditionalIndexesToEnterprise(context, data.additionalIndexes),
    ДопустимаяДлинаКода: exportSystemEnumerationToEnterprise(
      context,
      data.codeAllowedLength,
      SE.AllowedLengthToEnterprise
    ),
    Иерархический: exportBooleanToEnterprise(context, data.hierarchical),
    ИспользованиеПодчинения: exportSystemEnumerationToEnterprise(
      context,
      data.subordinationUse,
      SE.SubordinationUseToEnterprise
    ),
    ИспользоватьСтандартныеКоманды: exportBooleanToEnterprise(context, data.useStandardCommands),
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      context,
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise
    ),
    ИсторияДанных: exportSystemEnumerationToEnterprise(context, data.dataHistory, SE.DataHistoryUseToEnterprise),
    КоличествоУровней: data.levelCount,
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(context, data.checkUnique),
    ОбновлениеПредопределенныхДанных: exportSystemEnumerationToEnterprise(
      context,
      data.predefinedDataUpdate,
      SE.PredefinedDataUpdateToEnterprise
    ),
    ОбновлятьИсториюДанныхСразуПослеЗаписи: exportBooleanToEnterprise(
      context,
      data.updateDataHistoryImmediatelyAfterWrite
    ),
    ОграничиватьКоличествоУровней: exportBooleanToEnterprise(context, data.limitLevelCount),
    ОсновнаяФормаГруппы: data.defaultFolderForm,
    ОсновнаяФормаДляВыбора: data.defaultChoiceForm,
    ОсновнаяФормаДляВыбораГруппы: data.defaultFolderChoiceForm,
    ОсновнаяФормаОбъекта: data.defaultObjectForm,
    ОсновнаяФормаСписка: data.defaultListForm,
    ОсновноеПредставление: exportSystemEnumerationToEnterprise(
      context,
      data.defaultPresentation,
      SE.CatalogMainPresentationToEnterprise
    ),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(
      context,
      data.fullTextSearch,
      SE.UseFullTextSearchToEnterprise
    ),
    ПолнотекстовыйПоискПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      context,
      data.fullTextSearchOnInputByString,
      SE.FullTextSearchOnInputByStringToEnterprise
    ),
    ПоляБлокировкиДанных: exportMetadataFieldsToEnterprise(context, data.dataLockFields),
    Пояснение: exportI8nTextToEnterprise(context, data.explanation),
    Предопределенные: exportPredefinedItemsToEnterprise(context, data.predefined),
    ПредставлениеОбъекта: exportI8nTextToEnterprise(context, data.objectPresentation),
    ПредставлениеСписка: exportI8nTextToEnterprise(context, data.listPresentation),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      context,
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise
    ),
    РасширенноеПредставлениеОбъекта: exportI8nTextToEnterprise(context, data.extendedObjectPresentation),
    РасширенноеПредставлениеСписка: exportI8nTextToEnterprise(context, data.extendedListPresentation),
    РежимПолученияДанныхВыбораПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      context,
      data.choiceDataGetModeOnInputByString,
      SE.ChoiceDataGetModeOnInputByStringToEnterprise
    ),
    РежимУправленияБлокировкойДанных: exportSystemEnumerationToEnterprise(
      context,
      data.dataLockControlMode,
      SE.DefaultDataLockControlModeToEnterprise
    ),
    СерииКодов: exportSystemEnumerationToEnterprise(
      context,
      data.codeSeries,
      SE.CharacteristicKindCodesSeriesToEnterprise
    ),
    Синоним: exportI8nTextToEnterprise(context, data.synonym),
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(context, data.createOnInput, SE.CreateOnInputToEnterprise),
    СпособВыбора: exportSystemEnumerationToEnterprise(context, data.choiceMode, SE.ChoiceModeToEnterprise),
    СпособПоискаСтрокиПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      context,
      data.searchStringModeOnInputByString,
      SE.SearchStringModeOnInputByStringToEnterprise
    ),
    СпособРедактирования: exportSystemEnumerationToEnterprise(context, data.editType, SE.EditTypeToEnterprise),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(context, data.standardAttributes),
    ТипКода: exportSystemEnumerationToEnterprise(context, data.codeType, SE.CatalogCodeTypeToEnterprise),
    Характеристики: exportCharacteristicsDescriptionsToEnterprise(context, data.characteristics),
    Реквизиты: exportMetadataAttributesToEnterprise(context, data.attributes),
    ТабличныеЧасти: exportMetadataTabularSectionsToEnterprise(context, data.tabularSections),
    Команды: exportMetadataCommandsToEnterprise(context, data.commands),
  })
}
