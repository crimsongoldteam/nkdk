import type { MetadataItemRule } from "../../orchestration"
import { MetadataAccountingRegisterRules } from "../metadataAccountingRegister/rules"
import { readAccountingRegisterYAML } from "../metadataAccountingRegister/__fixtures__/sync/data"
import { MetadataAccumulationRegisterRules } from "../metadataAccumulationRegister/rules"
import { readAccumulationRegisterYAML } from "../metadataAccumulationRegister/__fixtures__/sync/data"
import { MetadataBusinessProcessRules } from "../metadataBusinessProcess/rules"
import { readBusinessProcessYAML } from "../metadataBusinessProcess/__fixtures__/sync/data"
import { MetadataCalculationRegisterRules } from "../metadataCalculationRegister/rules"
import { readCalculationRegisterYAML } from "../metadataCalculationRegister/__fixtures__/sync/data"
import { MetadataChartOfAccountsRules } from "../metadataChartOfAccounts/rules"
import { readChartOfAccountsYAML } from "../metadataChartOfAccounts/__fixtures__/sync/data"
import { MetadataChartOfCalculationTypesRules } from "../metadataChartOfCalculationTypes/rules"
import { readChartOfCalculationTypesYAML } from "../metadataChartOfCalculationTypes/__fixtures__/sync/data"
import { MetadataChartOfCharacteristicTypesRules } from "../metadataChartOfCharacteristicTypes/rules"
import { readChartOfCharacteristicTypesYAML } from "../metadataChartOfCharacteristicTypes/__fixtures__/sync/data"
import { MetadataCommandGroupRules } from "../metadataCommandGroup/rules"
import { readCommandGroupYAML } from "../metadataCommandGroup/__fixtures__/sync/data"
import { MetadataCommonCommandRules } from "../metadataCommonCommand/rules"
import { readCommonCommandYAML } from "../metadataCommonCommand/__fixtures__/sync/data"
import { MetadataCommonFormRules } from "../metadataCommonForm/rules"
import { readCommonFormYAML } from "../metadataCommonForm/__fixtures__/sync/data"
import { MetadataCommonPictureRules } from "../metadataCommonPicture/rules"
import { readCommonPictureYAML } from "../metadataCommonPicture/__fixtures__/sync/data"
import { MetadataCommonTemplateRules } from "../metadataCommonTemplate/rules"
import { readCommonTemplateYAML } from "../metadataCommonTemplate/__fixtures__/sync/data"
import { MetadataFunctionalOptionRules } from "../metadataFunctionalOption/rules"
import { readFunctionalOptionYAML } from "../metadataFunctionalOption/__fixtures__/sync/data"
import { MetadataInformationRegisterRules } from "../metadataInformationRegister/rules"
import { readInformationRegisterYAML } from "../metadataInformationRegister/__fixtures__/sync/data"
import { MetadataIntegrationServiceRules } from "../metadataIntegrationService/rules"
import { readIntegrationServiceYAML } from "../metadataIntegrationService/__fixtures__/sync/data"
import { MetadataLanguageRules } from "../metadataLanguage/rules"
import { MetadataRoleRules } from "../metadataRole/rules"
import { readRoleYAML } from "../metadataRole/__fixtures__/sync/data"
import { MetadataScheduledJobRules } from "../metadataScheduledJob/rules"
import { readScheduledJobYAML } from "../metadataScheduledJob/__fixtures__/sync/data"
import { MetadataStyleRules } from "../metadataStyle/rules"
import { readStyleYAML } from "../metadataStyle/__fixtures__/sync/data"
import { MetadataSubsystemRules } from "../metadataSubsystem/rules"
import { MetadataTaskRules } from "../metadataTask/rules"
import { MetadataWebServiceRules } from "../metadataWebService/rules"
import { readWebServiceYAML } from "../metadataWebService/__fixtures__/sync/data"
import { MetadataCommonModuleRules } from "../metadataCommonModule/rules"
import { readCommonModuleYAML } from "../metadataCommonModule/__fixtures__/sync/data"
import { MetadataWebSocketClientRules } from "../metadataWebSocketClient/rules"
import { readWebSocketClientYAML } from "../metadataWebSocketClient/__fixtures__/sync/data"
import { MetadataXDTOPackageRules } from "../metadataXDTOPackage/rules"
import { readXDTOPackageYAML } from "../metadataXDTOPackage/__fixtures__/sync/data"
import { MetadataExternalDataSourceRules } from "../metadataExternalDataSource/rules"
import { readExternalDataSourceYAML } from "../metadataExternalDataSource/__fixtures__/sync/data"
import { MetadataExchangePlanRules } from "../metadataExchangePlan/rules"
import { readExchangePlanYAML } from "../metadataExchangePlan/__fixtures__/sync/data"
import { MetadataStyleItemRules } from "../metadataStyleItem/rules"
import { readStyleItemYAML } from "../metadataStyleItem/__fixtures__/sync/data"
import { MetadataBotRules } from "../metadataBot/rules"
import { readBotYAML } from "../metadataBot/__fixtures__/sync/data"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { readCatalogYAML } from "../metadataCatalog/__fixtures__/sync/data"
import { MetadataCommonAttributeRules } from "../metadataCommonAttribute/rules"
import { readCommonAttributeYAML } from "../metadataCommonAttribute/__fixtures__/sync/data"
import { MetadataConstantRules } from "../metadataConstant/rules"
import { readConstantYAML } from "../metadataConstant/__fixtures__/sync/data"
import { MetadataDataProcessorRules } from "../metadataDataProcessor/rules"
import { readDataProcessorYAML } from "../metadataDataProcessor/__fixtures__/sync/data"
import { MetadataDefinedTypeRules } from "../metadataDefinedType/rules"
import { readDefinedTypeYAML } from "../metadataDefinedType/__fixtures__/sync/data"
import { MetadataDocumentRules } from "../metadataDocument/rules"
import { readDocumentYAML } from "../metadataDocument/__fixtures__/sync/data"
import { MetadataDocumentJournalRules } from "../metadataDocumentJournal/rules"
import { readDocumentJournalYAML } from "../metadataDocumentJournal/__fixtures__/sync/data"
import { MetadataDocumentNumeratorRules } from "../metadataDocumentNumerator/rules"
import { readNumeratorYAML } from "../metadataDocumentNumerator/__fixtures__/sync/data"
import { MetadataEnumerationRules } from "../metadataEnumeration/rules"
import { readEnumerationYAML } from "../metadataEnumeration/__fixtures__/sync/data"
import { MetadataEventSubscriptionRules } from "../metadataEventSubscription/rules"
import { readEventSubscriptionYAML } from "../metadataEventSubscription/__fixtures__/sync/data"
import { MetadataFilterCriterionRules } from "../metadataFilterCriterion/rules"
import { readFilterCriterionYAML } from "../metadataFilterCriterion/__fixtures__/sync/data"
import { MetadataFunctionalOptionsParameterRules } from "../metadataFunctionalOptionsParameter/rules"
import { readFunctionalOptionsParameterYAML } from "../metadataFunctionalOptionsParameter/__fixtures__/sync/data"
import { MetadataHTTPServiceRules } from "../metadataHTTPService/rules"
import { readHTTPServiceYAML } from "../metadataHTTPService/__fixtures__/sync/data"
import { MetadataReportRules } from "../metadataReport/rules"
import { readReportYAML } from "../metadataReport/__fixtures__/sync/data"
import { MetadataSequenceRules } from "../metadataSequence/rules"
import { readSequenceYAML } from "../metadataSequence/__fixtures__/sync/data"
import { MetadataSessionParameterRules } from "../metadataSessionParameter/rules"
import { readSessionParameterYAML } from "../metadataSessionParameter/__fixtures__/sync/data"
import { MetadataSettingsStorageRules } from "../metadataSettingsStorage/rules"
import { readSettingsStorageYAML } from "../metadataSettingsStorage/__fixtures__/sync/data"
import { MetadataWSReferenceRules } from "../metadataWSReference/rules"
import { readWSReferenceYAML } from "../metadataWSReference/__fixtures__/sync/data"

