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
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportMetadataDocumentToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
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
      data.executeAfterWriteDataHistoryVersionProcessing
    ),
    Движения: exportMetadataItemLinksToEnterprise(context, undefined, data.registerRecords),
    ДлинаНомера: data.numberLength,
    ДополнительнаяФормаДляВыбора: data.auxiliaryChoiceForm,
    ДополнительнаяФормаОбъекта: data.auxiliaryObjectForm,
    ДополнительнаяФормаСписка: data.auxiliaryListForm,
    ДополнительныеИндексы: exportAdditionalIndexesToEnterprise(context, undefined, data.additionalIndexes),
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
    ИспользоватьСтандартныеКоманды: exportBooleanToEnterprise(context, undefined, data.useStandardCommands),
    ИсторияВыбораПриВводе: exportSystemEnumerationToYAML(
      context,
      data.choiceHistoryOnInput,
      SE.ChoiceHistoryOnInputToEnterprise
    ),
    ИсторияДанных: exportSystemEnumerationToYAML(context, undefined, data.dataHistory, SE.DataHistoryUseToEnterprise),
    Команды: exportMetadataCommandsToEnterprise(context, undefined, data.commands),
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(context, undefined, data.checkUnique),
    Нумератор: exportMetadataDocumentNumeratorToEnterprise(context, undefined, data.numerator),
    ОбновлятьИсториюДанныхСразуПослеЗаписи: exportBooleanToEnterprise(
      context,
      data.updateDataHistoryImmediatelyAfterWrite
    ),
    ОперативноеПроведение: exportSystemEnumerationToYAML(
      context,
      undefined,
      data.realTimePosting,
      SE.RealTimePostingToEnterprise
    ),
    ОсновнаяФормаДляВыбора: data.defaultChoiceForm,
    ОсновнаяФормаОбъекта: data.defaultObjectForm,
    ОсновнаяФормаСписка: data.defaultListForm,
    ПериодичностьНомера: exportSystemEnumerationToYAML(
      context,
      data.numberPeriodicity,
      SE.BusinessProcessNumberPeriodicityToEnterprise
    ),
    ПолнотекстовыйПоиск: exportSystemEnumerationToYAML(
      context,
      undefined,
      data.fullTextSearch,
      SE.UseFullTextSearchToEnterprise
    ),
    ПолнотекстовыйПоискПриВводеПоСтроке: exportSystemEnumerationToYAML(
      context,
      data.fullTextSearchOnInputByString,
      SE.FullTextSearchOnInputByStringToEnterprise
    ),
    ПоляБлокировкиДанных: exportMetadataFieldsToEnterprise(context, undefined, data.dataLockFields),
    Пояснение: exportI8nTextToEnterprise(context, undefined, data.explanation),
    ПредставлениеОбъекта: exportI8nTextToEnterprise(context, undefined, data.objectPresentation),
    ПредставлениеСписка: exportI8nTextToEnterprise(context, undefined, data.listPresentation),
    ПривилегированныйРежимПриОтменеПроведения: exportBooleanToEnterprise(
      context,
      undefined,
      data.privilegedUnpostingMode
    ),
    ПривилегированныйРежимПриПроведении: exportBooleanToEnterprise(context, undefined, data.privilegedPostingMode),
    ПринадлежностьОбъекта: exportSystemEnumerationToYAML(
      context,
      undefined,
      data.objectBelonging,
      SE.ObjectBelongingToEnterprise
    ),
    Проведение: exportSystemEnumerationToYAML(context, undefined, data.posting, SE.PostingToEnterprise),
    РасширенноеПредставлениеОбъекта: exportI8nTextToEnterprise(context, undefined, data.extendedObjectPresentation),
    РасширенноеПредставлениеСписка: exportI8nTextToEnterprise(context, undefined, data.extendedListPresentation),
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
    Реквизиты: exportMetadataAttributesToEnterprise(context, undefined, data.attributes),
    Синоним: exportI8nTextToEnterprise(context, undefined, data.synonym),
    СозданиеПриВводе: exportSystemEnumerationToYAML(
      context,
      undefined,
      data.createOnInput,
      SE.CreateOnInputToEnterprise
    ),
    СпособПоискаСтрокиПриВводеПоСтроке: exportSystemEnumerationToYAML(
      context,
      data.searchStringModeOnInputByString,
      SE.SearchStringModeOnInputByStringToEnterprise
    ),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(context, undefined, data.standardAttributes),
    ТабличныеЧасти: exportMetadataTabularSectionsToEnterprise(context, undefined, data.tabularSections),
    ТипНомера: exportSystemEnumerationToYAML(context, undefined, data.numberType, SE.DocumentNumberTypeToEnterprise),
    УдалениеДвижений: exportSystemEnumerationToYAML(
      context,
      data.registerRecordsDeletion,
      SE.RegisterRecordsDeletionToEnterprise
    ),
    Характеристики: exportCharacteristicsDescriptionsToEnterprise(context, undefined, data.characteristics),
  }
}
