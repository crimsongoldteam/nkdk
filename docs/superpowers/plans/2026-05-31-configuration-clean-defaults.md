# Configuration Clean Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** После загрузки чистой `Configuration.xml` в YAML должны попадать только обязательные поля `Имя`, `РежимСовместимостиРасширенияКонфигурации`, `ОсновнойЯзык`, `РежимСовместимости`; пустые XML-поля не должны становиться пустыми строками в модели; `UsedMobileApplicationFunctionalities` должен хранить только отличия от канонического clean-default и использовать русские boolean-значения `Истина`/`Ложь`.

**Architecture:** Основная логика остается в декларативных `rules.ts` и существующих обработчиках типов. Для совместимости платформы добавляется системное перечисление `CompatibilityMode` с открытым режимом через явный ключ `implicitValueYAML: undefined`; для мобильной функциональности остается специализированный обработчик, но его модель YAML становится разреженной: YAML содержит только отличия, XML восстанавливает полный список.

**Tech Stack:** TypeScript, Vitest, `@sinclair/typebox`, существующий слой `packages/core/metadata/orchestration`, существующие boolean helpers `commonObjects/boolean`.

---

## Source Documents

- Спека: `docs/superpowers/specs/2026-05-31-configuration-clean-defaults-design.md`
- Источник clean XML для сверки вручную: `/home/nikita/git/round-trip/clean/Configuration.xml`
- Текущий неправильный YAML: `/home/nikita/git/new-test-yaml/Конфигурация.yaml`
- Целевой YAML: `/home/nikita/git/new-test-yaml/КонфигурацияЦель.yaml`
- Обязательное знание metadata уже прочитано перед планированием:
  - `.agents/knowledge/metadata/INDEX.md`
  - `.agents/knowledge/metadata/sources-of-truth.md`
  - `.agents/knowledge/metadata/yaml-contract.md`
  - `.agents/knowledge/metadata/round-trip-cycle.md`

## Expected Clean YAML

```yaml
Имя: Конфигурация
РежимСовместимостиРасширенияКонфигурации: Версия8_3_27
ОсновнойЯзык: Language.Русский
РежимСовместимости: Версия8_3_27
```

## Task 1: Prepare `implicitValueYAML` and Open Compatibility Mode

Цель: добавить подготовительный ключ `implicitValueYAML`, расширить `CompatibilityMode` значением `Version8_3_27`, а для правил с явным `implicitValueYAML: undefined` разрешить неизвестные будущие значения без отдельного `allowUnknownValues`.

### Tests First

- [ ] Add tests to `packages/core/metadata/systemEnumerations/toYAML.test.ts`.

```ts
import { exportSystemEnumerationToYAML } from "./toYAML";

describe("CompatibilityMode open enum YAML export", () => {
  it("exports known compatibility mode by Russian YAML value", () => {
    const result = exportSystemEnumerationToYAML(
      {} as never,
      {
        type: "SystemEnumeration",
        typeSE: "CompatibilityMode",
        implicitValueYAML: undefined,
      },
      "Version8_3_27",
    );

    expect(result).toBe("Версия8_3_27");
  });

  it("keeps unknown compatibility mode when implicitValueYAML is explicitly undefined", () => {
    const result = exportSystemEnumerationToYAML(
      {} as never,
      {
        type: "SystemEnumeration",
        typeSE: "CompatibilityMode",
        implicitValueYAML: undefined,
      },
      "Version8_3_28",
    );

    expect(result).toBe("Version8_3_28");
  });
});
```

- [ ] Add tests to `packages/core/metadata/systemEnumerations/fromYAML.test.ts`.

```ts
import { importSystemEnumerationFromYAML } from "./fromYAML";

describe("CompatibilityMode open enum YAML import", () => {
  it("imports known Russian compatibility mode to XML value", () => {
    const result = importSystemEnumerationFromYAML({
      context: {} as never,
      rule: {
        type: "SystemEnumeration",
        typeSE: "CompatibilityMode",
        implicitValueYAML: undefined,
      },
      value: "Версия8_3_27",
    });

    expect(result).toBe("Version8_3_27");
  });

  it("keeps unknown compatibility mode when implicitValueYAML is explicitly undefined", () => {
    const result = importSystemEnumerationFromYAML({
      context: {} as never,
      rule: {
        type: "SystemEnumeration",
        typeSE: "CompatibilityMode",
        implicitValueYAML: undefined,
      },
      value: "Version8_3_28",
    });

    expect(result).toBe("Version8_3_28");
  });
});
```

- [ ] Add a schema test to `packages/core/metadata/systemEnumerations/toJSONSchema.test.ts`.

```ts
import { Value } from "@sinclair/typebox/value";
import { exportSystemEnumerationToJSONSchema } from "./toJSONSchema";

describe("CompatibilityMode open enum JSON schema", () => {
  it("accepts unknown strings when implicitValueYAML is explicitly undefined", () => {
    const schema = exportSystemEnumerationToJSONSchema({
      context: {} as never,
      rule: {
        type: "SystemEnumeration",
        typeSE: "CompatibilityMode",
        implicitValueYAML: undefined,
      },
      value: undefined,
      metadataItem: undefined,
    });

    expect(Value.Check(schema, "Версия8_3_27")).toBe(true);
    expect(Value.Check(schema, "Version8_3_28")).toBe(true);
  });
});
```

