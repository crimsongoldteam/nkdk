import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import { namedCollectionTarget } from "~/metadata/orchestration/property/operationTargets"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import {
  MetadataCommands,
  MetadataCommandsXML,
  MetadataCommandsYAML,
} from "~/metadata/appliedObjects/metadataCommand/types"
import {
  AdditionalIndexes,
  AdditionalIndexesXML,
  AdditionalIndexesYAML,
} from "~/metadata/commonObjects/additionalIndex/types"
import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import {
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsXML,
  CharacteristicsDescriptionsYAML,
} from "~/metadata/commonObjects/characteristicsDescription/types"
import { I8nText, I8nTextXML, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import {
  MetadataAttributes,
  MetadataAttributesXML,
  MetadataAttributesYAML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { MetadataFields, MetadataFieldsXML, MetadataFieldsYAML } from "~/metadata/commonObjects/metadataField/types"
import {
  MetadataItemLinks,
  MetadataItemLinksXML,
  MetadataItemLinksYAML,
} from "~/metadata/commonObjects/metadataRef/types"
import {
  MetadataTabularSections,
  MetadataTabularSectionsXML,
  MetadataTabularSectionsYAML,
} from "~/metadata/commonObjects/metadataTabularSection/types"
import {
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionsYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import * as SE from "~/metadata/systemEnumerations/types"

export interface MetadataDocument {
  itemType?: "MetadataDocument"
  actionsWritingOnPost?: SE.RegisterRecordsWritingOnPost
  additionalIndexes?: AdditionalIndexes
  attributes?: MetadataAttributes
  autonumbering?: boolean
  auxiliaryChoiceForm?: string
  auxiliaryListForm?: string
  auxiliaryObjectForm?: string
  basedOn?: MetadataItemLinks
  characteristics?: CharacteristicsDescriptions
  checkUnique?: boolean
  choiceDataGetModeOnInputByString?: SE.ChoiceDataGetModeOnInputByString
  choiceHistoryOnInput?: SE.ChoiceHistoryOnInput
  commands?: MetadataCommands
  comment?: string
  createOnInput?: SE.CreateOnInput
  dataHistory?: SE.DataHistoryUse
  dataLockControlMode?: SE.DefaultDataLockControlMode
  dataLockFields?: MetadataFields
  defaultChoiceForm?: string
  defaultListForm?: string
  defaultObjectForm?: string
  executeAfterWriteDataHistoryVersionProcessing?: boolean
  explanation?: I8nText
  extendedListPresentation?: I8nText
  extendedObjectPresentation?: I8nText
  fullTextSearch?: SE.UseFullTextSearch
  fullTextSearchOnInputByString?: SE.FullTextSearchOnInputByString
  includeHelpInContents?: boolean
  inputByString?: MetadataFields
  listPresentation?: I8nText
  name: string
  numberAllowedLength?: SE.AllowedLength
  numberLength?: number
  numberPeriodicity?: SE.BusinessProcessNumberPeriodicity
  numberType?: SE.DocumentNumberType
  numerator?: string
  objectBelonging?: SE.ObjectBelonging
  objectPresentation?: I8nText
  posting?: SE.Posting
  privilegedPostingMode?: boolean
  privilegedUnpostingMode?: boolean
  realTimePosting?: SE.RealTimePosting
  registerRecords?: MetadataItemLinks
  registerRecordsDeletion?: SE.RegisterRecordsDeletion
  searchStringModeOnInputByString?: SE.SearchStringModeOnInputByString
  sequenceFilling?: SE.SequenceFilling
  standardAttributes?: StandardAttributeDescriptions
  synonym?: I8nText
  tabularSections?: MetadataTabularSections
  updateDataHistoryImmediatelyAfterWrite?: boolean
  useStandardCommands?: boolean
}

export interface MetadataDocumentXML {
  ActionsWritingOnPost?: SE.RegisterRecordsWritingOnPost
  AdditionalIndexes?: AdditionalIndexesXML
  Attributes?: MetadataAttributesXML
  Autonumbering?: boolean
  AuxiliaryChoiceForm?: string
  AuxiliaryListForm?: string
  AuxiliaryObjectForm?: string
  BasedOn?: MetadataItemLinksXML
  Characteristics?: CharacteristicsDescriptionsXML
  CheckUnique?: boolean
  ChoiceDataGetModeOnInputByString?: SE.ChoiceDataGetModeOnInputByString
  ChoiceHistoryOnInput?: SE.ChoiceHistoryOnInput
  Commands?: MetadataCommandsXML
  Comment?: string
  CreateOnInput?: SE.CreateOnInput
  DataHistory?: SE.DataHistoryUse
  DataLockControlMode?: SE.DefaultDataLockControlMode
  DataLockFields?: MetadataFieldsXML
  DefaultChoiceForm?: string
  DefaultListForm?: string
  DefaultObjectForm?: string
  ExecuteAfterWriteDataHistoryVersionProcessing?: boolean
  Explanation?: I8nTextXML
  ExtendedListPresentation?: I8nTextXML
  ExtendedObjectPresentation?: I8nTextXML
  FullTextSearch?: SE.UseFullTextSearch
  FullTextSearchOnInputByString?: SE.FullTextSearchOnInputByString
  IncludeHelpInContents?: boolean
  InputByString?: MetadataFieldsXML
  ListPresentation?: I8nTextXML
  Name: string
  NumberAllowedLength?: SE.AllowedLength
  NumberLength?: number
  NumberPeriodicity?: SE.BusinessProcessNumberPeriodicity
  NumberType?: SE.DocumentNumberType
  Numerator?: string
  ObjectBelonging?: SE.ObjectBelonging
  ObjectPresentation?: I8nTextXML
  Posting?: SE.Posting
  PrivilegedPostingMode?: boolean
  PrivilegedUnpostingMode?: boolean
  RealTimePosting?: SE.RealTimePosting
  RegisterRecords?: MetadataItemLinksXML
  RegisterRecordsDeletion?: SE.RegisterRecordsDeletion
  SearchStringModeOnInputByString?: SE.SearchStringModeOnInputByString
  SequenceFilling?: SE.SequenceFilling
  StandardAttributes?: StandardAttributeDescriptionsXML
  Synonym?: I8nTextXML
  TabularSections?: MetadataTabularSectionsXML
  UpdateDataHistoryImmediatelyAfterWrite?: boolean
  UseStandardCommands?: boolean
}

export interface MetadataDocumentYAML {
  Автонумерация?: StringboolYAML
  ВводитсяНаОсновании?: MetadataItemLinksYAML
  ВводПоСтроке?: MetadataFieldsYAML
  ВключатьСправкуВСодержание?: StringboolYAML
  ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных?: StringboolYAML
  Движения?: MetadataItemLinksYAML
  ДлинаНомера?: number
  ДополнительнаяФормаДляВыбора?: string
  ДополнительнаяФормаОбъекта?: string
  ДополнительнаяФормаСписка?: string
  ДополнительныеИндексы?: AdditionalIndexesYAML
  ДопустимаяДлинаНомера?: SE.AllowedLengthYAML
  ЗаписьДвиженийПриПроведении?: SE.RegisterRecordsWritingOnPostYAML
  ЗаполнениеПоследовательностей?: SE.SequenceFillingYAML
  Имя?: string
  ИспользоватьСтандартныеКоманды?: StringboolYAML
  ИсторияВыбораПриВводе?: SE.ChoiceHistoryOnInputYAML
  ИсторияДанных?: SE.DataHistoryUseYAML
  Команды?: MetadataCommandsYAML
  Комментарий?: string
  КонтрольУникальности?: StringboolYAML
  Нумератор?: string
  ОбновлятьИсториюДанныхСразуПослеЗаписи?: StringboolYAML
  ОперативноеПроведение?: SE.RealTimePostingYAML
  ОсновнаяФормаДляВыбора?: string
  ОсновнаяФормаОбъекта?: string
  ОсновнаяФормаСписка?: string
  ПериодичностьНомера?: SE.BusinessProcessNumberPeriodicityYAML
  ПолнотекстовыйПоиск?: SE.UseFullTextSearchYAML
  ПолнотекстовыйПоискПриВводеПоСтроке?: SE.FullTextSearchOnInputByStringYAML
  ПоляБлокировкиДанных?: MetadataFieldsYAML
  Пояснение?: I8nTextYAML
  ПредставлениеОбъекта?: I8nTextYAML
  ПредставлениеСписка?: I8nTextYAML
  ПривилегированныйРежимПриОтменеПроведения?: StringboolYAML
  ПривилегированныйРежимПриПроведении?: StringboolYAML
  ПринадлежностьОбъекта?: SE.ObjectBelongingYAML
  Проведение?: SE.PostingYAML
  РасширенноеПредставлениеОбъекта?: I8nTextYAML
  РасширенноеПредставлениеСписка?: I8nTextYAML
  РежимПолученияДанныхВыбораПриВводеПоСтроке?: SE.ChoiceDataGetModeOnInputByStringYAML
  РежимУправленияБлокировкойДанных?: SE.DefaultDataLockControlModeYAML
  Реквизиты?: MetadataAttributesYAML
  Синоним?: I8nTextYAML
  СозданиеПриВводе?: SE.CreateOnInputYAML
  СпособПоискаСтрокиПриВводеПоСтроке?: SE.SearchStringModeOnInputByStringYAML
  СтандартныеРеквизиты?: StandardAttributeDescriptionsYAML
  ТабличныеЧасти?: MetadataTabularSectionsYAML
  ТипНомера?: SE.DocumentNumberTypeYAML
  УдалениеДвижений?: SE.RegisterRecordsDeletionYAML
  Характеристики?: CharacteristicsDescriptionsYAML
}

export interface MetadataDocumentAttributesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataDocumentAttributes"
}

export type MetadataDocumentAttributesRuleParams = Omit<MetadataDocumentAttributesWidePropertyRule, "type">

export function metadataDocumentAttributesRule<const Params extends MetadataDocumentAttributesRuleParams>(
  params: WideExactRuleParams<MetadataDocumentAttributesRuleParams, Params>
): Readonly<{ type: "MetadataDocumentAttributes" } & Params> {
  return defineWidePropertyRule("MetadataDocumentAttributes", {
    ...params,
    operationTarget: namedCollectionTarget({ kind: "attribute", migrationSegment: "Реквизит", requiresMigration: true }),
  })
}
export interface MetadataDocumentTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataDocumentTabularSections"
}

export type MetadataDocumentTabularSectionsRuleParams = Omit<MetadataDocumentTabularSectionsWidePropertyRule, "type">

export function metadataDocumentTabularSectionsRule<const Params extends MetadataDocumentTabularSectionsRuleParams>(
  params: WideExactRuleParams<MetadataDocumentTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataDocumentTabularSections" } & Params> {
  return defineWidePropertyRule("MetadataDocumentTabularSections", {
    ...params,
    operationTarget: namedCollectionTarget({
      kind: "tabularSection",
      migrationSegment: "ТабличнаяЧасть",
      requiresMigration: true,
    }),
  })
}
