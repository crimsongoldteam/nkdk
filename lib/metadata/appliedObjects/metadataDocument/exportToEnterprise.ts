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
  configurationSettings: ConfigurationSettings,
  data: MetadataDocument | undefined
): MetadataDocumentEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    Автонумерация: exportBooleanToEnterprise(configurationSettings, data.autonumbering),
    ВводитсяНаОсновании: exportMetadataItemLinksToEnterprise(configurationSettings, data.basedOn),
    ВводПоСтроке: exportMetadataFieldsToEnterprise(configurationSettings, data.inputByString),
    ВключатьСправкуВСодержание: exportBooleanToEnterprise(configurationSettings, data.includeHelpInContents),
    ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: exportBooleanToEnterprise(configurationSettings, data.executeAfterWriteDataHistoryVersionProcessing),
    Движения: exportMetadataItemLinksToEnterprise(configurationSettings, data.registerRecords),
    ДлинаНомера: data.numberLength,
    ДополнительнаяФормаДляВыбора: data.auxiliaryChoiceForm,
    ДополнительнаяФормаОбъекта: data.auxiliaryObjectForm,
    ДополнительнаяФормаСписка: data.auxiliaryListForm,
    ДополнительныеИндексы: exportAdditionalIndexesToEnterprise(configurationSettings, data.additionalIndexes),
    ДопустимаяДлинаНомера: exportSystemEnumerationToEnterprise(configurationSettings, data.numberAllowedLength, SE.AllowedLengthToEnterprise),
    ЗаписьДвиженийПриПроведении: exportSystemEnumerationToEnterprise(configurationSettings, data.actionsWritingOnPost, SE.RegisterRecordsWritingOnPostToEnterprise),
    ЗаполнениеПоследовательностей: exportSystemEnumerationToEnterprise(configurationSettings, data.sequenceFilling, SE.SequenceFillingToEnterprise),
    ИспользоватьСтандартныеКоманды: exportBooleanToEnterprise(configurationSettings, data.useStandardCommands),
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(configurationSettings, data.choiceHistoryOnInput, SE.ChoiceHistoryOnInputToEnterprise),
    ИсторияДанных: exportSystemEnumerationToEnterprise(configurationSettings, data.dataHistory, SE.DataHistoryUseToEnterprise),
    Команды: exportMetadataCommandsToEnterprise(configurationSettings, data.commands),
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(configurationSettings, data.checkUnique),
    Нумератор: exportMetadataDocumentNumeratorToEnterprise(configurationSettings, data.numerator),
    ОбновлятьИсториюДанныхСразуПослеЗаписи: exportBooleanToEnterprise(configurationSettings, data.updateDataHistoryImmediatelyAfterWrite),
    ОперативноеПроведение: exportSystemEnumerationToEnterprise(configurationSettings, data.realTimePosting, SE.RealTimePostingToEnterprise),
    ОсновнаяФормаДляВыбора: data.defaultChoiceForm,
    ОсновнаяФормаОбъекта: data.defaultObjectForm,
    ОсновнаяФормаСписка: data.defaultListForm,
    ПериодичностьНомера: exportSystemEnumerationToEnterprise(configurationSettings, data.numberPeriodicity, SE.BusinessProcessNumberPeriodicityToEnterprise),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(configurationSettings, data.fullTextSearch, SE.UseFullTextSearchToEnterprise),
    ПолнотекстовыйПоискПриВводеПоСтроке: exportSystemEnumerationToEnterprise(configurationSettings, data.fullTextSearchOnInputByString, SE.FullTextSearchOnInputByStringToEnterprise),
    ПоляБлокировкиДанных: exportMetadataFieldsToEnterprise(configurationSettings, data.dataLockFields),
    Пояснение: exportI8nTextToEnterprise(configurationSettings, data.explanation),
    ПредставлениеОбъекта: exportI8nTextToEnterprise(configurationSettings, data.objectPresentation),
    ПредставлениеСписка: exportI8nTextToEnterprise(configurationSettings, data.listPresentation),
    ПривилегированныйРежимПриОтменеПроведения: exportBooleanToEnterprise(configurationSettings, data.privilegedUnpostingMode),
    ПривилегированныйРежимПриПроведении: exportBooleanToEnterprise(configurationSettings, data.privilegedPostingMode),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(configurationSettings, data.objectBelonging, SE.ObjectBelongingToEnterprise),
    Проведение: exportSystemEnumerationToEnterprise(configurationSettings, data.posting, SE.PostingToEnterprise),
    РасширенноеПредставлениеОбъекта: exportI8nTextToEnterprise(configurationSettings, data.extendedObjectPresentation),
    РасширенноеПредставлениеСписка: exportI8nTextToEnterprise(configurationSettings, data.extendedListPresentation),
    РежимПолученияДанныхВыбораПриВводеПоСтроке: exportSystemEnumerationToEnterprise(configurationSettings, data.choiceDataGetModeOnInputByString, SE.ChoiceDataGetModeOnInputByStringToEnterprise),
    РежимУправленияБлокировкойДанных: exportSystemEnumerationToEnterprise(configurationSettings, data.dataLockControlMode, SE.DefaultDataLockControlModeToEnterprise),
    Реквизиты: exportMetadataAttributesToEnterprise(configurationSettings, data.attributes),
    Синоним: exportI8nTextToEnterprise(configurationSettings, data.synonym),
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(configurationSettings, data.createOnInput, SE.CreateOnInputToEnterprise),
    СпособПоискаСтрокиПриВводеПоСтроке: exportSystemEnumerationToEnterprise(configurationSettings, data.searchStringModeOnInputByString, SE.SearchStringModeOnInputByStringToEnterprise),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(configurationSettings, data.standardAttributes),
    ТабличныеЧасти: exportMetadataTabularSectionsToEnterprise(configurationSettings, data.tabularSections),
    ТипНомера: exportSystemEnumerationToEnterprise(configurationSettings, data.numberType, SE.DocumentNumberTypeToEnterprise),
    УдалениеДвижений: exportSystemEnumerationToEnterprise(configurationSettings, data.registerRecordsDeletion, SE.RegisterRecordsDeletionToEnterprise),
    Характеристики: exportCharacteristicsDescriptionsToEnterprise(configurationSettings, data.characteristics),
  })
}
