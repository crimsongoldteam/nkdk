import type { MetadataItemRule } from "~/metadata/orchestration"
import { MetadataAccountingRegisterRules } from "../metadataAccountingRegister/rules"
import { readAccountingRegisterYAML } from "../metadataAccountingRegister/__fixtures__/sync/data"
import { MetadataAccumulationRegisterRules } from "../metadataAccumulationRegister/rules"
import { readAccumulationRegisterYAML } from "../metadataAccumulationRegister/__fixtures__/sync/data"
import { MetadataCalculationRegisterRules } from "../metadataCalculationRegister/rules"
import { readCalculationRegisterYAML } from "../metadataCalculationRegister/__fixtures__/sync/data"
import { MetadataChartOfAccountsRules } from "../metadataChartOfAccounts/rules"
import { readChartOfAccountsYAML } from "../metadataChartOfAccounts/__fixtures__/sync/data"
import { MetadataChartOfCalculationTypesRules } from "../metadataChartOfCalculationTypes/rules"
import { readChartOfCalculationTypesYAML } from "../metadataChartOfCalculationTypes/__fixtures__/sync/data"
import { MetadataChartOfCharacteristicTypesRules } from "../metadataChartOfCharacteristicTypes/rules"
import { readChartOfCharacteristicTypesYAML } from "../metadataChartOfCharacteristicTypes/__fixtures__/sync/data"
import { MetadataInformationRegisterRules } from "../metadataInformationRegister/rules"
import { readInformationRegisterYAML } from "../metadataInformationRegister/__fixtures__/sync/data"

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

export const appliedObjectYAMLFixtures = [
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
] as const satisfies AppliedObjectYAMLFixture[]

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