### Implementation

- [ ] In `packages/core/metadata/orchestration/property/types.ts`, add the preparatory optional key to `BasePropertyRule`.

```ts
export interface BasePropertyRule {
  // existing fields
  defaultValueYAML?: any | DefaultValueFunction;
  /**
   * Value implied by an absent YAML key. Explicit `undefined` means the rule has
   * an implicit YAML value conceptually, but the value itself is not selectable
   * in YAML and should not constrain open system enumerations.
   */
  implicitValueYAML?: any | DefaultValueFunction | undefined;
}
```

- [ ] In `packages/core/metadata/systemEnumerations/types.ts`, add `Version8_3_27` to `CompatibilityMode`.

```ts
export type CompatibilityMode =
  | "Version8_1"
  | "Version8_2_13"
  | "Version8_2_16"
  | "Version8_3_1"
  | "Version8_3_2"
  | "Version8_3_3"
  | "Version8_3_4"
  | "Version8_3_5"
  | "Version8_3_6"
  | "Version8_3_7"
  | "Version8_3_8"
  | "Version8_3_9"
  | "Version8_3_10"
  | "Version8_3_11"
  | "Version8_3_12"
  | "Version8_3_13"
  | "Version8_3_14"
  | "Version8_3_15"
  | "Version8_3_16"
  | "Version8_3_17"
  | "Version8_3_18"
  | "Version8_3_19"
  | "Version8_3_20"
  | "Version8_3_21"
  | "Version8_3_22"
  | "Version8_3_23"
  | "Version8_3_24"
  | "Version8_3_25"
  | "Version8_3_26"
  | "Version8_3_27"
  | "DontUse";
```

- [ ] In the same file, add the YAML mapping.

```ts
export const CompatibilityModeToYAML = {
  // existing values
  Version8_3_27: "Версия8_3_27",
  DontUse: "НеИспользовать",
} as const;
```

- [ ] In the same file, specialize the system enumeration rule type so `implicitValueYAML` can be typed for known values while still allowing explicit `undefined`.

```ts
export type SystemEnumerationPropertyRule<T extends SystemEnumeration> = Omit<
  BasePropertyRule,
  "defaultValueYAML" | "implicitValueYAML"
> & {
  type: "SystemEnumeration";
  typeSE: T;
  defaultValueYAML?: SystemEnumerationTypeMap[T] | string;
  implicitValueYAML?: SystemEnumerationTypeMap[T] | string | undefined;
};
```

- [ ] Add a local helper near the system enumeration conversion functions. Keep it private to the system enumeration module.

```ts
const hasExplicitUndefinedImplicitValueYAML = (
  rule: SystemEnumerationPropertyRule,
) =>
  Object.prototype.hasOwnProperty.call(rule, "implicitValueYAML") &&
  rule.implicitValueYAML === undefined;
```

- [ ] In `packages/core/metadata/systemEnumerations/toYAML.ts`, keep known values mapped and preserve unknown values only for explicit `implicitValueYAML: undefined`.

```ts
export function exportSystemEnumerationToYAML<T extends SystemEnumeration>(
  _context: ConfigurationContext,
  rule: SystemEnumerationPropertyRule<T>,
  value: SystemEnumerationTypeMap[T] | string | undefined,
) {
  if (value === undefined) return undefined;

  const enumeration = systemEnumerationsToYAML[rule.typeSE] as Record<string, string>;
  const yamlValue = enumeration[value];

  if (yamlValue !== undefined) return yamlValue;
  if (hasExplicitUndefinedImplicitValueYAML(rule)) return value;

  return undefined;
}
```

- [ ] In `packages/core/metadata/systemEnumerations/fromYAML.ts`, mirror the same fallback for import.

```ts
export function importSystemEnumerationFromYAML<T extends SystemEnumeration>(
  params: {
    context: ConfigurationContext;
    rule: PropertyRule;
    value: string | undefined;
  },
) {
  const { rule, value } = params;
  const systemEnumerationRule = rule as SystemEnumerationPropertyRule<T>;
  if (value === undefined) return undefined;

  const enumeration = systemEnumerationsFromYAML[systemEnumerationRule.typeSE] as Record<string, string>;
  const xmlValue = enumeration[value];

  if (xmlValue !== undefined) return xmlValue;
  if (hasExplicitUndefinedImplicitValueYAML(systemEnumerationRule)) return value;

  return undefined;
}
```

- [ ] In `packages/core/metadata/systemEnumerations/toJSONSchema.ts`, return a string schema for explicit open enumerations.

```ts
export const exportSystemEnumerationToJSONSchema: ExportToJSONSchemaFn = (params): TSchema => {
  const rule = params.rule as SystemEnumerationPropertyRule;

  if (hasExplicitUndefinedImplicitValueYAML(rule)) {
    return Type.String();
  }

  // existing literal union behavior
};
```

- [ ] Run focused tests.