export type AppliedObjectModelFixture = {
  fixture: string
  name: string
}

export type AppliedObjectSyncFixture = {
  name: string
  expectedYAML: string
  externalObjectDir?: boolean
}

export type AppliedObjectYAMLFixture = {
  group: string
  rule: MetadataItemRule
  importMetaUrl: string
  modelFixtures: AppliedObjectModelFixture[]
  sync?: AppliedObjectSyncFixture
}

function syncOnlyFixture(
  group: string,
  rule: MetadataItemRule,
  rulePath: string,
  name: string,
  expectedYAML: string,
  externalObjectDir = false
): AppliedObjectYAMLFixture {
  return {
    group,
    rule,
    importMetaUrl: import.meta.resolve(rulePath),
    modelFixtures: [],
    sync: { name, expectedYAML, ...(externalObjectDir ? { externalObjectDir: true } : {}) },
  }
}

export const appliedObjectYAMLFixtures: AppliedObjectYAMLFixture[] = [
  syncOnlyFixture("metadataBot", MetadataBotRules, "../metadataBot/rules.ts", "БотВсеСвойства", readBotYAML),
  syncOnlyFixture(
    "metadataCatalog",
    MetadataCatalogRules,
    "../metadataCatalog/rules.ts",
    "СправочникCоВсемиОбъектами",
    readCatalogYAML,
    true
  ),
  syncOnlyFixture(
    "metadataCommonAttribute",
    MetadataCommonAttributeRules,
    "../metadataCommonAttribute/rules.ts",
    "ОбщийРеквизитВсеСвойства",
    readCommonAttributeYAML
  ),
  syncOnlyFixture(
    "metadataConstant",
    MetadataConstantRules,
    "../metadataConstant/rules.ts",
    "КонстантаВсеСвойства",
    readConstantYAML,
    true
  ),
  syncOnlyFixture(
    "metadataDataProcessor",
    MetadataDataProcessorRules,
    "../metadataDataProcessor/rules.ts",
    "ОбработкаВсеСвойства",
    readDataProcessorYAML,
    true
  ),
  syncOnlyFixture(
    "metadataDefinedType",
    MetadataDefinedTypeRules,
    "../metadataDefinedType/rules.ts",
    "ОпределяемыйТипВсеСвойства",
    readDefinedTypeYAML
  ),
  syncOnlyFixture(
    "metadataDocument",
    MetadataDocumentRules,
    "../metadataDocument/rules.ts",
    "ДокументВсеСвойства",
    readDocumentYAML,
    true
  ),
  syncOnlyFixture(
    "metadataDocumentJournal",
    MetadataDocumentJournalRules,
    "../metadataDocumentJournal/rules.ts",
    "ЖурналДокументовВсеСвойства",
    readDocumentJournalYAML,
    true
  ),
  syncOnlyFixture(
    "metadataDocumentNumerator",
    MetadataDocumentNumeratorRules,
    "../metadataDocumentNumerator/rules.ts",
    "НумераторПоУмолчанию",
    readNumeratorYAML
  ),
  syncOnlyFixture(
    "metadataEnumeration",
    MetadataEnumerationRules,
    "../metadataEnumeration/rules.ts",
    "ПеречислениеВсеСвойства",
    readEnumerationYAML
  ),
  syncOnlyFixture(
    "metadataEventSubscription",
    MetadataEventSubscriptionRules,
    "../metadataEventSubscription/rules.ts",
    "ПодпискаНаСобытиеВсеСвойства",
    readEventSubscriptionYAML
  ),
  syncOnlyFixture(
    "metadataFilterCriterion",
    MetadataFilterCriterionRules,
    "../metadataFilterCriterion/rules.ts",
    "КритерийОтбораВсеСвойства",
    readFilterCriterionYAML,
    true
  ),
  syncOnlyFixture(
    "metadataFunctionalOptionsParameter",
    MetadataFunctionalOptionsParameterRules,
    "../metadataFunctionalOptionsParameter/rules.ts",
    "ПараметрФункциональныхОпцийВсеСвойства",
    readFunctionalOptionsParameterYAML
  ),
  syncOnlyFixture(
    "metadataHTTPService",
    MetadataHTTPServiceRules,
    "../metadataHTTPService/rules.ts",
    "HTTPСервисВсеСвойства",
    readHTTPServiceYAML,
    true
  ),
  syncOnlyFixture(
    "metadataReport",
    MetadataReportRules,
    "../metadataReport/rules.ts",
    "ОтчетВсеСвойства",
    readReportYAML,
    true
  ),
  syncOnlyFixture(
    "metadataSequence",
    MetadataSequenceRules,
    "../metadataSequence/rules.ts",
    "ПоследовательностьВсеПоля",
    readSequenceYAML,
    true
  ),
  syncOnlyFixture(
    "metadataSessionParameter",
    MetadataSessionParameterRules,
    "../metadataSessionParameter/rules.ts",
    "ПараметрСеансаВсеСвойства",
    readSessionParameterYAML
  ),
  syncOnlyFixture(
    "metadataSettingsStorage",
    MetadataSettingsStorageRules,
    "../metadataSettingsStorage/rules.ts",
    "ХранилищеНастроекВсеСвойства",
    readSettingsStorageYAML,
    true
  ),
  syncOnlyFixture(
    "metadataWSReference",
    MetadataWSReferenceRules,
    "../metadataWSReference/rules.ts",
    "WSСсылкаВсеСвойства",
    readWSReferenceYAML,
    true
  ),
  {
    group: "metadataCommonModule",
    rule: MetadataCommonModuleRules,
    importMetaUrl: import.meta.resolve("../metadataCommonModule/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ОбщийМодульГлобальный" },
      { fixture: "minimal.xml", name: "ОбщийМодульПоУмолчанию" },
      { fixture: "client.xml", name: "ОбщийМодульКлиент" },
      { fixture: "reusable.xml", name: "ОбщийМодульПовторный" },
    ],
    sync: {
      name: "ОбщийМодульГлобальный",
      expectedYAML: readCommonModuleYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataWebSocketClient",
    rule: MetadataWebSocketClientRules,
    importMetaUrl: import.meta.resolve("../metadataWebSocketClient/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "WebSocketКлиентВсеСвойства" },
      { fixture: "minimal.xml", name: "WebSocketКлиентПоУмолчанию" },
    ],
    sync: {
      name: "WebSocketКлиентВсеСвойства",
      expectedYAML: readWebSocketClientYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataXDTOPackage",
    rule: MetadataXDTOPackageRules,
    importMetaUrl: import.meta.resolve("../metadataXDTOPackage/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ПакетXDTOВсеСвойства" },
      { fixture: "minimal.xml", name: "ПакетXDTOПоУмолчанию" },
    ],
    sync: { name: "ПакетXDTOВсеСвойства", expectedYAML: readXDTOPackageYAML },
  },
  {
    group: "metadataExternalDataSource",
    rule: MetadataExternalDataSourceRules,
    importMetaUrl: import.meta.resolve("../metadataExternalDataSource/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ВнешнийИсточникДанныхВсеСвойства" },
      { fixture: "minimal.xml", name: "ВнешнийИсточникДанныхПоУмолчанию" },
    ],
    sync: {
      name: "ВнешнийИсточникДанныхВсеСвойства",
      expectedYAML: readExternalDataSourceYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataExchangePlan",
    rule: MetadataExchangePlanRules,
    importMetaUrl: import.meta.resolve("../metadataExchangePlan/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ПланОбменаВсеСвойства" },
      { fixture: "minimal.xml", name: "ПланОбменаПоУмолчанию" },
    ],
    sync: {
      name: "ПланОбменаВсеСвойства",
      expectedYAML: readExchangePlanYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataStyleItem",
    rule: MetadataStyleItemRules,
    importMetaUrl: import.meta.resolve("../metadataStyleItem/rules.ts"),
    modelFixtures: [
      { fixture: "font.xml", name: "ЭлементСтиляШрифтВсеСвойства" },
      { fixture: "color.xml", name: "ЭлементСтиляЦвет" },
      { fixture: "border.xml", name: "ЭлементСтиляРамка" },
    ],
    sync: { name: "ЭлементСтиляШрифтВсеСвойства", expectedYAML: readStyleItemYAML },
  },
  {
    group: "metadataAccumulationRegister",
    rule: MetadataAccumulationRegisterRules,
    importMetaUrl: import.meta.resolve("../metadataAccumulationRegister/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "РегистрНакопленияВсеСвойстваОбороты" },
      { fixture: "minimal.xml", name: "РегистрНакопленияПоУмолчанию" },
    ],
    sync: {
      name: "РегистрНакопленияВсеСвойстваОбороты",
      expectedYAML: readAccumulationRegisterYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataAccountingRegister",
    rule: MetadataAccountingRegisterRules,
    importMetaUrl: import.meta.resolve("../metadataAccountingRegister/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "РегистрБухгалтерииВсеСвойстваОбороты" },
      { fixture: "minimal.xml", name: "РегистрБухгалтерииПоУмолчанию" },
    ],
    sync: {
      name: "РегистрБухгалтерииВсеСвойстваОбороты",
      expectedYAML: readAccountingRegisterYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataCalculationRegister",
    rule: MetadataCalculationRegisterRules,
    importMetaUrl: import.meta.resolve("../metadataCalculationRegister/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "РегистрРасчетаВсеСвойства" },
      { fixture: "minimal.xml", name: "РегистрРасчетаПоУмолчанию" },
    ],
    sync: {
      name: "РегистрРасчетаВсеСвойства",
      expectedYAML: readCalculationRegisterYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataInformationRegister",
    rule: MetadataInformationRegisterRules,
    importMetaUrl: import.meta.resolve("../metadataInformationRegister/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "РегистрСведенийВсеСвойстваНезависимый" },
      { fixture: "minimal.xml", name: "РегистрСведенийПоУмолчанию" },
      { fixture: "reg.xml", name: "РегистрСведенийПодчиненРегистратору" },
    ],
    sync: {
      name: "РегистрСведенийВсеСвойстваНезависимый",
      expectedYAML: readInformationRegisterYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataChartOfAccounts",
    rule: MetadataChartOfAccountsRules,
    importMetaUrl: import.meta.resolve("../metadataChartOfAccounts/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ПланСчетовВсеСвойства" },
      { fixture: "minimal.xml", name: "ПланСчетовПоУмолчанию" },
    ],
    sync: {
      name: "ПланСчетовВсеСвойства",
      expectedYAML: readChartOfAccountsYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataChartOfCalculationTypes",
    rule: MetadataChartOfCalculationTypesRules,
    importMetaUrl: import.meta.resolve("../metadataChartOfCalculationTypes/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ПланРасчетаВсеСвойства" },
      { fixture: "minimal.xml", name: "ПланВидовРасчетаПоУмолчанию" },
    ],
    sync: {
      name: "ПланРасчетаВсеСвойства",
      expectedYAML: readChartOfCalculationTypesYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataChartOfCharacteristicTypes",
    rule: MetadataChartOfCharacteristicTypesRules,
    importMetaUrl: import.meta.resolve("../metadataChartOfCharacteristicTypes/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ПланВидовХарактеристикВсеСвойства" },
      { fixture: "minimal.xml", name: "ПланВидовХарактеристикПоУмолчанию" },
    ],
    sync: {
      name: "ПланВидовХарактеристикВсеСвойства",
      expectedYAML: readChartOfCharacteristicTypesYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataBusinessProcess",
    rule: MetadataBusinessProcessRules,
    importMetaUrl: import.meta.resolve("../metadataBusinessProcess/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "БизнесПроцессВсеСвойства" },
      { fixture: "minimal.xml", name: "БизнесПроцессПоУмолчанию" },
    ],
    sync: {
      name: "БизнесПроцессВсеСвойства",
      expectedYAML: readBusinessProcessYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataCommandGroup",
    rule: MetadataCommandGroupRules,
    importMetaUrl: import.meta.resolve("../metadataCommandGroup/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ГруппаКомандВсеСвойства" },
      { fixture: "minimal.xml", name: "ГруппаКомандПоУмолчанию" },
    ],
    sync: {
      name: "ГруппаКомандВсеСвойства",
      expectedYAML: readCommandGroupYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataCommonCommand",
    rule: MetadataCommonCommandRules,
    importMetaUrl: import.meta.resolve("../metadataCommonCommand/rules.ts"),
    modelFixtures: [{ fixture: "full.xml", name: "ОбщаяКомандаПолная" }],
    sync: {
      name: "ОбщаяКомандаПолная",
      expectedYAML: readCommonCommandYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataCommonForm",
    rule: MetadataCommonFormRules,
    importMetaUrl: import.meta.resolve("../metadataCommonForm/rules.ts"),
    modelFixtures: [
      { fixture: "changesStory.xml", name: "ФормаРазличийВерсийИсторииДанных" },
      { fixture: "const.xml", name: "КонстантаВсеСвойства" },
      { fixture: "dialog.xml", name: "ФормаВыбораПользователейСистемыВзаимодействия" },
      { fixture: "dynamicList.xml", name: "ФормаНастроекДинамическогоСписка" },
      { fixture: "report.xml", name: "ФормаОтчета" },
      { fixture: "reportOption.xml", name: "ФормаВариантаОтчета" },
      { fixture: "reportSettings.xml", name: "ФормаНастроекОтчета" },
      { fixture: "search.xml", name: "ФормаПоиска" },
      { fixture: "story.xml", name: "ФормаИсторииИзмененийИсторииДанных" },
      { fixture: "versioning.xml", name: "ФормаДанныхВерсииИсторииДанных" },
    ],
    sync: {
      name: "КонстантаВсеСвойства",
      expectedYAML: readCommonFormYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataCommonPicture",
    rule: MetadataCommonPictureRules,
    importMetaUrl: import.meta.resolve("../metadataCommonPicture/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ОбщаяКартинкаВсеСвойства" },
      { fixture: "minimal.xml", name: "ОбщаяКартинкаПоУмолчанию" },
    ],
    sync: {
      name: "ОбщаяКартинкаВсеСвойства",
      expectedYAML: readCommonPictureYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataCommonTemplate",
    rule: MetadataCommonTemplateRules,
    importMetaUrl: import.meta.resolve("../metadataCommonTemplate/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ТабличныйДокументВсеСвойства" },
      { fixture: "minimal.xml", name: "ТабличныйДокументПоУмолчанию" },
    ],
    sync: {
      name: "ТабличныйДокументВсеСвойства",
      expectedYAML: readCommonTemplateYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataFunctionalOption",
    rule: MetadataFunctionalOptionRules,
    importMetaUrl: import.meta.resolve("../metadataFunctionalOption/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ФункциональнаяОпцияВсеСвойства" },
      { fixture: "minimal.xml", name: "ФункциональнаяОпцияПоУмолчанию" },
    ],
    sync: {
      name: "ФункциональнаяОпцияВсеСвойства",
      expectedYAML: readFunctionalOptionYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataIntegrationService",
    rule: MetadataIntegrationServiceRules,
    importMetaUrl: import.meta.resolve("../metadataIntegrationService/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "СервисИнтеграцииВсеСвойства" },
      { fixture: "minimal.xml", name: "СервисИнтеграцииПоУмолчанию" },
    ],
    sync: {
      name: "СервисИнтеграцииВсеСвойства",
      expectedYAML: readIntegrationServiceYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataRole",
    rule: MetadataRoleRules,
    importMetaUrl: import.meta.resolve("../metadataRole/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "РольВсеСвойства" },
      { fixture: "minimal.xml", name: "РольПоУмолчанию" },
    ],
    sync: {
      name: "РольВсеСвойства",
      expectedYAML: readRoleYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataScheduledJob",
    rule: MetadataScheduledJobRules,
    importMetaUrl: import.meta.resolve("../metadataScheduledJob/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "РегламентноеЗаданиеВсеСвойства" },
      { fixture: "minimal.xml", name: "РегламентноеЗаданиеПоУмолчанию" },
    ],
    sync: {
      name: "РегламентноеЗаданиеВсеСвойства",
      expectedYAML: readScheduledJobYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataStyle",
    rule: MetadataStyleRules,
    importMetaUrl: import.meta.resolve("../metadataStyle/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "СтильВсеСвойства" },
      { fixture: "minimal.xml", name: "СтильПоУмолчанию" },
    ],
    sync: {
      name: "СтильВсеСвойства",
      expectedYAML: readStyleYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataSubsystem",
    rule: MetadataSubsystemRules,
    importMetaUrl: import.meta.resolve("../metadataSubsystem/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ПодсистемаВсеСвойства" },
      { fixture: "minimal.xml", name: "ПодсистемаПоУмолчанию" },
    ],
  },
  {
    group: "metadataTask",
    rule: MetadataTaskRules,
    importMetaUrl: import.meta.resolve("../metadataTask/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "ЗадачаВсеСвойства" },
      { fixture: "minimal.xml", name: "ЗадачаПоУмолчанию" },
    ],
  },
  {
    group: "metadataWebService",
    rule: MetadataWebServiceRules,
    importMetaUrl: import.meta.resolve("../metadataWebService/rules.ts"),
    modelFixtures: [
      { fixture: "full.xml", name: "WebСервисВсеСвойства" },
      { fixture: "minimal.xml", name: "WebСервисПоУмолчанию" },
    ],
    sync: {
      name: "WebСервисВсеСвойства",
      expectedYAML: readWebServiceYAML,
      externalObjectDir: true,
    },
  },
  {
    group: "metadataLanguage",
    rule: MetadataLanguageRules,
    importMetaUrl: import.meta.resolve("../metadataLanguage/rules.ts"),
    modelFixtures: [
      { fixture: "en.xml", name: "Английский" },
      { fixture: "ru.xml", name: "Русский" },
    ],
  },
]

export const appliedObjectModelCases = appliedObjectYAMLFixtures.flatMap((scenario) =>
  scenario.modelFixtures.map((fixture) => ({
    label: `${scenario.group}/${fixture.fixture}`,
    scenario,
    fixture,
  }))
)

export const appliedObjectSyncCases = appliedObjectYAMLFixtures.flatMap((scenario) =>
  scenario.sync === undefined ? [] : [{ label: scenario.group, scenario, sync: scenario.sync }]
)
