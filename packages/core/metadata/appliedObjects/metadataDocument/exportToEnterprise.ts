import { exportMetadataCommandsToEnterprise } from "~/metadata/appliedObjects/metadataCommand/exportToEnterprise"
import { MetadataDocument, MetadataDocumentEnterprise } from "~/metadata/appliedObjects/metadataDocument/types"
import { exportMetadataDocumentNumeratorToEnterprise } from "~/metadata/appliedObjects/metadataDocumentNumerator/exportToEnterprise"
import { exportAdditionalIndexesToEnterprise } from "~/metadata/commonObjects/additionalIndex/exportToEnterprise"
import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportCharacteristicsDescriptionsToEnterprise } from "~/metadata/commonObjects/characteristicsDescription/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportMetadataAttributesToEnterprise } from "~/metadata/commonObjects/metadataAttribute/exportToEnterprise"
import { exportMetadataFieldsToEnterprise } from "~/metadata/commonObjects/metadataField/exportToEnterprise"
import { exportMetadataItemLinksToEnterprise } from "~/metadata/commonObjects/metadataRef/exportToEnterprise"
import { exportMetadataTabularSectionsToEnterprise } from "~/metadata/commonObjects/metadataTabularSection/exportToEnterprise"
import { exportStandardAttributeDescriptionsToEnterprise } from "~/metadata/commonObjects/standardAttributeDescription/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportMetadataDocumentToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: MetadataDocument | undefined
): MetadataDocumentEnterprise | undefined => {
  if (!data) return undefined

  return {
    Автонумерация: exportBooleanToEnterprise(context, undefined, data.autonumbering),
    ВводитсяНаОсновании: exportMetadataItemLinksToEnterprise(context, undefined, data.basedOn),
    ВводПоСтроке: exportMetadataFieldsToEnterprise(context, undefined, data.inputByString),
    ВключатьСправкуВСодержание: exportBooleanToEnterprise(context, undefined, data.includeHelpInContents),
    ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: exportBooleanToEnterprise(
      context,
      undefined,
      data.executeAfterWriteDataHistoryVersionProcessing
    ),
    Движения: exportMetadataItemLinksToEnterprise(context, undefined, data.registerRecords),
    ДлинаНомера: data.numberLength,
    ДополнительнаяФормаДляВыбора: data.auxiliaryChoiceForm,
    ДополнительнаяФормаОбъекта: data.auxiliaryObjectForm,
    ДополнительнаяФормаСписка: data.auxiliaryListForm,
    ДополнительныеИндексы: exportAdditionalIndexesToEnterprise(context, undefined, data.additionalIndexes),
    ДопустимаяДлинаНомера: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.numberAllowedLength,
      SE.AllowedLengthToEnterprise
    ),
    ЗаписьДвиженийПриПроведении: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.actionsWritingOnPost,
      SE.RegisterRecordsWritingOnPostToEnterprise
    ),
    ЗаполнениеПоследовательностей: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.sequenceFilling,
      SE.SequenceFillingToEnterprise
    ),
    ИспользоватьСтандартныеКоманды: exportBooleanToEnterprise(context, undefined, data.useStandardCommands),
    ИсторияВыбораПриВводе: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise
    ),
    ИсторияДанных: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.dataHistory,
      SE.DataHistoryUseToEnterprise
    ),
    Команды: exportMetadataCommandsToEnterprise(context, undefined, data.commands),
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(context, undefined, data.checkUnique),
    Нумератор: exportMetadataDocumentNumeratorToEnterprise(context, undefined, data.numerator),
    ОбновлятьИсториюДанныхСразуПослеЗаписи: exportBooleanToEnterprise(
      context,
      undefined,
      data.updateDataHistoryImmediatelyAfterWrite
    ),
    ОперативноеПроведение: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.realTimePosting,
      SE.RealTimePostingToEnterprise
    ),
    ОсновнаяФормаДляВыбора: data.defaultChoiceForm,
    ОсновнаяФормаОбъекта: data.defaultObjectForm,
    ОсновнаяФормаСписка: data.defaultListForm,
    ПериодичностьНомера: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.numberPeriodicity,
      SE.BusinessProcessNumberPeriodicityToEnterprise
    ),
    ПолнотекстовыйПоиск: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.fullTextSearch,
      SE.UseFullTextSearchToEnterprise
    ),
    ПолнотекстовыйПоискПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.fullTextSearchOnInputByString,
      SE.FullTextSearchOnInputByStringToEnterprise
    ),
    ПоляБлокировкиДанных: exportMetadataFieldsToEnterprise(context, undefined, data.dataLockFields),
    Пояснение: exportI8nTextToYAML(context, undefined, data.explanation),
    ПредставлениеОбъекта: exportI8nTextToYAML(context, undefined, data.objectPresentation),
    ПредставлениеСписка: exportI8nTextToYAML(context, undefined, data.listPresentation),
    ПривилегированныйРежимПриОтменеПроведения: exportBooleanToEnterprise(
      context,
      undefined,
      data.privilegedUnpostingMode
    ),
    ПривилегированныйРежимПриПроведении: exportBooleanToEnterprise(context, undefined, data.privilegedPostingMode),
    ПринадлежностьОбъекта: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise
    ),
    Проведение: exportSystemEnumerationToEnterprise(context, undefined, data.posting, SE.PostingToEnterprise),
    РасширенноеПредставлениеОбъекта: exportI8nTextToYAML(context, undefined, data.extendedObjectPresentation),
    РасширенноеПредставлениеСписка: exportI8nTextToYAML(context, undefined, data.extendedListPresentation),
    РежимПолученияДанныхВыбораПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.choiceDataGetModeOnInputByString,
      SE.ChoiceDataGetModeOnInputByStringToEnterprise
    ),
    РежимУправленияБлокировкойДанных: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.dataLockControlMode,
      SE.DefaultDataLockControlModeToEnterprise
    ),
    Реквизиты: exportMetadataAttributesToEnterprise(context, undefined, data.attributes),
    Синоним: exportI8nTextToYAML(context, undefined, data.synonym),
    СозданиеПриВводе: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.createOnInput,
      SE.CreateOnInputToEnterprise
    ),
    СпособПоискаСтрокиПриВводеПоСтроке: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.searchStringModeOnInputByString,
      SE.SearchStringModeOnInputByStringToEnterprise
    ),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(context, undefined, data.standardAttributes),
    ТабличныеЧасти: exportMetadataTabularSectionsToEnterprise(context, undefined, data.tabularSections),
    ТипНомера: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.numberType,
      SE.DocumentNumberTypeToEnterprise
    ),
    УдалениеДвижений: exportSystemEnumerationToEnterprise(
      context,
      undefined,
      data.registerRecordsDeletion,
      SE.RegisterRecordsDeletionToEnterprise
    ),
    Характеристики: exportCharacteristicsDescriptionsToEnterprise(context, undefined, data.characteristics),
  }
}
