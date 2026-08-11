import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { DataPathContribution } from "../validation/dataPath/registry"
import { MetadataAccountingRegisterRules } from "./metadataAccountingRegister/rules"
import { MetadataAccumulationRegisterRules } from "./metadataAccumulationRegister/rules"
import { MetadataBusinessProcessRules } from "./metadataBusinessProcess/rules"
import { MetadataCalculationRegisterRules } from "./metadataCalculationRegister/rules"
import { MetadataCatalogRules } from "./metadataCatalog/rules"
import { MetadataChartOfAccountsRules } from "./metadataChartOfAccounts/rules"
import { MetadataChartOfCalculationTypesRules } from "./metadataChartOfCalculationTypes/rules"
import { MetadataChartOfCharacteristicTypesRules } from "./metadataChartOfCharacteristicTypes/rules"
import { MetadataCommonAttributeRules } from "./metadataCommonAttribute/rules"
import { MetadataConstantRules } from "./metadataConstant/rules"
import { MetadataDataProcessorRules } from "./metadataDataProcessor/rules"
import { MetadataDefinedTypeRules } from "./metadataDefinedType/rules"
import { MetadataDocumentRules } from "./metadataDocument/rules"
import { MetadataDocumentJournalRules } from "./metadataDocumentJournal/rules"
import { MetadataDocumentNumeratorRules } from "./metadataDocumentNumerator/rules"
import { MetadataEnumerationRules } from "./metadataEnumeration/rules"
import { MetadataExchangePlanRules } from "./metadataExchangePlan/rules"
import { MetadataExternalDataSourceRules } from "./metadataExternalDataSource/rules"
import { MetadataFilterCriterionRules } from "./metadataFilterCriterion/rules"
import { MetadataInformationRegisterRules } from "./metadataInformationRegister/rules"
import { MetadataReportRules } from "./metadataReport/rules"
import { MetadataSettingsStorageRules } from "./metadataSettingsStorage/rules"
import { MetadataTaskRules } from "./metadataTask/rules"
import { dataPathCommonRules } from "./dataPathCommon/rules"
import { metadataReportDataPathRules } from "./metadataReport/dataPathRules"
import { metadataTaskDataPathRules } from "./metadataTask/dataPathRules"
import { metadataExchangePlanDataPathRules } from "./metadataExchangePlan/dataPathRules"
import { metadataInformationRegisterDataPathRules } from "./metadataInformationRegister/dataPathRules"
import { metadataChartOfCalculationTypesDataPathRules } from "./metadataChartOfCalculationTypes/dataPathRules"
import { metadataDocumentDataPathRules } from "./metadataDocument/dataPathRules"
import { metadataAccountingRegisterDataPathRules } from "./metadataAccountingRegister/dataPathRules"
import { metadataChartOfAccountsDataPathRules } from "./metadataChartOfAccounts/dataPathRules"
import { metadataChartOfAccountsStandardMemberRules } from "./metadataChartOfAccounts/standardMembers"
import { metadataCatalogStandardMemberRules } from "./metadataCatalog/standardMembers"
import { metadataTaskStandardMemberRules } from "./metadataTask/standardMembers"
import { metadataCalculationRegisterStandardMemberRules } from "./metadataCalculationRegister/standardMembers"
import { metadataBusinessProcessStandardMemberRules } from "./metadataBusinessProcess/standardMembers"
import { metadataExchangePlanStandardMemberRules } from "./metadataExchangePlan/standardMembers"
import { metadataEnumerationStandardMemberRules } from "./metadataEnumeration/standardMembers"
import { metadataAccumulationRegisterStandardMemberRules } from "./metadataAccumulationRegister/standardMembers"
import { metadataInformationRegisterStandardMemberRules } from "./metadataInformationRegister/standardMembers"
import { metadataAccountingRegisterStandardMemberRules } from "./metadataAccountingRegister/standardMembers"
import { metadataDocumentJournalStandardMemberRules } from "./metadataDocumentJournal/standardMembers"
import { metadataChartOfCharacteristicTypesStandardMemberRules } from "./metadataChartOfCharacteristicTypes/standardMembers"
import { metadataDocumentStandardMemberRules } from "./metadataDocument/standardMembers"
import { metadataChartOfCalculationTypesStandardMemberRules } from "./metadataChartOfCalculationTypes/standardMembers"

