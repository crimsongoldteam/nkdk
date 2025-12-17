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
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportMetadataDocumentToEnterprise = (
  data: MetadataDocument | undefined
): MetadataDocumentEnterprise | undefined => {
  if (!data) return undefined

  return {
    ЗаписьДвиженийПриПроведении: exportSystemEnumerationToEnterprise(
      data.actionsWritingOnPost,
      SE.RegisterRecordsWritingOnPostToEnterprise
    ),
    ДополнительныеИндексы: exportAdditionalIndexesToEnterprise(data.additionalIndexes),
    Реквизиты: exportMetadataAttributesToEnterprise(data.attributes),
    Автонумерация: exportBooleanToEnterprise(data.autonumbering),
    ДополнительнаяФормаДляВыбора: data.auxiliaryChoiceForm,
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
    ОсновнаяФормаСписка: data.defaultListForm,
    ОсновнаяФормаОбъекта: data.defaultObjectForm,
    ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: exportBooleanToEnterprise(
      data.executeAfterWriteDataHistoryVersionProcessing
    ),
    Пояснение: exportI8nTextToEnterprise(data.explanation),
    РасширенноеПредставлениеСписка: exportI8nTextToEnterprise(data.extendedListPresentation),
    РасширенноеПредставлениеОбъекта: exportI8nTextToEnterprise(data.extendedObjectPresentation),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(data.fullTextSearch, SE.UseFullTextSearchToEnterprise),
    ПолнотекстовыйПоискПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      data.fullTextSearchOnInputByString,
      SE.FullTextSearchOnInputByStringToEnterprise
    ),
    ВключатьСправкуВСодержание: exportBooleanToEnterprise(data.includeHelpInContents),
    ВводПоСтроке: exportMetadataFieldsToEnterprise(data.inputByString),
    ПредставлениеСписка: exportI8nTextToEnterprise(data.listPresentation),
    Имя: data.name,
    ДопустимаяДлинаНомера: exportSystemEnumerationToEnterprise(data.numberAllowedLength, SE.AllowedLengthToEnterprise),
    ДлинаНомера: data.numberLength,
    ПериодичностьНомера: exportSystemEnumerationToEnterprise(
      data.numberPeriodicity,
      SE.BusinessProcessNumberPeriodicityToEnterprise
    ),
    ТипНомера: exportSystemEnumerationToEnterprise(data.numberType, SE.DocumentNumberTypeToEnterprise),
    Нумератор: exportMetadataDocumentNumeratorToEnterprise(data.numerator),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(data.objectBelonging, SE.ObjectBelongingToEnterprise),
    ПредставлениеОбъекта: exportI8nTextToEnterprise(data.objectPresentation),
    Проведение: exportSystemEnumerationToEnterprise(data.posting, SE.PostingToEnterprise),
    ПривилегированныйРежимПриПроведении: exportBooleanToEnterprise(data.privilegedPostingMode),
    ПривилегированныйРежимПриОтменеПроведения: exportBooleanToEnterprise(data.privilegedUnpostingMode),
    ОперативноеПроведение: exportSystemEnumerationToEnterprise(data.realTimePosting, SE.RealTimePostingToEnterprise),
    Движения: exportMetadataItemLinksToEnterprise(data.registerRecords),
    УдалениеДвижений: exportSystemEnumerationToEnterprise(
      data.registerRecordsDeletion,
      SE.RegisterRecordsDeletionToEnterprise
    ),
    СпособПоискаСтрокиПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      data.searchStringModeOnInputByString,
      SE.SearchStringModeOnInputByStringToEnterprise
    ),
    ЗаполнениеПоследовательностей: exportSystemEnumerationToEnterprise(
      data.sequenceFilling,
      SE.SequenceFillingToEnterprise
    ),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(data.standardAttributes),
    Синоним: exportI8nTextToEnterprise(data.synonym),
    ТабличныеЧасти: exportMetadataTabularSectionsToEnterprise(data.tabularSections),
    ОбновлятьИсториюДанныхСразуПослеЗаписи: exportBooleanToEnterprise(data.updateDataHistoryImmediatelyAfterWrite),
    ИспользоватьСтандартныеКоманды: exportBooleanToEnterprise(data.useStandardCommands),
  }
}
