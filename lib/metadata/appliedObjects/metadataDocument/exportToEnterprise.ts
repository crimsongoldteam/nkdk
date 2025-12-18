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
    ЗаписьДвиженийПриПроведении: exportSystemEnumerationToEnterprise(
      data.actionsWritingOnPost,
      SE.RegisterRecordsWritingOnPostToEnterprise,
      configurationSettings
    ),
    ДополнительныеИндексы: exportAdditionalIndexesToEnterprise(data.additionalIndexes, configurationSettings),
    Реквизиты: exportMetadataAttributesToEnterprise(data.attributes, configurationSettings),
    Автонумерация: exportBooleanToEnterprise(data.autonumbering, configurationSettings),
    ДополнительнаяФормаДляВыбора: data.auxiliaryChoiceForm,
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
    ОсновнаяФормаСписка: data.defaultListForm,
    ОсновнаяФормаОбъекта: data.defaultObjectForm,
    ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: exportBooleanToEnterprise(
      data.executeAfterWriteDataHistoryVersionProcessing,
      configurationSettings
    ),
    Пояснение: exportI8nTextToEnterprise(data.explanation, configurationSettings),
    РасширенноеПредставлениеСписка: exportI8nTextToEnterprise(data.extendedListPresentation, configurationSettings),
    РасширенноеПредставлениеОбъекта: exportI8nTextToEnterprise(data.extendedObjectPresentation, configurationSettings),
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
    ВключатьСправкуВСодержание: exportBooleanToEnterprise(data.includeHelpInContents, configurationSettings),
    ВводПоСтроке: exportMetadataFieldsToEnterprise(data.inputByString, configurationSettings),
    ПредставлениеСписка: exportI8nTextToEnterprise(data.listPresentation, configurationSettings),
    Имя: data.name,
    ДопустимаяДлинаНомера: exportSystemEnumerationToEnterprise(
      data.numberAllowedLength,
      SE.AllowedLengthToEnterprise,
      configurationSettings
    ),
    ДлинаНомера: data.numberLength,
    ПериодичностьНомера: exportSystemEnumerationToEnterprise(
      data.numberPeriodicity,
      SE.BusinessProcessNumberPeriodicityToEnterprise,
      configurationSettings
    ),
    ТипНомера: exportSystemEnumerationToEnterprise(
      data.numberType,
      SE.DocumentNumberTypeToEnterprise,
      configurationSettings
    ),
    Нумератор: exportMetadataDocumentNumeratorToEnterprise(data.numerator, configurationSettings),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise,
      configurationSettings
    ),
    ПредставлениеОбъекта: exportI8nTextToEnterprise(data.objectPresentation, configurationSettings),
    Проведение: exportSystemEnumerationToEnterprise(data.posting, SE.PostingToEnterprise, configurationSettings),
    ПривилегированныйРежимПриПроведении: exportBooleanToEnterprise(data.privilegedPostingMode, configurationSettings),
    ПривилегированныйРежимПриОтменеПроведения: exportBooleanToEnterprise(
      data.privilegedUnpostingMode,
      configurationSettings
    ),
    ОперативноеПроведение: exportSystemEnumerationToEnterprise(
      data.realTimePosting,
      SE.RealTimePostingToEnterprise,
      configurationSettings
    ),
    Движения: exportMetadataItemLinksToEnterprise(data.registerRecords, configurationSettings),
    УдалениеДвижений: exportSystemEnumerationToEnterprise(
      data.registerRecordsDeletion,
      SE.RegisterRecordsDeletionToEnterprise,
      configurationSettings
    ),
    СпособПоискаСтрокиПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      data.searchStringModeOnInputByString,
      SE.SearchStringModeOnInputByStringToEnterprise,
      configurationSettings
    ),
    ЗаполнениеПоследовательностей: exportSystemEnumerationToEnterprise(
      data.sequenceFilling,
      SE.SequenceFillingToEnterprise,
      configurationSettings
    ),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(
      data.standardAttributes,
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
