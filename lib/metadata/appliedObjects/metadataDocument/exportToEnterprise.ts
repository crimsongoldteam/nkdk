import { exportMetadataCommandsToEnterprise } from "~/lib/metadata/appliedObjects/metadataCommand/exportToEnterprise"
import { MetadataDocument, MetadataDocumentEnterprise } from "~/lib/metadata/appliedObjects/metadataDocument/types"
import { exportMetadataDocumentNumeratorToEnterprise } from "~/lib/metadata/appliedObjects/metadataDocumentNumerator/exportToEnterprise"
import { exportAdditionalIndexesToEnterprise } from "~/lib/metadata/commonObjects/additionalIndex/exportToEnterprise"
import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportCharacteristicsDescriptionsToEnterprise } from "~/lib/metadata/commonObjects/characteristicsDescription/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataAttributesToEnterprise } from "~/lib/metadata/commonObjects/metadataAttribute/exportToEnterprise"
import { exportMetadataFieldsToEnterprise } from "~/lib/metadata/commonObjects/metadataField/exportToEnterprise"
import { exportMetadataItemLinksToEnterprise } from "~/lib/metadata/commonObjects/metadataItemLink/exportToEnterprise"
import { exportMetadataTabularSectionsToEnterprise } from "~/lib/metadata/commonObjects/metadataTabularSection/exportToEnterprise"
import { exportStandardAttributeDescriptionsToEnterprise } from "~/lib/metadata/commonObjects/standardAttributeDescription/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataDocumentToEnterprise = (
  data: MetadataDocument | undefined,
  configurationSettings: ConfigurationSettings
): MetadataDocumentEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    Автонумерация: exportBooleanToEnterprise(data.autonumbering, configurationSettings),
    ВводитсяНаОсновании: exportMetadataItemLinksToEnterprise(data.basedOn, configurationSettings),
    ВводПоСтроке: exportMetadataFieldsToEnterprise(data.inputByString, configurationSettings),
    ВключатьСправкуВСодержание: exportBooleanToEnterprise(data.includeHelpInContents, configurationSettings),
    ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: exportBooleanToEnterprise(
      data.executeAfterWriteDataHistoryVersionProcessing,
      configurationSettings
    ),
    Движения: exportMetadataItemLinksToEnterprise(data.registerRecords, configurationSettings),
    ДлинаНомера: data.numberLength,
    ДополнительнаяФормаДляВыбора: data.auxiliaryChoiceForm,
    ДополнительнаяФормаОбъекта: data.auxiliaryObjectForm,
    ДополнительнаяФормаСписка: data.auxiliaryListForm,
    ДополнительныеИндексы: exportAdditionalIndexesToEnterprise(data.additionalIndexes, configurationSettings),
    ДопустимаяДлинаНомера: exportSystemEnumerationToEnterprise(
      data.numberAllowedLength,
      SE.AllowedLengthToEnterprise,
      configurationSettings
    ),
    ЗаписьДвиженийПриПроведении: exportSystemEnumerationToEnterprise(
      data.actionsWritingOnPost,
      SE.RegisterRecordsWritingOnPostToEnterprise,
      configurationSettings
    ),
    ЗаполнениеПоследовательностей: exportSystemEnumerationToEnterprise(
      data.sequenceFilling,
      SE.SequenceFillingToEnterprise,
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
    Команды: exportMetadataCommandsToEnterprise(data.commands, configurationSettings),
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(data.checkUnique, configurationSettings),
    Нумератор: exportMetadataDocumentNumeratorToEnterprise(data.numerator, configurationSettings),
    ОбновлятьИсториюДанныхСразуПослеЗаписи: exportBooleanToEnterprise(
      data.updateDataHistoryImmediatelyAfterWrite,
      configurationSettings
    ),
    ОперативноеПроведение: exportSystemEnumerationToEnterprise(
      data.realTimePosting,
      SE.RealTimePostingToEnterprise,
      configurationSettings
    ),
    ОсновнаяФормаДляВыбора: data.defaultChoiceForm,
    ОсновнаяФормаОбъекта: data.defaultObjectForm,
    ОсновнаяФормаСписка: data.defaultListForm,
    ПериодичностьНомера: exportSystemEnumerationToEnterprise(
      data.numberPeriodicity,
      SE.BusinessProcessNumberPeriodicityToEnterprise,
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
    ПредставлениеОбъекта: exportI8nTextToEnterprise(data.objectPresentation, configurationSettings),
    ПредставлениеСписка: exportI8nTextToEnterprise(data.listPresentation, configurationSettings),
    ПривилегированныйРежимПриОтменеПроведения: exportBooleanToEnterprise(
      data.privilegedUnpostingMode,
      configurationSettings
    ),
    ПривилегированныйРежимПриПроведении: exportBooleanToEnterprise(data.privilegedPostingMode, configurationSettings),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise,
      configurationSettings
    ),
    Проведение: exportSystemEnumerationToEnterprise(data.posting, SE.PostingToEnterprise, configurationSettings),
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
    Реквизиты: exportMetadataAttributesToEnterprise(data.attributes, configurationSettings),
    Синоним: exportI8nTextToEnterprise(data.synonym, configurationSettings),
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(
      data.createOnInput,
      SE.CreateOnInputToEnterprise,
      configurationSettings
    ),
    СпособПоискаСтрокиПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      data.searchStringModeOnInputByString,
      SE.SearchStringModeOnInputByStringToEnterprise,
      configurationSettings
    ),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(
      data.standardAttributes,
      configurationSettings
    ),
    ТабличныеЧасти: exportMetadataTabularSectionsToEnterprise(data.tabularSections, configurationSettings),
    ТипНомера: exportSystemEnumerationToEnterprise(
      data.numberType,
      SE.DocumentNumberTypeToEnterprise,
      configurationSettings
    ),
    УдалениеДвижений: exportSystemEnumerationToEnterprise(
      data.registerRecordsDeletion,
      SE.RegisterRecordsDeletionToEnterprise,
      configurationSettings
    ),
    Характеристики: exportCharacteristicsDescriptionsToEnterprise(data.characteristics, configurationSettings),
  })
}
