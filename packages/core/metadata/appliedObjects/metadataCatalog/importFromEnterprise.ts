import { MetadataCatalog, MetadataCatalogEnterprise } from "~/metadata/appliedObjects/metadataCatalog/types"
import { importMetadataCommandsFromEnterprise } from "~/metadata/appliedObjects/metadataCommand/importFromEnterprise"
import { importAdditionalIndexesFromEnterprise } from "~/metadata/commonObjects/additionalIndex/importFromEnterprise"
import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importCharacteristicsDescriptionsFromEnterprise } from "~/metadata/commonObjects/characteristicsDescription/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importMetadataAttributesFromEnterprise } from "~/metadata/commonObjects/metadataAttribute/importFromEnterprise"
import { importMetadataFieldsFromEnterprise } from "~/metadata/commonObjects/metadataField/importFromEnterprise"
import { importMetadataItemLinksFromEnterprise } from "~/metadata/commonObjects/metadataRef/importFromEnterprise"
import { importMetadataTabularSectionsFromEnterprise } from "~/metadata/commonObjects/metadataTabularSection/importFromEnterprise"
import { importPredefinedItemsFromEnterprise } from "~/metadata/commonObjects/predifined/importFromEnterprise"
import { importStandardAttributeDescriptionsFromEnterprise } from "~/metadata/commonObjects/standardAttributeDescription/importFromEnterprise"
import { Context } from "~/metadata/context/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importMetadataCatalogFromEnterprise = (
  context: Context,
  data: MetadataCatalogEnterprise | undefined,
  name: string
): MetadataCatalog | undefined => {
  if (!data) return undefined

  return compactObject({
    name,
    synonym: importI8nTextFromEnterprise(context, data.Синоним),
    comment: data.Комментарий,
    hierarchical: importBooleanFromEnterprise(context, data.Иерархический),
    hierarchyType: importSystemEnumerationFromEnterprise(context, data.ВидИерархии, SE.HierarchyTypeFromEnterprise),
    autonumbering: importBooleanFromEnterprise(context, data.Автонумерация),
    quickChoice: importBooleanFromEnterprise(context, data.БыстрыйВыбор),
    basedOn: importMetadataItemLinksFromEnterprise(context, data.ВводитсяНаОсновании),
    // inputByString: importMetadataFieldsFromEnterprise(context, data.ВводПоСтроке),
    includeHelpInContents: importBooleanFromEnterprise(context, data.ВключатьСправкуВСодержание),
    owners: importMetadataItemLinksFromEnterprise(context, data.Владельцы),
    executeAfterWriteDataHistoryVersionProcessing: importBooleanFromEnterprise(
      context,
      data.ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных
    ),
    foldersOnTop: importBooleanFromEnterprise(context, data.ГруппыСверху),
    codeLength: data.ДлинаКода,
    descriptionLength: data.ДлинаНаименования,
    auxiliaryFolderForm: data.ДополнительнаяФормаГруппы,
    auxiliaryChoiceForm: data.ДополнительнаяФормаДляВыбора,
    auxiliaryFolderChoiceForm: data.ДополнительнаяФормаДляВыбораГруппы,
    auxiliaryObjectForm: data.ДополнительнаяФормаОбъекта,
    auxiliaryListForm: data.ДополнительнаяФормаСписка,
    additionalIndexes: importAdditionalIndexesFromEnterprise(context, data.ДополнительныеИндексы),
    codeAllowedLength: importSystemEnumerationFromEnterprise(
      context,
      data.ДопустимаяДлинаКода,
      SE.AllowedLengthFromEnterprise
    ),
    subordinationUse: importSystemEnumerationFromEnterprise(
      context,
      data.ИспользованиеПодчинения,
      SE.SubordinationUseFromEnterprise
    ),
    useStandardCommands: importBooleanFromEnterprise(context, data.ИспользоватьСтандартныеКоманды),
    choiceHistoryOnInput: importSystemEnumerationFromEnterprise(
      context,
      data.ИсторияВыбораПриВводе,
      SE.ChoiceHistoryOnInputFromEnterprise
    ),
    dataHistory: importSystemEnumerationFromEnterprise(context, data.ИсторияДанных, SE.DataHistoryUseFromEnterprise),
    levelCount: data.КоличествоУровней,
    checkUnique: importBooleanFromEnterprise(context, data.КонтрольУникальности),
    predefinedDataUpdate: importSystemEnumerationFromEnterprise(
      context,
      data.ОбновлениеПредопределенныхДанных,
      SE.PredefinedDataUpdateFromEnterprise
    ),
    updateDataHistoryImmediatelyAfterWrite: importBooleanFromEnterprise(
      context,
      data.ОбновлятьИсториюДанныхСразуПослеЗаписи
    ),
    limitLevelCount: importBooleanFromEnterprise(context, data.ОграничиватьКоличествоУровней),
    defaultFolderForm: data.ОсновнаяФормаГруппы,
    defaultChoiceForm: data.ОсновнаяФормаДляВыбора,
    defaultFolderChoiceForm: data.ОсновнаяФормаДляВыбораГруппы,
    defaultObjectForm: data.ОсновнаяФормаОбъекта,
    defaultListForm: data.ОсновнаяФормаСписка,
    defaultPresentation: importSystemEnumerationFromEnterprise(
      context,
      data.ОсновноеПредставление,
      SE.CatalogMainPresentationFromEnterprise
    ),
    fullTextSearch: importSystemEnumerationFromEnterprise(
      context,
      data.ПолнотекстовыйПоиск,
      SE.UseFullTextSearchFromEnterprise
    ),
    fullTextSearchOnInputByString: importSystemEnumerationFromEnterprise(
      context,
      data.ПолнотекстовыйПоискПриВводеПоСтроке,
      SE.FullTextSearchOnInputByStringFromEnterprise
    ),
    dataLockFields: importMetadataFieldsFromEnterprise(context, data.ПоляБлокировкиДанных),
    explanation: importI8nTextFromEnterprise(context, data.Пояснение),
    predefined: importPredefinedItemsFromEnterprise(context, data.Предопределенные),
    objectPresentation: importI8nTextFromEnterprise(context, data.ПредставлениеОбъекта),
    listPresentation: importI8nTextFromEnterprise(context, data.ПредставлениеСписка),
    objectBelonging: importSystemEnumerationFromEnterprise(
      context,
      data.ПринадлежностьОбъекта,
      SE.ObjectBelongingFromEnterprise
    ),
    extendedObjectPresentation: importI8nTextFromEnterprise(context, data.РасширенноеПредставлениеОбъекта),
    extendedListPresentation: importI8nTextFromEnterprise(context, data.РасширенноеПредставлениеСписка),
    choiceDataGetModeOnInputByString: importSystemEnumerationFromEnterprise(
      context,
      data.РежимПолученияДанныхВыбораПриВводеПоСтроке,
      SE.ChoiceDataGetModeOnInputByStringFromEnterprise
    ),
    dataLockControlMode: importSystemEnumerationFromEnterprise(
      context,
      data.РежимУправленияБлокировкойДанных,
      SE.DefaultDataLockControlModeFromEnterprise
    ),
    codeSeries: importSystemEnumerationFromEnterprise(
      context,
      data.СерииКодов,
      SE.CharacteristicKindCodesSeriesFromEnterprise
    ),
    createOnInput: importSystemEnumerationFromEnterprise(
      context,
      data.СозданиеПриВводе,
      SE.CreateOnInputFromEnterprise
    ),
    choiceMode: importSystemEnumerationFromEnterprise(context, data.СпособВыбора, SE.ChoiceModeFromEnterprise),
    searchStringModeOnInputByString: importSystemEnumerationFromEnterprise(
      context,
      data.СпособПоискаСтрокиПриВводеПоСтроке,
      SE.SearchStringModeOnInputByStringFromEnterprise
    ),
    editType: importSystemEnumerationFromEnterprise(context, data.СпособРедактирования, SE.EditTypeFromEnterprise),
    standardAttributes: importStandardAttributeDescriptionsFromEnterprise(context, data.СтандартныеРеквизиты),
    codeType: importSystemEnumerationFromEnterprise(context, data.ТипКода, SE.CatalogCodeTypeFromEnterprise),
    characteristics: importCharacteristicsDescriptionsFromEnterprise(context, data.Характеристики),
    attributes: importMetadataAttributesFromEnterprise(context, data.Реквизиты),
    tabularSections: importMetadataTabularSectionsFromEnterprise(context, data.ТабличныеЧасти),
    commands: importMetadataCommandsFromEnterprise(context, data.Команды),
  })
}