```bash
pnpm vitest run packages/core/metadata/systemEnumerations/toYAML.test.ts packages/core/metadata/systemEnumerations/fromYAML.test.ts packages/core/metadata/systemEnumerations/toJSONSchema.test.ts
```

- [ ] Commit this task.

```bash
git add packages/core/metadata/orchestration/property/types.ts packages/core/metadata/systemEnumerations
git commit -m "feat: ✨ подготовить implicit YAML для режимов"
```

## Task 2: Make Mobile Functionalities Sparse and Russian-Boolean

Цель: `UsedMobileApplicationFunctionalities` в YAML должен содержать только отличия от clean-default, а поле `Использовать` должно идти через общий boolean-контракт `Истина`/`Ложь`.

### Tests First

- [ ] Create `packages/core/metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.test.ts`.

```ts
import { describe, expect, it } from "vitest";
import {
  CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
  exportUsedMobileApplicationFunctionalitiesToXML,
  exportUsedMobileApplicationFunctionalitiesToYAML,
  importUsedMobileApplicationFunctionalitiesFromXML,
  importUsedMobileApplicationFunctionalitiesFromYAML,
} from "./usedMobileApplicationFunctionalities";

describe("UsedMobileApplicationFunctionalities clean defaults", () => {
  it("omits the clean default list from the model after XML import", () => {
    const xml = {
      "app:functionality": CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.map((item) => ({
        "app:functionality": item.functionality,
        "app:use": item.use,
      })),
    };

    expect(
      importUsedMobileApplicationFunctionalitiesFromXML({} as never, undefined, xml),
    ).toBeUndefined();
  });

  it("restores the clean default list when XML export receives undefined", () => {
    const xml = exportUsedMobileApplicationFunctionalitiesToXML(
      {} as never,
      undefined,
      undefined,
    );

    expect(xml).toEqual({
      "app:functionality": CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.map((item) => ({
        "app:functionality": item.functionality,
        "app:use": item.use,
      })),
    });
  });

  it("exports only differences from the clean default and uses Russian booleans", () => {
    const value = CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.map((item) => {
      if (item.functionality === "Biometrics") return { ...item, use: false };
      if (item.functionality === "Camera") return { ...item, use: true };
      return item;
    });

    expect(
      exportUsedMobileApplicationFunctionalitiesToYAML(
        {} as never,
        undefined,
        value,
      ),
    ).toEqual([
      { Функциональность: "Биометрия", Использовать: "Ложь" },
      { Функциональность: "Камера", Использовать: "Истина" },
    ]);
  });

  it("imports YAML differences by merging them into the clean default list", () => {
    const value = importUsedMobileApplicationFunctionalitiesFromYAML(
      {} as never,
      undefined,
      [
        { Функциональность: "Биометрия", Использовать: "Ложь" },
        { Функциональность: "Камера", Использовать: "Истина" },
      ],
    );

    expect(value?.find((item) => item.functionality === "Biometrics")?.use).toBe(false);
    expect(value?.find((item) => item.functionality === "Camera")?.use).toBe(true);
    expect(value?.find((item) => item.functionality === "OSBackup")?.use).toBe(true);
    expect(value).toHaveLength(CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.length);
  });

  it("omits YAML when the value equals the clean default list", () => {
    expect(
      exportUsedMobileApplicationFunctionalitiesToYAML(
        {} as never,
        undefined,
        CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
      ),
    ).toBeUndefined();
  });
});
```

### Implementation

- [ ] In `packages/core/metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.ts`, import common boolean helpers and schema types.

```ts
import {
  BooleanJSONSchema,
  type StringboolYAML,
} from "../../commonObjects/boolean/types";
import { importBooleanFromYAML } from "../../commonObjects/boolean/fromYAML";
import { exportBooleanToYAML } from "../../commonObjects/boolean/toYAML";
```

- [ ] Change YAML type to use `StringboolYAML`.

```ts
type UsedMobileApplicationFunctionalityYAML = {
  Функциональность: MobileApplicationFunctionalitiesYAML;
  Использовать: StringboolYAML;
};
```

- [ ] Export the canonical clean default list from the same module. Preserve XML order.

```ts
export const CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES: UsedMobileApplicationFunctionality[] =
  [
    { functionality: "Biometrics", use: true },
    { functionality: "Location", use: false },
    { functionality: "BackgroundLocation", use: false },
    { functionality: "BluetoothPrinters", use: false },
    { functionality: "WiFiPrinters", use: false },
    { functionality: "Contacts", use: false },
    { functionality: "Calendars", use: false },
    { functionality: "PushNotifications", use: false },
    { functionality: "LocalNotifications", use: false },
    { functionality: "InAppPurchases", use: false },
    { functionality: "PersonalComputerFileExchange", use: false },
    { functionality: "Ads", use: false },
    { functionality: "NumberDialing", use: false },
    { functionality: "CallProcessing", use: false },
    { functionality: "CallLog", use: false },
    { functionality: "AutoSendSMS", use: false },
    { functionality: "ReceiveSMS", use: false },
    { functionality: "SMSLog", use: false },
    { functionality: "Camera", use: false },
    { functionality: "Microphone", use: false },
    { functionality: "MusicLibrary", use: false },
    { functionality: "PictureAndVideoLibraries", use: false },
    { functionality: "AudioPlaybackAndVibration", use: false },
    { functionality: "BackgroundAudioPlaybackAndVibration", use: false },
    { functionality: "InstallPackages", use: false },
    { functionality: "OSBackup", use: true },
    { functionality: "ApplicationUsageStatistics", use: false },
    { functionality: "BarcodeScanning", use: false },
    { functionality: "BackgroundAudioRecording", use: false },
    { functionality: "AllFilesAccess", use: false },
    { functionality: "Videoconferences", use: false },
    { functionality: "NFC", use: false },
    { functionality: "DocumentScanning", use: false },
    { functionality: "SpeechToText", use: false },
    { functionality: "Geofences", use: false },
    { functionality: "IncomingShareRequests", use: false },
    { functionality: "AllIncomingShareRequestsTypesProcessing", use: false },
    { functionality: "TextToSpeech", use: false },
  ];
```

