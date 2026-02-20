import { exportMetadataCommandsToYAML } from "~/metadata/appliedObjects/metadataCommand/toYAML"
import { MetadataDocument, MetadataDocumentYAML } from "~/metadata/appliedObjects/metadataDocument/types"
import { exportMetadataDocumentNumeratorToYAML } from "~/metadata/appliedObjects/metadataDocumentNumerator/toYAML"
import { exportAdditionalIndexesToYAML } from "~/metadata/commonObjects/additionalIndex/toYAML"
import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { exportCharacteristicsDescriptionsToYAML } from "~/metadata/commonObjects/characteristicsDescription/toYAML"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { exportMetadataAttributesToYAML } from "~/metadata/commonObjects/metadataAttribute/toYAML"
import { exportMetadataFieldsToYAML } from "~/metadata/commonObjects/metadataField/toYAML"
import { exportMetadataItemLinksToYAML } from "~/metadata/commonObjects/metadataRef/toYAML"
import { exportMetadataTabularSectionsToYAML } from "~/metadata/commonObjects/metadataTabularSection/toYAML"
import { exportStandardAttributeDescriptionsToYAML } from "~/metadata/commonObjects/standardAttributeDescription/toYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/toYAML"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportMetadataDocumentToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: MetadataDocument | undefined
): MetadataDocumentYAML | undefined => {
  if (!data) return undefined

  return {
    Автонумерация: exportBooleanToYAML(context, undefined, data.autonumbering),
    ВводитсяНаОсновании: exportMetadataItemLinksToYAML(context, undefined, data.basedOn),
    ВводПоСтроке: exportMetadataFieldsToYAML(context, undefined, data.inputByString),
    ВключатьСправкуВСодержание: exportBooleanToYAML(context, undefined, data.includeHelpInContents),
    ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных: exportBooleanToYAML(
      context,
      undefined,
      data.executeAfterWriteDataHistoryVersionProcessing
    ),
    Движения: exportMetadataItemLinksToYAML(context, undefined, data.registerRecords),
    ДлинаНомера: data.numberLength,
    ДополнительнаяФормаДляВыбора: data.auxiliaryChoiceForm,
    ДополнительнаяФормаОбъекта: data.auxiliaryObjectForm,
    ДополнительнаяФормаСписка: data.auxiliaryListForm,
    ДополнительныеИндексы: exportAdditionalIndexesToYAML(context, undefined, data.additionalIndexes),
    ДопустимаяДлинаНомера: exportSystemEnumerationToYAML<SE.AllowedLengthYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "AllowedLength" },
      data.numberAllowedLength
    ),
    ЗаписьДвиженийПриПроведении: exportSystemEnumerationToYAML<SE.RegisterRecordsWritingOnPostYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "RegisterRecordsWritingOnPost" },
      data.actionsWritingOnPost
    ),
    ЗаполнениеПоследовательностей: exportSystemEnumerationToYAML<SE.SequenceFillingYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "SequenceFilling" },
      data.sequenceFilling
    ),
    ИспользоватьСтандартныеКоманды: exportBooleanToYAML(context, undefined, data.useStandardCommands),
    ИсторияВыбораПриВводе: exportSystemEnumerationToYAML<SE.ChoiceHistoryOnInputYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "ChoiceHistoryOnInput" },
      data.choiceHistoryOnInput
    ),
    ИсторияДанных: exportSystemEnumerationToYAML<SE.DataHistoryUseYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "DataHistoryUse" },
      data.dataHistory
    ),
    Команды: exportMetadataCommandsToYAML(context, { type: "MetadataCommands" }, data.commands),
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToYAML(context, undefined, data.checkUnique),
    Нумератор: exportMetadataDocumentNumeratorToYAML(context, data.numerator),
    ОбновлятьИсториюДанныхСразуПослеЗаписи: exportBooleanToYAML(
      context,
      undefined,
      data.updateDataHistoryImmediatelyAfterWrite
    ),
    ОперативноеПроведение: exportSystemEnumerationToYAML<SE.RealTimePostingYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "RealTimePosting" },
      data.realTimePosting
    ),
    ОсновнаяФормаДляВыбора: data.defaultChoiceForm,
    ОсновнаяФормаОбъекта: data.defaultObjectForm,
    ОсновнаяФормаСписка: data.defaultListForm,
    ПериодичностьНомера: exportSystemEnumerationToYAML<SE.BusinessProcessNumberPeriodicityYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "BusinessProcessNumberPeriodicity" },
      data.numberPeriodicity
    ),
    ПолнотекстовыйПоиск: exportSystemEnumerationToYAML<SE.UseFullTextSearchYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "UseFullTextSearch" },
      data.fullTextSearch
    ),
    ПолнотекстовыйПоискПриВводеПоСтроке: exportSystemEnumerationToYAML<SE.FullTextSearchOnInputByStringYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "FullTextSearchOnInputByString" },
      data.fullTextSearchOnInputByString
    ),
    ПоляБлокировкиДанных: exportMetadataFieldsToYAML(context, undefined, data.dataLockFields),
    Пояснение: exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.explanation }),
    ПредставлениеОбъекта: exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.objectPresentation }),
    ПредставлениеСписка: exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.listPresentation }),
    ПривилегированныйРежимПриОтменеПроведения: exportBooleanToYAML(context, undefined, data.privilegedUnpostingMode),
    ПривилегированныйРежимПриПроведении: exportBooleanToYAML(context, undefined, data.privilegedPostingMode),
    ПринадлежностьОбъекта: exportSystemEnumerationToYAML<SE.ObjectBelongingYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "ObjectBelonging" },
      data.objectBelonging
    ),
    Проведение: exportSystemEnumerationToYAML<SE.PostingYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "Posting" },
      data.posting
    ),
    РасширенноеПредставлениеОбъекта: exportI8nTextToYAML({
      context,
      rule: { type: "I8nText" },
      value: data.extendedObjectPresentation,
    }),
    РасширенноеПредставлениеСписка: exportI8nTextToYAML({
      context,
      rule: { type: "I8nText" },
      value: data.extendedListPresentation,
    }),
    РежимПолученияДанныхВыбораПриВводеПоСтроке: exportSystemEnumerationToYAML<SE.ChoiceDataGetModeOnInputByStringYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "ChoiceDataGetModeOnInputByString" },
      data.choiceDataGetModeOnInputByString
    ),
    РежимУправленияБлокировкойДанных: exportSystemEnumerationToYAML<SE.DefaultDataLockControlModeYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "DefaultDataLockControlMode" },
      data.dataLockControlMode
    ),
    Реквизиты: exportMetadataAttributesToYAML(context, undefined, data.attributes),
    Синоним: exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.synonym }),
    СозданиеПриВводе: exportSystemEnumerationToYAML<SE.CreateOnInputYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "CreateOnInput" },
      data.createOnInput
    ),
    СпособПоискаСтрокиПриВводеПоСтроке: exportSystemEnumerationToYAML<SE.SearchStringModeOnInputByStringYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "SearchStringModeOnInputByString" },
      data.searchStringModeOnInputByString
    ),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToYAML(context, undefined, data.standardAttributes),
    ТабличныеЧасти: exportMetadataTabularSectionsToYAML(context, undefined, data.tabularSections),
    ТипНомера: exportSystemEnumerationToYAML<SE.DocumentNumberTypeYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "DocumentNumberType" },
      data.numberType
    ),
    УдалениеДвижений: exportSystemEnumerationToYAML<SE.RegisterRecordsDeletionYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "RegisterRecordsDeletion" },
      data.registerRecordsDeletion
    ),
    Характеристики: exportCharacteristicsDescriptionsToYAML(context, undefined, data.characteristics),
  }
}
