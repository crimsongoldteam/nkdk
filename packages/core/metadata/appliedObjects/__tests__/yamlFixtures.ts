import type { MetadataItemRule } from "~/metadata/orchestration"
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

export const appliedObjectYAMLFixtures: AppliedObjectYAMLFixture[] = [
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
      { fixture: "minimal.xml", name: "ПланРасчетаПоУмолчанию" },
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