- [ ] Add helpers for comparing, cloning, diffing, and merging.

```ts
const cloneCleanUsedMobileApplicationFunctionalities = () =>
  CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.map((item) => ({ ...item }));

const sameUsedMobileApplicationFunctionalities = (
  left: UsedMobileApplicationFunctionality[] | undefined,
  right: UsedMobileApplicationFunctionality[],
) =>
  left !== undefined &&
  left.length === right.length &&
  left.every(
    (item, index) =>
      item.functionality === right[index]?.functionality &&
      item.use === right[index]?.use,
  );

const getUsedMobileApplicationFunctionalitiesDiff = (
  value: UsedMobileApplicationFunctionality[],
) =>
  value.filter((item) => {
    const defaultItem = CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.find(
      (candidate) => candidate.functionality === item.functionality,
    );

    return defaultItem === undefined || defaultItem.use !== item.use;
  });

const mergeUsedMobileApplicationFunctionalitiesDiff = (
  diff: UsedMobileApplicationFunctionality[],
) => {
  const result = cloneCleanUsedMobileApplicationFunctionalities();

  for (const item of diff) {
    const index = result.findIndex(
      (candidate) => candidate.functionality === item.functionality,
    );

    if (index === -1) {
      result.push({ ...item });
    } else {
      result[index] = { ...result[index], use: item.use };
    }
  }

  return result;
};
```

- [ ] Update XML import/export.

```ts
export const importUsedMobileApplicationFunctionalitiesFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: UsedMobileApplicationFunctionalitiesXML | "" | undefined,
) => {
  if (xml === undefined) return undefined;
  if (xml === "") return [];

  const result = normalizeArray(xml["app:functionality"]).map((item) => ({
    functionality: item["app:functionality"],
    use: item["app:use"] === true || item["app:use"] === "true",
  }));

  if (
    sameUsedMobileApplicationFunctionalities(
      result,
      CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
    )
  ) {
    return undefined;
  }

  return result;
};

export const exportUsedMobileApplicationFunctionalitiesToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: UsedMobileApplicationFunctionality[] | undefined,
) => {
  const data = value ?? CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES;

  if (data.length === 0) return "";

  return {
    "app:functionality": data.map((item) => ({
      "app:functionality": item.functionality,
      "app:use": item.use,
    })),
  };
};
```

- [ ] Update YAML import/export.

```ts
export const importUsedMobileApplicationFunctionalitiesFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: UsedMobileApplicationFunctionalityYAML[] | undefined,
) => {
  if (!value) return undefined;

  const diff = value.map((item) => ({
    functionality: MobileApplicationFunctionalitiesFromYAML[item.Функциональность],
    use: importBooleanFromYAML(item.Использовать),
  }));

  return mergeUsedMobileApplicationFunctionalitiesDiff(diff);
};

export const exportUsedMobileApplicationFunctionalitiesToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: UsedMobileApplicationFunctionality[] | undefined,
) => {
  if (
    value === undefined ||
    sameUsedMobileApplicationFunctionalities(
      value,
      CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
    )
  ) {
    return undefined;
  }

  const diff = getUsedMobileApplicationFunctionalitiesDiff(value);
  if (diff.length === 0) return undefined;

  return diff.map((item) => ({
    Функциональность: MobileApplicationFunctionalitiesToYAML[item.functionality],
    Использовать: exportBooleanToYAML(item.use),
  }));
};
```

- [ ] Update JSON schema field type.

```ts
export const UsedMobileApplicationFunctionalitiesJSONSchema = Type.Array(
  Type.Object({
    Функциональность: Type.Union(
      Object.values(MobileApplicationFunctionalitiesToYAML).map((value) =>
        Type.Literal(value),
      ),
    ),
    Использовать: BooleanJSONSchema,
  }),
);
```

- [ ] Run focused tests.

```bash
pnpm vitest run packages/core/metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.test.ts
```

- [ ] Commit this task.

```bash
git add packages/core/metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.ts packages/core/metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.test.ts
git commit -m "feat: ✨ хранить отличия мобильной функциональности"
```

## Task 3: Add Configuration Rules for Clean Defaults