type OwnerRegistration = Extract<DataPathContribution, { kind: "ownerKind" }>["registration"]

const owner = (registration: OwnerRegistration): DataPathContribution => ({ kind: "ownerKind", registration })
const objectPair = (params: {
  kind: string
  objectKind: string
  projectDir: string
  rule: MetadataItemRule
  refBase: string
  objectBases: readonly string[]
  linkPrefix: string
}): readonly DataPathContribution[] => [
  owner({ kind: params.kind, projectDir: params.projectDir, rule: params.rule, typeDescriptionBases: [params.refBase], metadataLinkPrefixes: [params.linkPrefix], aliases: [params.objectKind] }),
  owner({ kind: params.objectKind, projectDir: params.projectDir, rule: params.rule, typeDescriptionBases: params.objectBases, metadataLinkPrefixes: [params.linkPrefix] }),
]

export const appliedObjectDataPathRules: readonly DataPathContribution[] = [
  dataPathCommonRules,
  ...metadataReportDataPathRules,
  ...metadataTaskDataPathRules,
  ...metadataExchangePlanDataPathRules,
  ...metadataInformationRegisterDataPathRules,
  ...metadataChartOfCalculationTypesDataPathRules,
  metadataDocumentDataPathRules,
  ...metadataAccountingRegisterDataPathRules,
  ...metadataChartOfAccountsDataPathRules,
  ...metadataChartOfAccountsStandardMemberRules,
  ...metadataCatalogStandardMemberRules,
  ...metadataTaskStandardMemberRules,
  ...metadataCalculationRegisterStandardMemberRules,
  ...metadataBusinessProcessStandardMemberRules,
  ...metadataExchangePlanStandardMemberRules,
  ...metadataEnumerationStandardMemberRules,
  ...metadataAccumulationRegisterStandardMemberRules,
  ...metadataInformationRegisterStandardMemberRules,
  ...metadataAccountingRegisterStandardMemberRules,
  ...metadataDocumentJournalStandardMemberRules,
  ...metadataChartOfCharacteristicTypesStandardMemberRules,
  ...metadataDocumentStandardMemberRules,
  ...metadataChartOfCalculationTypesStandardMemberRules,
  ...objectPair({ kind: "Справочник", objectKind: "СправочникОбъект", projectDir: "Справочник", rule: MetadataCatalogRules, refBase: "CatalogRef", objectBases: ["CatalogObject"], linkPrefix: "Catalog" }),
  ...objectPair({ kind: "Документ", objectKind: "ДокументОбъект", projectDir: "Документ", rule: MetadataDocumentRules, refBase: "DocumentRef", objectBases: ["DocumentObject"], linkPrefix: "Document" }),
  ...objectPair({ kind: "ПланОбмена", objectKind: "ПланОбменаОбъект", projectDir: "ПланОбмена", rule: MetadataExchangePlanRules, refBase: "ExchangePlanRef", objectBases: ["ExchangePlanObject"], linkPrefix: "ExchangePlan" }),
  ...objectPair({ kind: "ПланСчетов", objectKind: "ПланСчетовОбъект", projectDir: "ПланСчетов", rule: MetadataChartOfAccountsRules, refBase: "ChartOfAccountsRef", objectBases: ["ChartOfAccountObject", "ChartOfAccountsObject"], linkPrefix: "ChartOfAccounts" }),
  ...objectPair({ kind: "ПланВидовРасчета", objectKind: "ПланВидовРасчетаОбъект", projectDir: "ПланВидовРасчета", rule: MetadataChartOfCalculationTypesRules, refBase: "ChartOfCalculationTypesRef", objectBases: ["ChartOfCalculationTypesObject"], linkPrefix: "ChartOfCalculationTypes" }),
  ...objectPair({ kind: "ПланВидовХарактеристик", objectKind: "ПланВидовХарактеристикОбъект", projectDir: "ПланВидовХарактеристик", rule: MetadataChartOfCharacteristicTypesRules, refBase: "ChartOfCharacteristicTypesRef", objectBases: ["ChartOfCharacteristicTypesObject"], linkPrefix: "ChartOfCharacteristicTypes" }),
  ...objectPair({ kind: "БизнесПроцесс", objectKind: "БизнесПроцессОбъект", projectDir: "БизнесПроцесс", rule: MetadataBusinessProcessRules, refBase: "BusinessProcessRef", objectBases: ["BusinessProcessObject"], linkPrefix: "BusinessProcess" }),
  ...objectPair({ kind: "Задача", objectKind: "ЗадачаОбъект", projectDir: "Задача", rule: MetadataTaskRules, refBase: "TaskRef", objectBases: ["TaskObject"], linkPrefix: "Task" }),
  owner({ kind: "Перечисление", projectDir: "Перечисление", rule: MetadataEnumerationRules, typeDescriptionBases: ["EnumRef"], metadataLinkPrefixes: ["Enum"] }),
  owner({ kind: "РегистрСведений", projectDir: "РегистрСведений", rule: MetadataInformationRegisterRules, typeDescriptionBases: ["InformationRegisterRecordManager"], registerRecordSetBases: ["InformationRegisterRecordSet"], metadataLinkPrefixes: ["InformationRegister", "РегистрСведений"] }),
  owner({ kind: "РегистрНакопления", projectDir: "РегистрНакопления", rule: MetadataAccumulationRegisterRules, typeDescriptionBases: ["AccumulationRegisterRecordManager"], registerRecordSetBases: ["AccumulationRegisterRecordSet"], metadataLinkPrefixes: ["AccumulationRegister", "РегистрНакопления"] }),
  owner({ kind: "РегистрБухгалтерии", projectDir: "РегистрБухгалтерии", rule: MetadataAccountingRegisterRules, typeDescriptionBases: ["AccountingRegisterRecordManager"], registerRecordSetBases: ["AccountingRegisterRecordSet"], metadataLinkPrefixes: ["AccountingRegister", "РегистрБухгалтерии"] }),
  owner({ kind: "РегистрРасчета", projectDir: "РегистрРасчета", rule: MetadataCalculationRegisterRules, typeDescriptionBases: ["CalculationRegisterRecordManager"], registerRecordSetBases: ["CalculationRegisterRecordSet"], metadataLinkPrefixes: ["CalculationRegister", "РегистрРасчета"] }),
  owner({ kind: "Обработка", projectDir: "Обработка", rule: MetadataDataProcessorRules, metadataLinkPrefixes: ["DataProcessor"], aliases: ["ОбработкаОбъект"] }),
  owner({ kind: "ОбработкаОбъект", projectDir: "Обработка", rule: MetadataDataProcessorRules, typeDescriptionBases: ["DataProcessorObject"], metadataLinkPrefixes: ["DataProcessor"] }),
  owner({ kind: "Отчет", projectDir: "Отчет", rule: MetadataReportRules, metadataLinkPrefixes: ["Report"], aliases: ["ОтчетОбъект"] }),
  owner({ kind: "ОтчетОбъект", projectDir: "Отчет", rule: MetadataReportRules, typeDescriptionBases: ["ReportObject"], metadataLinkPrefixes: ["Report"] }),
  owner({ kind: "Константа", projectDir: "Константа", rule: MetadataConstantRules }),
  owner({ kind: "ОбщийРеквизит", projectDir: "ОбщийРеквизит", rule: MetadataCommonAttributeRules }),
  owner({ kind: "ОпределяемыйТип", projectDir: "ОпределяемыйТип", rule: MetadataDefinedTypeRules }),
  owner({ kind: "КритерийОтбора", projectDir: "КритерийОтбора", rule: MetadataFilterCriterionRules }),
  owner({ kind: "ХранилищеНастроек", projectDir: "ХранилищеНастроек", rule: MetadataSettingsStorageRules }),
  owner({ kind: "ЖурналДокументов", projectDir: "ЖурналДокументов", rule: MetadataDocumentJournalRules }),
  owner({ kind: "НумераторДокументов", projectDir: "Нумератор", rule: MetadataDocumentNumeratorRules }),
  owner({ kind: "ВнешнийИсточникДанных", projectDir: "ВнешнийИсточникДанных", rule: MetadataExternalDataSourceRules }),
]
