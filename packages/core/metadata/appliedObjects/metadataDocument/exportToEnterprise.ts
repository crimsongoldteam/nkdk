import { exportMetadataCommandsToEnterprise } from "~/metadata/appliedObjects/metadataCommand/exportToEnterprise"
import { MetadataDocument, MetadataDocumentEnterprise } from "~/metadata/appliedObjects/metadataDocument/types"
import { exportMetadataDocumentNumeratorToEnterprise } from "~/metadata/appliedObjects/metadataDocumentNumerator/exportToEnterprise"
import { exportAdditionalIndexesToEnterprise } from "~/metadata/commonObjects/additionalIndex/exportToEnterprise"
import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportCharacteristicsDescriptionsToEnterprise } from "~/metadata/commonObjects/characteristicsDescription/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataAttributesToEnterprise } from "~/metadata/commonObjects/metadataAttribute/exportToEnterprise"
import { exportMetadataFieldsToEnterprise } from "~/metadata/commonObjects/metadataField/exportToEnterprise"
import { exportMetadataItemLinksToEnterprise } from "~/metadata/commonObjects/metadataRef/exportToEnterprise"
import { exportMetadataTabularSectionsToEnterprise } from "~/metadata/commonObjects/metadataTabularSection/exportToEnterprise"
import { exportStandardAttributeDescriptionsToEnterprise } from "~/metadata/commonObjects/standardAttributeDescription/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportMetadataDocumentToEnterprise = (
  context: ConfigurationContext,
  data: MetadataDocument | undefined
): MetadataDocumentEnterprise | undefined => {
  if (!data) return undefined

  return {
    Автонумерация: exportBooleanToEnterprise(context, data.autonumbering),
    ВводитсяНаОсновании: exportMetadataItemLinksToEnterprise(context, data.basedOn),
    ВводПоСтроке: exportMetadataFieldsToEnterprise(context, data.inputByString),
    ВключатьСправкуВСодержание: exportBooleanToEnterprise(context, data.includeHelpInContents),
    ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: exportBooleanToEnterprise(
      context,
      data.executeAfterWriteDataHistoryVersionProcessing
    ),
    Движения: exportMetadataItemLinksToEnterprise(context, data.registerRecords),
    ДлинаНомера: data.numberLength,
    ДополнительнаяФормаДляВыбора: data.auxiliaryChoiceForm,
    ДополнительнаяФормаОбъекта: data.auxiliaryObjectForm,
    ДополнительнаяФормаСписка: data.auxiliaryListForm,
    ДополнительныеИндексы: exportAdditionalIndexesToEnterprise(context, data.additionalIndexes),
    ДопустимаяДлинаНомера: exportSystemEnumerationToYAML(
      context,
      data.numberAllowedLength,
      SE.AllowedLengthToEnterprise
    ),
    ЗаписьДвиженийПриПроведении: exportSystemEnumerationToYAML(
      context,
      data.actionsWritingOnPost,
      SE.RegisterRecordsWritingOnPostToEnterprise
    ),
    ЗаполнениеПоследовательностей: exportSystemEnumerationToYAML(
      context,
      data.sequenceFilling,
      SE.SequenceFillingToEnterprise
    ),
    ИспользоватьСтандартныеКоманды: exportBooleanToEnterprise(context, data.useStandardCommands),
    ИсторияВыбораПриВводе: exportSystemEnumerationToYAML(
      context,
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise
    ),
    ИсторияДанных: exportSystemEnumerationToYAML(context, data.dataHistory, SE.DataHistoryUseToEnterprise),
    Команды: exportMetadataCommandsToEnterprise(context, data.commands),
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(context, data.checkUnique),
    Нумератор: exportMetadataDocumentNumeratorToEnterprise(context, data.numerator),
    ОбновлятьИсториюДанныхСразуПослеЗаписи: exportBooleanToEnterprise(
      context,
      data.updateDataHistoryImmediatelyAfterWrite
    ),
    ОперативноеПроведение: exportSystemEnumerationToYAML(context, data.realTimePosting, SE.RealTimePostingToEnterprise),
    ОсновнаяФормаДляВыбора: data.defaultChoiceForm,
    ОсновнаяФормаОбъекта: data.defaultObjectForm,
    ОсновнаяФормаСписка: data.defaultListForm,
    ПериодичностьНомера: exportSystemEnumerationToYAML(
      context,
      data.numberPeriodicity,
      SE.BusinessProcessNumberPeriodicityToEnterprise
    ),
    ПолнотекстовыйПоиск: exportSystemEnumerationToYAML(context, data.fullTextSearch, SE.UseFullTextSearchToEnterprise),
    ПолнотекстовыйПоискПриВводеПоСтроке: exportSystemEnumerationToYAML(
      context,
      data.fullTextSearchOnInputByString,
      SE.FullTextSearchOnInputByStringToEnterprise
    ),
    ПоляБлокировкиДанных: exportMetadataFieldsToEnterprise(context, data.dataLockFields),
    Пояснение: exportI8nTextToEnterprise(context, data.explanation),
    ПредставлениеОбъекта: exportI8nTextToEnterprise(context, data.objectPresentation),
    ПредставлениеСписка: exportI8nTextToEnterprise(context, data.listPresentation),
    ПривилегированныйРежимПриОтменеПроведения: exportBooleanToEnterprise(context, data.privilegedUnpostingMode),
    ПривилегированныйРежимПриПроведении: exportBooleanToEnterprise(context, data.privilegedPostingMode),
    ПринадлежностьОбъекта: exportSystemEnumerationToYAML(context, data.objectBelonging, SE.ObjectBelongingToEnterprise),
    Проведение: exportSystemEnumerationToYAML(context, data.posting, SE.PostingToEnterprise),
    РасширенноеПредставлениеОбъекта: exportI8nTextToEnterprise(context, data.extendedObjectPresentation),
    РасширенноеПредставлениеСписка: exportI8nTextToEnterprise(context, data.extendedListPresentation),
    РежимПолученияДанныхВыбораПриВводеПоСтроке: exportSystemEnumerationToYAML(
      context,
      data.choiceDataGetModeOnInputByString,
      SE.ChoiceDataGetModeOnInputByStringToEnterprise
    ),
    РежимУправленияБлокировкойДанных: exportSystemEnumerationToYAML(
      context,
      data.dataLockControlMode,
      SE.DefaultDataLockControlModeToEnterprise
    ),
    Реквизиты: exportMetadataAttributesToEnterprise(context, data.attributes),
    Синоним: exportI8nTextToEnterprise(context, data.synonym),
    СозданиеПриВводе: exportSystemEnumerationToYAML(context, data.createOnInput, SE.CreateOnInputToEnterprise),
    СпособПоискаСтрокиПриВводеПоСтроке: exportSystemEnumerationToYAML(
      context,
      data.searchStringModeOnInputByString,
      SE.SearchStringModeOnInputByStringToEnterprise
    ),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(context, data.standardAttributes),
    ТабличныеЧасти: exportMetadataTabularSectionsToEnterprise(context, data.tabularSections),
    ТипНомера: exportSystemEnumerationToYAML(context, data.numberType, SE.DocumentNumberTypeToEnterprise),
    УдалениеДвижений: exportSystemEnumerationToYAML(
      context,
      data.registerRecordsDeletion,
      SE.RegisterRecordsDeletionToEnterprise
    ),
    Характеристики: exportCharacteristicsDescriptionsToEnterprise(context, data.characteristics),
  }
}