Цель: правила root configuration должны импортировать clean XML в компактную модель, а YAML должен содержать только четыре обязательных поля.

### Tests First

- [ ] Create `packages/core/metadata/appliedObjects/configuration/cleanConfiguration.fixture.ts` for a self-contained test source derived from `/home/nikita/git/round-trip/clean/Configuration.xml`.

```ts
import { CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES } from "./usedMobileApplicationFunctionalities";

const mobileFunctionalitiesXML = () =>
  [
    "      <UsedMobileApplicationFunctionalities>",
    ...CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.map(
      (item) => `        <app:functionality>
          <app:functionality>${item.functionality}</app:functionality>
          <app:use>${item.use}</app:use>
        </app:functionality>`,
    ),
    "      </UsedMobileApplicationFunctionalities>",
  ].join("\n");

export const EXPECTED_CLEAN_CONFIGURATION_YAML = [
  "Имя: Конфигурация",
  "РежимСовместимостиРасширенияКонфигурации: Версия8_3_27",
  "ОсновнойЯзык: Language.Русский",
  "РежимСовместимости: Версия8_3_27",
  "",
].join("\n");

export const CLEAN_CONFIGURATION_XML = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Configuration uuid="00000000-0000-0000-0000-000000000000">
    <Properties>
      <Name>Конфигурация</Name>
      <Synonym/>
      <Comment/>
      <NamePrefix/>
      <ConfigurationExtensionCompatibilityMode>Version8_3_27</ConfigurationExtensionCompatibilityMode>
      <DefaultRunMode>ManagedApplication</DefaultRunMode>
      <UsePurposes>
        <v8:Value xsi:type="app:ApplicationUsePurpose">PlatformApplication</v8:Value>
      </UsePurposes>
      <ScriptVariant>Russian</ScriptVariant>
      <DefaultRoles/>
      <Vendor/>
      <Version/>
      <UpdateCatalogAddress/>
      <IncludeHelpInContents>false</IncludeHelpInContents>
      <UseManagedFormInOrdinaryApplication>false</UseManagedFormInOrdinaryApplication>
      <UseOrdinaryFormInManagedApplication>false</UseOrdinaryFormInManagedApplication>
      <AdditionalFullTextSearchDictionaries/>
      <CommonSettingsStorage/>
      <ReportsUserSettingsStorage/>
      <ReportsVariantsStorage/>
      <FormDataSettingsStorage/>
      <DynamicListsUserSettingsStorage/>
      <URLExternalDataStorage/>
      <Content/>
      <DefaultReportForm/>
      <DefaultReportVariantForm/>
      <DefaultReportSettingsForm/>
      <DefaultReportAppearanceTemplate/>
      <DefaultDynamicListSettingsForm/>
      <DefaultSearchForm/>
      <DefaultDataHistoryChangeHistoryForm/>
      <DefaultDataHistoryVersionDataForm/>
      <DefaultDataHistoryVersionDifferencesForm/>
      <DefaultCollaborationSystemUsersChoiceForm/>
      <RequiredMobileApplicationPermissions/>
${mobileFunctionalitiesXML()}
      <StandaloneConfigurationRestrictionRoles/>
      <MobileApplicationURLs/>
      <AllowedIncomingShareRequestTypes/>
      <MainClientApplicationWindowMode>Normal</MainClientApplicationWindowMode>
      <DefaultInterface/>
      <DefaultStyle/>
      <DefaultLanguage>Language.Русский</DefaultLanguage>
      <BriefInformation/>
      <DetailedInformation/>
      <Copyright/>
      <VendorInformationAddress/>
      <ConfigurationInformationAddress/>
      <DataLockControlMode>Managed</DataLockControlMode>
      <ObjectAutonumerationMode>NotAutoFree</ObjectAutonumerationMode>
      <ModalityUseMode>DontUse</ModalityUseMode>
      <SynchronousPlatformExtensionAndAddInCallUseMode>DontUse</SynchronousPlatformExtensionAndAddInCallUseMode>
      <InterfaceCompatibilityMode>Taxi</InterfaceCompatibilityMode>
      <DatabaseTablespacesUseMode>DontUse</DatabaseTablespacesUseMode>
      <CompatibilityMode>Version8_3_27</CompatibilityMode>
      <DefaultConstantsForm/>
    </Properties>
    <ChildObjects>
      <Language>Русский</Language>
    </ChildObjects>
  </Configuration>
</MetaDataObject>
`;
```

- [ ] Add clean YAML regression tests to `packages/core/metadata/appliedObjects/configuration/rootIO.test.ts`.

```ts
import {
  CLEAN_CONFIGURATION_XML,
  EXPECTED_CLEAN_CONFIGURATION_YAML,
} from "./cleanConfiguration.fixture";

