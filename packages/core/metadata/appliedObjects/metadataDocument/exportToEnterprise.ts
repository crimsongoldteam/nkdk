import { exportMetadataCommandsToEnterprise } from "~/metadata/appliedObjects/metadataCommand/exportToEnterprise"
import { MetadataDocument, MetadataDocumentEnterprise } from "~/metadata/appliedObjects/metadataDocument/types"
import { exportMetadataDocumentNumeratorToEnterprise } from "~/metadata/appliedObjects/metadataDocumentNumerator/exportToEnterprise"
import { exportAdditionalIndexesToEnterprise } from "~/metadata/commonObjects/additionalIndex/exportToEnterprise"
import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportCharacteristicsDescriptionsToEnterprise } from "~/metadata/commonObjects/characteristicsDescription/exportToEnterprise"
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
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
    ДопустимаяДлинаНомера: exportSystemEnumerationToYAML<SE.AllowedLengthEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "AllowedLength" },
      data.numberAllowedLength
    ),
    ЗаписьДвиженийПриПроведении: exportSystemEnumerationToYAML<SE.RegisterRecordsWritingOnPostEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "RegisterRecordsWritingOnPost" },
      data.actionsWritingOnPost
    ),
    ЗаполнениеПоследовательностей: exportSystemEnumerationToYAML<SE.SequenceFillingEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "SequenceFilling" },
      data.sequenceFilling
    ),
    ИспользоватьСтандартныеКоманды: exportBooleanToEnterprise(context, undefined, data.useStandardCommands),
    ИсторияВыбораПриВводе: exportSystemEnumerationToYAML<SE.ChoiceHistoryOnInputEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "ChoiceHistoryOnInput" },
      data.choiceHistoryOnInput
    ),
    ИсторияДанных: exportSystemEnumerationToYAML<SE.DataHistoryUseEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "DataHistoryUse" },
      data.dataHistory
    ),
    Команды: exportMetadataCommandsToEnterprise(context, { type: "MetadataCommands" }, data.commands),
    Комментарий: data.comment,
    КонтрольУникальности: exportBooleanToEnterprise(context, undefined, data.checkUnique),
    Нумератор: exportMetadataDocumentNumeratorToEnterprise(context, data.numerator),
    ОбновлятьИсториюДанныхСразуПослеЗаписи: exportBooleanToEnterprise(
      context,
      undefined,
      data.updateDataHistoryImmediatelyAfterWrite
    ),
    ОперативноеПроведение: exportSystemEnumerationToYAML<SE.RealTimePostingEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "RealTimePosting" },
      data.realTimePosting
    ),
    ОсновнаяФормаДляВыбора: data.defaultChoiceForm,
    ОсновнаяФормаОбъекта: data.defaultObjectForm,
    ОсновнаяФормаСписка: data.defaultListForm,
    ПериодичностьНомера: exportSystemEnumerationToYAML<SE.BusinessProcessNumberPeriodicityEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "BusinessProcessNumberPeriodicity" },
      data.numberPeriodicity
    ),
    ПолнотекстовыйПоиск: exportSystemEnumerationToYAML<SE.UseFullTextSearchEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "UseFullTextSearch" },
      data.fullTextSearch
    ),
    ПолнотекстовыйПоискПриВводеПоСтроке: exportSystemEnumerationToYAML<SE.FullTextSearchOnInputByStringEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "FullTextSearchOnInputByString" },
      data.fullTextSearchOnInputByString
    ),
    ПоляБлокировкиДанных: exportMetadataFieldsToEnterprise(context, undefined, data.dataLockFields),
    Пояснение: exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.explanation }),
    ПредставлениеОбъекта: exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.objectPresentation }),
    ПредставлениеСписка: exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.listPresentation }),
    ПривилегированныйРежимПриОтменеПроведения: exportBooleanToEnterprise(
      context,
      undefined,
      data.privilegedUnpostingMode
    ),
    ПривилегированныйРежимПриПроведении: exportBooleanToEnterprise(context, undefined, data.privilegedPostingMode),
    ПринадлежностьОбъекта: exportSystemEnumerationToYAML<SE.ObjectBelongingEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "ObjectBelonging" },
      data.objectBelonging
    ),
    Проведение: exportSystemEnumerationToYAML<SE.PostingEnterprise>(
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
    РежимПолученияДанныхВыбораПриВводеПоСтроке:
      exportSystemEnumerationToYAML<SE.ChoiceDataGetModeOnInputByStringEnterprise>(
        context,
        { type: "SystemEnumeration", typeSE: "ChoiceDataGetModeOnInputByString" },
        data.choiceDataGetModeOnInputByString
      ),
    РежимУправленияБлокировкойДанных: exportSystemEnumerationToYAML<SE.DefaultDataLockControlModeEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "DefaultDataLockControlMode" },
      data.dataLockControlMode
    ),
    Реквизиты: exportMetadataAttributesToEnterprise(context, undefined, data.attributes),
    Синоним: exportI8nTextToYAML({ context, rule: { type: "I8nText" }, value: data.synonym }),
    СозданиеПриВводе: exportSystemEnumerationToYAML<SE.CreateOnInputEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "CreateOnInput" },
      data.createOnInput
    ),
    СпособПоискаСтрокиПриВводеПоСтроке: exportSystemEnumerationToYAML<SE.SearchStringModeOnInputByStringEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "SearchStringModeOnInputByString" },
      data.searchStringModeOnInputByString
    ),
    СтандартныеРеквизиты: exportStandardAttributeDescriptionsToEnterprise(context, undefined, data.standardAttributes),
    ТабличныеЧасти: exportMetadataTabularSectionsToEnterprise(context, undefined, data.tabularSections),
    ТипНомера: exportSystemEnumerationToYAML<SE.DocumentNumberTypeEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "DocumentNumberType" },
      data.numberType
    ),
    УдалениеДвижений: exportSystemEnumerationToYAML<SE.RegisterRecordsDeletionEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "RegisterRecordsDeletion" },
      data.registerRecordsDeletion
    ),
    Характеристики: exportCharacteristicsDescriptionsToEnterprise(context, undefined, data.characteristics),
  }
}