describe("clean configuration YAML", () => {
  it("exports only required YAML fields from clean XML", () => {
    fs.writeFileSync(join(xmlDir, CONFIGURATION_XML_FILE), CLEAN_CONFIGURATION_XML);

    const configuration = readConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir: xmlDir,
    });
    expect(configuration.name).toBe("Конфигурация");
    expect(configuration.synonym).toBeUndefined();
    expect(configuration.defaultConstantsForm).toBeUndefined();
    expect(configuration.defaultSearchForm).toBeUndefined();
    expect(configuration.defaultInterface).toBeUndefined();
    expect(configuration.usedMobileApplicationFunctionalities).toBeUndefined();

    writeConfigurationToYAML({
      context: mockContextToYAML,
      configuration,
      outputDir: yamlDir,
    });

    expect(fs.readFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "utf-8")).toBe(
      EXPECTED_CLEAN_CONFIGURATION_YAML,
    );
  });

  it("restores clean defaults from sparse YAML with the clean XML reference", () => {
    fs.writeFileSync(join(xmlDir, CONFIGURATION_XML_FILE), CLEAN_CONFIGURATION_XML);
    fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), EXPECTED_CLEAN_CONFIGURATION_YAML);

    const referenceConfiguration = readConfigurationFromXML({
      context: mockContextFromXML({ forReference: true }),
      inputDir: xmlDir,
    });
    const configuration = readConfigurationFromYAML({
      context: mockContextToYAML,
      inputDir: yamlDir,
      source: referenceConfiguration,
    });

    expect(configuration.configurationExtensionCompatibilityMode).toBe("Version8_3_27");
    expect(configuration.defaultLanguage).toBe("Language.Русский");
    expect(configuration.compatibilityMode).toBe("Version8_3_27");
    expect(configuration.usedMobileApplicationFunctionalities).toBeUndefined();

    writeConfigurationToXML({
      context: mockContextToXML(),
      configuration,
      referenceConfiguration,
      outputDir: outXmlDir,
    });

    const xml = fs.readFileSync(join(outXmlDir, CONFIGURATION_XML_FILE), "utf-8");
    expect(xml).toContain("<CompatibilityMode>Version8_3_27</CompatibilityMode>");
    expect(xml).toContain(
      "<ConfigurationExtensionCompatibilityMode>Version8_3_27</ConfigurationExtensionCompatibilityMode>",
    );
    expect(xml).toContain("<DefaultConstantsForm/>");
    expect(xml).toContain("<app:functionality>Biometrics</app:functionality>");
    expect(xml).toContain("<app:use>true</app:use>");
    expect(xml).toContain("<app:functionality>OSBackup</app:functionality>");
    expect(xml).toContain("<app:use>true</app:use>");
  });
});
```

### Implementation

- [ ] In `packages/core/metadata/appliedObjects/configuration/rules.ts`, edit the existing property entries in place. Use actual rule keys and `yaml`, not array-style `name`/`alias`.

```ts
configurationExtensionCompatibilityMode: {
  yaml: "РежимСовместимостиРасширенияКонфигурации",
  type: "SystemEnumeration",
  typeSE: "CompatibilityMode",
  required: true,
  defaultValueXML: "Version8_3_27",
  preserveExplicitDefaultXML: true,
  implicitValueYAML: undefined,
  xmlParents: configurationProperties,
},
defaultLanguage: {
  yaml: "ОсновнойЯзык",
  type: "MetadataItemLink",
  required: true,
  defaultValueXML: "Language.Русский",
  preserveExplicitDefaultXML: true,
  xmlParents: configurationProperties,
},
compatibilityMode: {
  yaml: "РежимСовместимости",
  type: "SystemEnumeration",
  typeSE: "CompatibilityMode",
  required: true,
  defaultValueXML: "Version8_3_27",
  preserveExplicitDefaultXML: true,
  implicitValueYAML: undefined,
  xmlParents: configurationProperties,
},
```

- [ ] Add XML defaults for explicit clean values. Keep the existing `UsePurposes` special type unchanged.

```ts
defaultRunMode: {
  yaml: "ОсновнойРежимЗапуска",
  type: "SystemEnumeration",
  typeSE: "ClientRunMode",
  defaultValueXML: "ManagedApplication",
  xmlParents: configurationProperties,
},
scriptVariant: {
  yaml: "ВариантВстроенногоЯзыка",
  type: "SystemEnumeration",
  typeSE: "ScriptVariant",
  defaultValueXML: "Russian",
  xmlParents: configurationProperties,
},
mainClientApplicationWindowMode: {
  yaml: "РежимОсновногоОкнаКлиентскогоПриложения",
  type: "SystemEnumeration",
  typeSE: "MainClientApplicationWindowMode",
  defaultValueXML: "Normal",
  xmlParents: configurationProperties,
},
dataLockControlMode: {
  yaml: "РежимУправленияБлокировкойДанных",
  type: "SystemEnumeration",
  typeSE: "DataLockControlMode",
  defaultValueXML: "Managed",
  xmlParents: configurationProperties,
},
objectAutonumerationMode: {
  yaml: "РежимАвтонумерацииОбъектов",
  type: "SystemEnumeration",
  typeSE: "ObjectAutonumerationMode",
  defaultValueXML: "NotAutoFree",
  xmlParents: configurationProperties,
},
modalityUseMode: {
  yaml: "РежимИспользованияМодальности",
  type: "SystemEnumeration",
  typeSE: "ModalityUseMode",
  defaultValueXML: "DontUse",
  xmlParents: configurationProperties,
},
synchronousPlatformExtensionAndAddInCallUseMode: {
  yaml: "РежимИспользованияСинхронныхВызововРасширенийПлатформыИВнешнихКомпонент",
  type: "SystemEnumeration",
  typeSE: "SynchronousExtensionAndAddInCallUseMode",
  defaultValueXML: "DontUse",
  xmlParents: configurationProperties,
},
interfaceCompatibilityMode: {
  yaml: "РежимСовместимостиИнтерфейса",
  type: "SystemEnumeration",
  typeSE: "InterfaceCompatibilityMode",
  defaultValueXML: "Taxi",
  xmlParents: configurationProperties,
},
databaseTablespacesUseMode: {
  yaml: "РежимИспользованияТабличныхПространствБазыДанных",
  type: "SystemEnumeration",
  typeSE: "DatabaseTablespacesUseMode",
  defaultValueXML: "DontUse",
  xmlParents: configurationProperties,
},
includeHelpInContents: {
  yaml: "ВключатьСправкуВСодержание",
  type: "boolean",
  defaultValueXML: false,
  xmlParents: configurationProperties,
},
useManagedFormInOrdinaryApplication: {
  yaml: "ИспользоватьУправляемыеФормыВОбычномПриложении",
  type: "boolean",
  defaultValueXML: false,
  xmlParents: configurationProperties,
},
useOrdinaryFormInManagedApplication: {
  yaml: "ИспользоватьОбычныеФормыВУправляемомПриложении",
  type: "boolean",
  defaultValueXML: false,
  xmlParents: configurationProperties,
},
```

- [ ] Replace existing empty materialization with `defaultValueXMLRaw: ""`. Remove `defaultValueXMLEmpty` from these entries.

```ts
namePrefix: {
  yaml: "ПрефиксИмен",
  type: "string",
  defaultValueXMLRaw: "",
  xmlParents: configurationProperties,
},
defaultSearchForm: {
  yaml: "ОсновнаяФормаПоиска",
  type: "string",
  defaultValueXMLRaw: "",
  xmlParents: configurationProperties,
},
defaultInterface: {
  yaml: "ОсновнойИнтерфейс",
  type: "string",
  defaultValueXMLRaw: "",
  xmlParents: configurationProperties,
},
defaultConstantsForm: {
  yaml: "ОсновнаяФормаКонстант",
  type: "string",
  defaultValueXMLRaw: "",
  xmlParents: configurationProperties,
},
additionalFullTextSearchDictionaries: {
  yaml: "ДополнительныеСловариПолнотекстовогоПоиска",
  type: "MetadataItemLinks",
  defaultValueXMLRaw: "",
  xmlParents: configurationProperties,
},
standaloneConfigurationRestrictionRoles: {
  yaml: "РолиОграниченияАвтономнойКонфигурации",
  type: "MetadataItemLinks",
  defaultValueXMLRaw: "",
  xmlParents: configurationProperties,
},
```

- [ ] Add `defaultValueXMLRaw: ""` to the other clean-empty fields already present in the rule.

```ts
synonym: { yaml: "Синоним", type: "I8nText", defaultValueXMLRaw: "", xmlParents: configurationProperties },
comment: { yaml: "Комментарий", type: "string", defaultValueXMLRaw: "", xmlParents: configurationProperties },
defaultRoles: { yaml: "ОсновныеРоли", type: "MetadataItemLinks", defaultValueXMLRaw: "", xmlParents: configurationProperties },
vendor: { yaml: "Поставщик", type: "string", defaultValueXMLRaw: "", xmlParents: configurationProperties },
version: { yaml: "Версия", type: "string", defaultValueXMLRaw: "", xmlParents: configurationProperties },
updateCatalogAddress: { yaml: "АдресКаталогаОбновлений", type: "string", defaultValueXMLRaw: "", xmlParents: configurationProperties },
commonSettingsStorage: { yaml: "ХранилищеОбщихНастроек", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
reportsUserSettingsStorage: { yaml: "ХранилищеПользовательскихНастроекОтчетов", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
reportsVariantsStorage: { yaml: "ХранилищеВариантовОтчетов", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
formDataSettingsStorage: { yaml: "ХранилищеНастроекДанныхФорм", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
dynamicListsUserSettingsStorage: { yaml: "ХранилищеПользовательскихНастроекДинамическихСписков", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
urlExternalDataStorage: { yaml: "ХранилищеВнешнихДанныхНавигационныхСсылок", xml: "URLExternalDataStorage", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
defaultReportForm: { yaml: "ОсновнаяФормаОтчета", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
defaultReportVariantForm: { yaml: "ОсновнаяФормаВариантаОтчета", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
defaultReportSettingsForm: { yaml: "ОсновнаяФормаНастроекОтчета", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
defaultReportAppearanceTemplate: { yaml: "ОсновнойМакетОформленияОтчета", type: "string", defaultValueXMLRaw: "", xmlParents: configurationProperties },
defaultDynamicListSettingsForm: { yaml: "ОсновнаяФормаНастроекДинамическогоСписка", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
defaultDataHistoryChangeHistoryForm: { yaml: "ОсновнаяФормаИсторииИзмененийИсторииДанных", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
defaultDataHistoryVersionDataForm: { yaml: "ОсновнаяФормаДанныхВерсииИсторииДанных", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
defaultDataHistoryVersionDifferencesForm: { yaml: "ОсновнаяФормаРазличийВерсийИсторииДанных", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
defaultCollaborationSystemUsersChoiceForm: { yaml: "ОсновнаяФормаВыбораПользователейСистемыВзаимодействия", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
defaultStyle: { yaml: "ОсновнойСтиль", type: "MetadataItemLink", defaultValueXMLRaw: "", xmlParents: configurationProperties },
briefInformation: { yaml: "КраткаяИнформация", type: "I8nText", defaultValueXMLRaw: "", xmlParents: configurationProperties },
detailedInformation: { yaml: "ПодробнаяИнформация", type: "I8nText", defaultValueXMLRaw: "", xmlParents: configurationProperties },
copyright: { yaml: "АвторскиеПрава", type: "I8nText", defaultValueXMLRaw: "", xmlParents: configurationProperties },
vendorInformationAddress: { yaml: "АдресИнформацииОПоставщике", type: "I8nText", defaultValueXMLRaw: "", xmlParents: configurationProperties },
configurationInformationAddress: { yaml: "АдресИнформацииОКонфигурации", type: "I8nText", defaultValueXMLRaw: "", xmlParents: configurationProperties },
```

- [ ] Add deterministic XML-only rules for empty clean tags that currently have no rule. These rules must not participate in YAML.

```ts
content: {
  xml: "Content",
  type: "string",
  defaultValueXMLRaw: "",
  toYAML: false,
  fromYAML: false,
  xmlParents: configurationProperties,
},
requiredMobileApplicationPermissions: {
  xml: "RequiredMobileApplicationPermissions",
  type: "string",
  defaultValueXMLRaw: "",
  toYAML: false,
  fromYAML: false,
  xmlParents: configurationProperties,
},
mobileApplicationURLs: {
  xml: "MobileApplicationURLs",
  type: "string",
  defaultValueXMLRaw: "",
  toYAML: false,
  fromYAML: false,
  xmlParents: configurationProperties,
},
allowedIncomingShareRequestTypes: {
  xml: "AllowedIncomingShareRequestTypes",
  type: "string",
  defaultValueXMLRaw: "",
  toYAML: false,
  fromYAML: false,
  xmlParents: configurationProperties,
},
```

- [ ] Run focused configuration tests.

```bash
pnpm vitest run packages/core/metadata/appliedObjects/configuration/rootIO.test.ts packages/core/metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.test.ts
```

- [ ] Commit this task.

```bash
git add packages/core/metadata/appliedObjects/configuration packages/core/metadata/systemEnumerations packages/core/metadata/orchestration/property/types.ts
git commit -m "feat: ✨ добавить default XML чистой конфигурации"
```

## Task 4: Verify Full Metadata Contract

Цель: убедиться, что изменения не ломают остальные appliedObjects и общий round-trip.

- [ ] Run full tests from repository root.

```bash
pnpm test
```

- [ ] When sandbox blocks process spawning with `spawnSync node EPERM`, rerun the same command with escalated permissions. Do not change code to work around sandbox-only failures.

- [ ] Re-run the clean configuration test to inspect the generated YAML regression in isolation.

```bash
pnpm vitest run packages/core/metadata/appliedObjects/configuration/rootIO.test.ts
```

- [ ] Review diff.

```bash
git diff --stat
git diff -- packages/core/metadata/appliedObjects/configuration packages/core/metadata/systemEnumerations packages/core/metadata/orchestration/property/types.ts
```

- [ ] Check for uncommitted late fixes and commit them with the same Task 3 message when present.

```bash
git status --short
```

## Risk Checks

- `defaultValueXMLRaw: ""` must restore empty XML tags without putting `""` into the model.
- Required fields must stay visible in YAML even when equal to XML defaults. Use `preserveExplicitDefaultXML: true` where `defaultValueXML` exists on required fields.
- `implicitValueYAML: undefined` must be detected with `hasOwnProperty`, because absence of the key and explicit `undefined` have different meanings for future checks.
- `CompatibilityMode` YAML must be Russian for known values, especially `Version8_3_27 -> Версия8_3_27`.
- `UsedMobileApplicationFunctionalities` YAML must use `Истина`/`Ложь`, not native `true`/`false`.
- Existing XML fixtures must not be edited.

## Completion Criteria

- Clean XML imports to a model where empty text/link/list defaults are `undefined`.
- Clean XML exports to YAML with exactly four fields:
  - `Имя`
  - `РежимСовместимостиРасширенияКонфигурации`
  - `ОсновнойЯзык`
  - `РежимСовместимости`
- YAML values for `CompatibilityMode` are Russian where known.
- `UsedMobileApplicationFunctionalities` is absent from clean YAML and restores the clean XML list on XML export.
- Focused tests pass.
- `pnpm test` passes from `/home/nikita/git/nkdk/.worktrees/configuration-clean-defaults`.
