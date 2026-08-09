# План устранения нарушений границ metadata-слоёв

**Plan date:** 2026-08-09

> **Для исполнителя:** выполнять план последовательно через `superpowers:executing-plans`, без субагентов. После каждого задания отмечать выполненные пункты и проходить указанную проверку.

**Goal:** Устранить оставшиеся 34 прямых и 118 транзитивных нарушения границ metadata-слоёв, довести оба счётчика до нуля и удалить baseline границ.

**Architecture:** Исправления выполняются от общих причин к отдельным связям. Сначала конкретные расширения выводятся из `context/types.ts`, затем типы свойств и формы подключаются через расширяемые карты и реестры, validation получает только компактные снимки и проекции, а регистрация переносится на внешнюю границу. После каждого блока dependency-cruiser сокращает baseline только на исчезнувшие записи; новые записи и рост циклов запрещены.

**Tech Stack:** TypeScript 7, Node.js 26, Vitest 4, dependency-cruiser 18, pnpm 10.

**Implementation result:** прямые и транзитивные нарушения устранены (`0 / 0`), baseline границ удалён. Большая циклическая компонента разделена: в циклах осталось 158 модулей и 370 внутренних зависимостей вместо 1079 и 5622.

## Global Constraints

- Исходная точка плана: commit `97037f1817915d774a6e445220e710e9efd88bc0`.
- Не изменять существующие XML-фикстуры.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры построителей правил.
- Не добавлять новые `not-in-allowed` и `neutral-not-reach-implementations` в baseline.
- Не принимать новый или выросший цикл; верхняя граница на старте плана: 4 компоненты, 1079 модулей, 5628 внутренних зависимостей.
- Сохранять публичное поведение XML/YAML/JSON Schema и строгий вывод TypeScript-типов по `rules.ts`.
- Приведения типов держать только в именованных адаптерах на границе и покрывать тестом.
- После каждого задания выполнять `pnpm duplicates -- --base 97037f181`.
- После каждого задания переснимать baseline командой `pnpm architecture:baseline` только после зелёной `pnpm test:architecture`.
- После каждого перемещения путей выполнять `pnpm architecture:cycle-baseline -- --accept-rewrite`; команда обязана отклонить рост показателей.
- Следующее задание начинать только после отдельного коммита предыдущего.

## Current Inventory And Coverage

| Задание | Прямая причина | Текущие прямые нарушения |
|---|---|---:|
| 1 | Конкретные расширения общего `ConfigurationContext` | 0 прямых, основной путь для 40+ транзитивных |
| 2 | `systemEnumerations` и `userVisible` внутри нейтрального вывода типов | 5 |
| 3 | Конкретные TypeDescription, tabular-section rules и стандартные имена в validation | 8 |
| 4 | Обратные реэкспорты `orchestration/formElement -> forms/elements/orchestration` | 7 |
| 5 | Конкретная `ClientApplicationForm` внутри validation | 9 |
| 6 | Вызовы `metadata/register.ts` из project и validation | 4 |
| 7 | `metadataItemAugmenter` внутри `importFromXml` | 1 |
| **Всего** |  | **34** |

Транзитивные 118 записей не исправляются по одной. Они исчезают каскадно после разрыва путей через `context/types.ts`, `property/types.ts`, form contracts, `register.ts` и `metadataItemAugmenter.ts`.

---

### Task 1: Расширяемый нейтральный ConfigurationContext

**Files:**
- Modify: `packages/core/metadata/context/types.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/context.types.ts`
- Modify: `packages/core/metadata/validation/dataPath/formIndex.ts`
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`
- Modify: `packages/core/metadata/validation/dataPath/formatter.ts`
- Modify: `packages/core/metadata/validation/dataPath/coreResolver.ts`
- Create: `tools/dependency-cruiser/test/context-boundary.test.mjs`

**Interfaces:**
- Produces: базовые `ConfigurationContext`, `FormExportToYAMLContext` и `FormimportFromYAMLContext`, не импортирующие `forms` и `validation`.
- Produces: module augmentation формы для `allElements`, `enterprise`, `formAttributes` и form-specific YAML trees.
- Produces: module augmentation validation для `FormDataPathIndex`, `OwnerMetadataCache`, `DataPathFormatDiagnosticSink` и resolver-функций.

- [x] **Step 1: Добавить падающий тест нейтральности контекста**

```js
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("configuration context does not own form or validation implementations", () => {
  const source = readFileSync("packages/core/metadata/context/types.ts", "utf8")
  assert.doesNotMatch(source, /from "\.\.\/(?:forms|validation)\//u)
})
```

- [x] **Step 2: Запустить тест и подтвердить исходное падение**

Run: `node --test tools/dependency-cruiser/test/context-boundary.test.mjs`

Expected: FAIL на импортах `forms/clientApplicationForm/types`, `forms/commonObjects/*` и `validation/dataPath/*`.

- [x] **Step 3: Оставить в `context/types.ts` только базовый договор**

Базовые интерфейсы сохраняют общие поля и точки расширения, но не называют конкретную форму или validation-реализацию:

```ts
export interface ConfigurationContext {
  testMode?: boolean
  defaultLanguage: string
  version: string
  context?: object
  exportToYAML?: FormExportToYAMLContext
  importFromYAML?: FormimportFromYAMLContext
  exportToXML?: ToXMLConfigurationContext
  exportToJSONSchema?: JSONSchemaExportContext
}

export interface FormExportToYAMLContext {
  toTyped: boolean
  projectDir?: string
  parent?: { name: string }
  externalFilesCollector?: ExternalFileEntry[]
  metadataTargetOwners?: MetadataTargetOwnerContext[]
}

export interface FormimportFromYAMLContext {
  projectDir?: string
  formDir?: string
  parent?: { name: string }
  metadataTargetOwners?: MetadataTargetOwnerContext[]
  diagnostics?: YAMLImportDiagnosticContext
  referenceRemap?: {
    readonly currentPath: string
    readonly referencePathByCurrentPath: ReadonlyMap<string, string>
  }
}
```

- [x] **Step 4: Подключить поля формы через declaration merging**

`forms/clientApplicationForm/context.types.ts` импортирует конкретные типы и расширяет базовые интерфейсы в обратном направлении:

```ts
declare module "../../context/types" {
  interface ConfigurationContext {
    allElements?: FormElementsYAML
    enterprise?: EnterpriseContext
  }

  interface FormExportToYAMLContext {
    formAttributes?: readonly FormAttribute[]
  }

  interface FormimportFromYAMLContext {
    allElements?: FormChildItemsPartialYAML
    formAttributes?: readonly FormAttribute[]
  }
}
```

В этом же файле дополнить `EnterpriseContext` и определить рекурсивную проекцию enterprise-атрибута рядом с формой. Файл входит в TypeScript project через `tsconfig`; отдельный runtime-import не добавляется, чтобы не расширять существующую циклическую компоненту.

- [x] **Step 5: Подключить validation-поля через отдельное расширение**

Расширения размещаются рядом с владельцами конкретных типов: `formIndex.ts` объявляет `formDataPathIndex`, `ownerCache.ts` — `ownerMetadataCache`, `formatter.ts` — `dataPathDiagnosticSink`, `coreResolver.ts` — `resolveDataPath`. Отдельный общий validation-файл не создаётся: его импорты образуют новый путь к конкретной форме через `formIndex.ts`. `context/types.ts` больше не импортирует validation.

- [x] **Step 6: Проверить типы и поведение контекста**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core test -- metadata/context/helpers.test.ts metadata/commonObjects/metadataPath/fromYAML.test.ts metadata/commonObjects/metadataPath/toYAML.test.ts`

Expected: PASS; существующие объекты `ConfigurationContext` продолжают структурно принимать form/validation-поля.

- [x] **Step 7: Проверить архитектуру и сократить baseline**

Run: `pnpm test:architecture`

Expected: PASS без новых нарушений; ни один текущий reachability path не должен проходить из `context/types.ts` прямо в `forms` или `validation`.

Run: `pnpm architecture:baseline`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 97037f181`

- [x] **Step 8: Зафиксировать изменение**

```bash
git add packages/core/metadata/context packages/core/metadata/forms/clientApplicationForm/context.types.ts packages/core/metadata/validation/dataPath tools/dependency-cruiser/test/context-boundary.test.mjs .dependency-cruiser-known-violations.json docs/superpowers/plans/2026-08-09-dependency-boundaries-remediation.md
git commit -m "refactor: :recycle: отделить расширения metadata-контекста"
```

### Task 2: Нейтральный каталог property-типов

**Files:**
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Create: `packages/core/metadata/orchestration/property/systemEnumerationRegistry.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/element.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/yaml.ts`
- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts`
- Create: `packages/core/metadata/systemEnumerations/registry.types.ts`
- Create: `packages/core/metadata/commonObjects/userVisible/registry.types.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/registry.types.ts`
- Create: `packages/core/metadata/commonObjects/formattedI8nText/registry.types.ts`
- Create: `packages/core/metadata/systemEnumerations/registry.types.test.ts`
- Create: `packages/core/metadata/commonObjects/userVisible/registry.types.test.ts`
- Modify: `packages/core/metadata/systemEnumerations/index.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Create: `packages/core/metadata/orchestration/property/systemEnumerationRegistry.test.ts`
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/types.test.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`

**Interfaces:**
- Produces: расширяемые `PropertyMetadataTypeMap`, `PropertyYAMLTypeMap`, `SystemEnumerationTypeMap`.
- Produces: `registerSystemEnumeration(name, { fromYAML, toYAML })` и `getSystemEnumeration(name)`.
- Removes direct dependencies from `metadataItem/element.ts`, `metadataItem/yaml.ts`, `property/toJSONSchema.ts` and `validation/yamlFactExtractor.ts` to `systemEnumerations`/`userVisible`.

- [x] **Step 1: Добавить падающие проверки строгого вывода типов**

```ts
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false
type Assert<T extends true> = T

type _SystemEnumerationYAML = Assert<Equal<
  YAMLTypeByRule<typeof ruleWithPictureLib>["БиблиотекаКартинок"],
  keyof typeof PictureLibFromYAML | undefined
>>
type _UserVisibleYAML = Assert<Equal<
  YAMLTypeByRule<typeof ruleWithUserVisible>["Доступность"],
  UserVisibleYAML | undefined
>>
```

Добавить эти compile-time проверки в `registry.types.test.ts` рядом с конкретными владельцами типов.

- [x] **Step 2: Запустить TypeScript и подтвердить, что новая карта отсутствует**

Run: `pnpm --filter @nkdk/core type-check`

Expected: FAIL на отсутствующих `PropertyMetadataTypeMap`, `PropertyYAMLTypeMap` и `SystemEnumerationTypeMap`.

- [x] **Step 3: Добавить расширяемые карты поверх существующего запасного типа**

```ts
export interface PropertyMetadataTypeMap {}
export interface PropertyYAMLTypeMap {}
export interface PropertyEnterpriseTypeMap {}

export type PropertyToMetadata<Key extends PropertyRuleType> =
  Key extends keyof PropertyMetadataTypeMap ? PropertyMetadataTypeMap[Key] : Key & any
export type PropertyToYAML<Key extends PropertyRuleType> =
  Key extends keyof PropertyYAMLTypeMap ? PropertyYAMLTypeMap[Key] : Key & any
export type PropertyToEnterprise<Key extends PropertyRuleType> =
  Key extends keyof PropertyEnterpriseTypeMap ? PropertyEnterpriseTypeMap[Key] : Key & any
```

Concrete property modules дополняют карты через declaration merging. `userVisible/registry.types.ts` владеет записью `UserVisible`, не `metadataItem/yaml.ts`. Запасной `Key & any` временно сохраняется только для ещё не перенесённых property-типов: немедленная замена на `unknown` потребовала бы описать все существующие типы и выходит за границы пяти исправляемых связей.

- [x] **Step 4: Добавить типизированный каталог системных перечислений**

`systemEnumerations/registry.types.ts` формирует `RegisteredSystemEnumerationTypeMap` из пар экспортов `*FromYAML`/`*ToYAML` и дополняет нейтральный `SystemEnumerationTypeMap`. Тест сравнивает множество имён зарегистрированных таблиц с множеством `typeSE`, найденных в rules.ts; пропущенное имя должно падать с его названием.

- [x] **Step 5: Добавить runtime-регистрацию и убрать прямые таблицы из orchestration**

```ts
export interface RegisteredSystemEnumeration {
  readonly fromYAML: Readonly<Record<string, string>>
  readonly toYAML: Readonly<Record<string, string>>
}

export function registerSystemEnumeration(
  name: string,
  value: RegisteredSystemEnumeration
): void

export function getSystemEnumeration(
  name: string
): RegisteredSystemEnumeration | undefined
```

Существующий composition-файл `systemEnumerations/index.ts` регистрирует пары: отдельный concrete `registry.ts` не подключается, потому что добавляет новый модуль в существующую циклическую компоненту. `property/toJSONSchema.ts` преобразует implicit value через `getSystemEnumeration(typeSE)?.toYAML`, а не через `import * as SE`. `yamlFactExtractor.ts` использует зарегистрированную таблицу `PictureLib`, не импортирует concrete-типы.

- [x] **Step 6: Проверить вывод типов и JSON Schema**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts metadata/systemEnumerations/registry.types.test.ts metadata/commonObjects/userVisible/registry.types.test.ts --no-isolate`

Expected: PASS; literal system-enumeration defaults по-прежнему исключаются из JSON Schema, а типы rules.ts не расширяются до `string` или `unknown`.

- [x] **Step 7: Проверить исчезновение пяти прямых нарушений**

Run: `pnpm test:architecture`

Expected: в новых нарушениях отсутствуют источники `metadataItem/element.ts`, `metadataItem/yaml.ts`, `property/toJSONSchema.ts` и system-enumeration edge из `validation/yamlFactExtractor.ts`.

Run: `pnpm architecture:baseline`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 97037f181`

- [x] **Step 8: Зафиксировать изменение**

```bash
git add packages/core/metadata/orchestration/property packages/core/metadata/orchestration/metadataItem packages/core/metadata/systemEnumerations packages/core/metadata/commonObjects/userVisible packages/core/metadata/commonObjects/i8nText packages/core/metadata/commonObjects/formattedI8nText packages/core/metadata/validation/yamlFactExtractor.ts packages/core/metadata/importBoundaries.test.ts .dependency-cruiser-known-violations.json docs/superpowers/plans/2026-08-09-dependency-boundaries-remediation.md
git commit -m "refactor: :recycle: расширить каталог property-типов"
```

### Task 3: Проекции TypeDescription и owner facts в validation snapshot

**Files:**
- Create: `packages/core/metadata/orchestration/property/typeDescriptionView.ts`
- Modify: `packages/core/metadata/orchestration/metadataTarget/standardMemberAliases.ts`
- Modify: `packages/core/metadata/validation/dataPath/typeDescription.ts`
- Modify: `packages/core/metadata/validation/dataPath/formYamlIndex.ts`
- Modify: `packages/core/metadata/validation/dataPath/ownerFacts.ts`
- Modify: `packages/core/metadata/validation/dataPath/objectFields.ts`
- Modify: `packages/core/metadata/validation/rulesSnapshot.ts`
- Create: `packages/core/metadata/validation/rulesSnapshot.ownerFacts.test.ts`

**Interfaces:**
- Produces: `TypeDescriptionView = { type?: readonly string[]; typeId?: readonly string[] }`.
- Extends: `ValidationRulesPropertySnapshot` with nested field declarations and compiled standard-member aliases already available from rules.
- Removes: direct imports of `typeDescription/types`, `MetadataTabularSectionRules`, `StandartAttributeNameToYAML` and `CommonAttributeUseFromYAML` from validation.

- [x] **Step 1: Добавить тест snapshot для табличной части и псевдонимов**

```ts
it("compiles tabular-section fields and standard aliases into the rules snapshot", () => {
  const spec = findValidationRulesSpec(createValidationRulesSnapshot(context), "Catalogs")!
  const sections = spec.properties.find((property) => property.ownerFactRole === "tabularSections")!
  expect(sections.children?.map((property) => property.modelKey)).toContain("attributes")
  expect(spec.standardMemberAliases).toMatchObject({ Код: "Code", Наименование: "Description" })
})
```

- [x] **Step 2: Запустить тест и подтвердить отсутствие данных в snapshot**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/validation/rulesSnapshot.ownerFacts.test.ts --no-isolate`

Expected: FAIL на отсутствующем `standardMemberAliases` или неполных `children`.

- [x] **Step 3: Ввести минимальную проекцию описания типа**

```ts
export interface TypeDescriptionView {
  readonly type?: readonly string[]
  readonly typeId?: readonly string[]
}
```

`typeDescriptionToDataPathTypeInfo`, owner facts и object-field builders принимают эту проекцию. YAML преобразуется через зарегистрированный `TypeDescription` property-handler; validation не импортирует helper или конкретный тип.

- [x] **Step 4: Компилировать owner facts в rules snapshot**

`createValidationRulesSnapshot` должен сохранить для каждого `ownerFactRole`:

```ts
export interface ValidationRulesPropertySnapshot {
  modelKey: string
  yamlPath: readonly string[]
  type?: string
  metadataTarget?: MetadataTargetConstraint
  ownerFactRole?: OwnerFactRole
  children?: readonly ValidationRulesPropertySnapshot[]
}

export interface ValidationRulesSpecSnapshot {
  dir: string
  kind: ValidationProjectSpec["kind"]
  itemType: string
  root?: MetadataRootName
  metadataTargetOwner?: MetadataTargetOwnerDeclaration
  nesting?: ValidationRulesNestingSnapshot
  uniqueNameScopes: readonly ValidationRulesUniqueNameScopeSnapshot[]
  properties: readonly ValidationRulesPropertySnapshot[]
  standardMemberAliases: Readonly<Record<string, string>>
}
```

Псевдонимы берутся из нейтрального `metadataTarget/standardMemberAliases`, а вложенные правила — через `resolvePropertyItemRule`. `objectFields.ts` использует эти нейтральные каталоги и owner facts, не импортируя конкретные rules.ts.

- [x] **Step 5: Перевести CommonAttributeUse на property-handler**

`ownerFacts.ts` разбирает значение `CommonAttributeUse` через каталог системных перечислений из Task 2. Никаких таблиц `systemEnumerations/types.ts` в validation не остаётся.

- [x] **Step 6: Проверить восемь целевых файлов**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/validation/dataPath metadata/validation/rulesSnapshot.ownerFacts.test.ts metadata/validation/projectValidationPasses.test.ts --no-isolate`

Run: `pnpm test:architecture`

Expected: прямые нарушения отсутствуют для `formYamlIndex.ts`, `objectFields.ts`, `ownerFacts.ts`, `typeDescription.ts`; поведение DataPath и owner facts сохранено.

Run: `pnpm architecture:baseline`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 97037f181`

- [x] **Step 7: Зафиксировать изменение**

```bash
git add packages/core/metadata/orchestration/property/typeDescriptionView.ts packages/core/metadata/validation .dependency-cruiser-known-violations.json
git commit -m "refactor: :recycle: компилировать owner facts в validation snapshot"
```

### Task 4: Общий механизм formElement в orchestration

**Files:**
- Modify: `packages/core/metadata/orchestration/formElement/fn.ts`
- Modify: `packages/core/metadata/orchestration/formElement/helper.ts`
- Modify: `packages/core/metadata/orchestration/formElement/ruleFactory.ts`
- Modify: `packages/core/metadata/orchestration/formElement/singletonName.ts`
- Modify: `packages/core/metadata/orchestration/formElement/toEnterprise.ts`
- Modify: `packages/core/metadata/orchestration/formElement/toJSONSchema.ts`
- Modify: `packages/core/metadata/orchestration/formElement/types.ts`
- Create: `packages/core/metadata/orchestration/formElement/fromXMLToYAML.ts`
- Create: `packages/core/metadata/orchestration/formElement/fromYAMLToXML.ts`
- Create: `packages/core/metadata/orchestration/formElement/registry.ts`
- Modify: `packages/core/metadata/forms/elements/orchestration/*.ts`
- Modify: `packages/core/metadata/forms/elements/index.ts`
- Move tests: `packages/core/metadata/forms/elements/orchestration/*.test.ts` to `packages/core/metadata/orchestration/formElement/*.test.ts`
- Create: `tools/dependency-cruiser/test/form-element-boundary.test.mjs`

**Interfaces:**
- Produces: нейтральные `ElementRule`, `ElementType`, `ElementXML`, traversal и rule registry.
- Produces: `registerFormElementAdapter({ type, yamlName, rule, enterpriseDataPath })` for concrete forms.
- Keeps: concrete element rules and form-specific enterprise conversion under `forms/elements`.

- [x] **Step 1: Добавить архитектурный тест направления зависимости**

```js
test("form element orchestration owns the generic implementation", () => {
  for (const file of ["fn", "helper", "ruleFactory", "singletonName", "toEnterprise", "toJSONSchema", "types"]) {
    const source = readFileSync(`packages/core/metadata/orchestration/formElement/${file}.ts`, "utf8")
    assert.doesNotMatch(source, /forms\/elements/u, file)
  }
})
```

- [x] **Step 2: Запустить тест и подтвердить семь реэкспортов**

Run: `node --test tools/dependency-cruiser/test/form-element-boundary.test.mjs`

Expected: FAIL для всех семи файлов, которые сейчас реэкспортируют `forms/elements/orchestration`.

- [x] **Step 3: Перенести нейтральные типы и registry**

`ElementType` выводится из расширяемой карты:

```ts
export interface FormElementTypeMap {}
export type ElementType = keyof FormElementTypeMap & string

export interface RegisteredFormElementAdapter {
  readonly yamlName: string
  readonly rule: ElementRule
  readonly enterpriseDataPath?: (params: {
    context: ConfigurationContext
    rule: PropertyRule
    value: string
  }) => string | undefined
}
```

Concrete form modules дополняют `FormElementTypeMap` и регистрируют правила/имена. Literal map `CollectableElementTypeToYAML` больше не живёт в нейтральном слое; нейтральный код обращается к registry.

- [x] **Step 4: Перенести traversal и singleton helpers**

Переместить generic реализацию `fromXMLToYAML`, `fromYAMLToXML`, `singletonName`, JSON Schema traversal и empty-item checks в `orchestration/formElement`. Заменить `BaseElement`/`NamedElement` локальными проекциями `{ itemType: string; name?: string; [key: string]: unknown }`.

- [x] **Step 5: Оставить forms-совместимость в правильном направлении**

Старые файлы `forms/elements/orchestration/*` становятся временными реэкспортами из `orchestration/formElement`, чтобы внутренние consumers мигрировали без изменения поведения. Concrete registration выполняется из `forms/elements/index.ts`.

- [x] **Step 6: Проверить форму, schema и round-trip**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/orchestration/formElement metadata/forms/elements/__tests__/fromXMLToYAML.test.ts metadata/forms/clientApplicationForm/toJSONSchema.test.ts --no-isolate`

Run: `pnpm test:architecture`

Expected: семь прямых нарушений `orchestration/formElement/* -> forms/elements/orchestration/*` исчезли; concrete rules по-прежнему регистрируются только из `forms`.

Run: `pnpm architecture:baseline`

Run: `pnpm architecture:cycle-baseline -- --accept-rewrite`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 97037f181`

- [x] **Step 7: Зафиксировать изменение**

```bash
git add packages/core/metadata/orchestration/formElement packages/core/metadata/forms/elements tools/dependency-cruiser/test/form-element-boundary.test.mjs .dependency-cruiser-known-violations.json .dependency-cruiser-cycle-baseline.json
git commit -m "refactor: :recycle: перенести общий механизм элементов формы"
```

### Task 5: Form-validation через проекции и адаптер

**Files:**
- Create: `packages/core/metadata/validation/formContracts.ts`
- Modify: `packages/core/metadata/validation/formValidationRegistry.ts`
- Modify: `packages/core/metadata/validation/dataPath/formIndex.ts`
- Modify: `packages/core/metadata/validation/dataPath/formTraversal.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/validationAdapter.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/register.ts`
- Create: `packages/core/metadata/validation/formValidationRegistry.test.ts`
- Modify: `packages/core/metadata/validation/validateForm.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/formTraversal.test.ts`

**Interfaces:**
- Produces: `FormValidationAdapter` with form rule, YAML element classifier, element traversal and element-name validation.
- Produces: minimal `FormAttributeView`, `FormAttributeColumnView`, `FormValidationView` structural contracts.
- Removes: all imports from `validation` to `clientApplicationForm`, `forms/commonObjects/*`, `forms/index.ts` and concrete element types.

- [x] **Step 1: Добавить тест отсутствующего адаптера**

```ts
it("fails clearly when form validation adapter is not registered", () => {
  clearFormValidationAdapterForTests()
  expect(() => requireFormValidationAdapter()).toThrow(
    "Не зарегистрирован адаптер validation для ClientApplicationForm"
  )
})
```

- [x] **Step 2: Запустить тест и подтвердить отсутствие обязательного договора**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/validation/formValidationRegistry.test.ts --no-isolate`

Expected: FAIL, потому что registry сейчас хранит только platform sources и не имеет обязательного form adapter.

- [x] **Step 3: Ввести структурные проекции**

```ts
export interface FormAttributeView {
  readonly name: string
  readonly type?: TypeDescriptionView
  readonly dynamicList?: unknown
  readonly columns?: readonly FormAttributeColumnView[]
  readonly additionalColumns?: readonly {
    table: string
    columns: readonly FormAttributeColumnView[]
  }[]
}

export interface FormValidationView {
  readonly itemType: string
  readonly attributes?: readonly FormAttributeView[]
  readonly childItems?: unknown
}
```

`formIndex.ts` принимает `FormValidationView`; конкретная `ClientApplicationForm` структурно совместима и не импортируется.

- [x] **Step 4: Зарегистрировать полный form adapter**

```ts
export interface FormValidationAdapter {
  readonly formRule: MetadataItemRule
  readonly elementTypeFromYAML: Readonly<Record<string, string>>
  collectElementNames(params: FormValidationTraversalParams): Diagnostic[]
  visitElements(params: FormValidationTraversalParams): void
}
```

`clientApplicationForm/validationAdapter.ts` связывает этот договор с `ClientApplicationFormRules`, element registry и `validateElementNames`. `clientApplicationForm/register.ts` регистрирует адаптер после регистрации element rules.

- [x] **Step 5: Перевести validation consumers на adapter**

`formTraversal.ts` удаляет side-effect `import "../../forms"` и работает через `requireFormValidationAdapter()`. `yamlFactExtractor.ts` получает form rule, element type mapping и name collector из adapter. `formIndex.ts` использует только structural views.

- [x] **Step 6: Проверить девять прямых нарушений формы**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/validation/validateForm.test.ts metadata/validation/dataPath metadata/validation/yamlFactExtractor.test.ts --no-isolate`

Run: `pnpm test:architecture`

Expected: прямые нарушения отсутствуют для `formIndex.ts`, `formTraversal.ts`, `yamlFactExtractor.ts`; validation source tree не импортирует `metadata/forms`.

Run: `pnpm architecture:baseline`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 97037f181`

- [x] **Step 7: Зафиксировать изменение**

```bash
git add packages/core/metadata/validation packages/core/metadata/forms/clientApplicationForm .dependency-cruiser-known-violations.json
git commit -m "refactor: :recycle: подключить form-validation через адаптер"
```

### Task 6: Единая внешняя точка регистрации metadata

**Files:**
- Modify: `packages/core/metadata/register.ts`
- Modify: `packages/core/metadata/project/specs.ts`
- Modify: `packages/core/metadata/project/syncStateFiles.ts`
- Modify: `packages/core/metadata/validation/projectComponents.ts`
- Modify: `packages/core/metadata/validation/registerValidationMetadata.ts`
- Modify: `packages/core/metadata/validation/projectSpecs.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/index.ts`
- Modify: `packages/core/metadata/register.test.ts`
- Modify: direct-import tests under `packages/core/metadata/project/**/*.test.ts` and `packages/core/metadata/validation/**/*.test.ts`

**Interfaces:**
- Produces: one composition root `registerCoreMetadata()` with order common property types -> forms -> applied objects -> validation adapters.
- Produces: pure `registerMetadataLayers(layers)` used by the composition root and its order test.
- Produces: `assertCoreMetadataRegistered(operation)` in a neutral registry module; it checks state and never imports `metadata/register.ts`.
- Removes: every import/call of `registerCoreMetadata` from `project` and `validation` production modules.

- [x] **Step 1: Добавить тест порядка и понятной ошибки**

```ts
it("requires registration before a neutral project operation", () => {
  const result = spawnSync(process.execPath, [
    "--input-type=module",
    "--eval",
    `import { getMetadataProjectSpecByDir } from "./metadata/project/specs.ts";
     getMetadataProjectSpecByDir("Catalogs")`,
  ], { cwd: packageRoot, encoding: "utf8" })
  expect(result.status).toBe(1)
  expect(result.stderr).toContain(
    "Metadata не зарегистрирована перед операцией project/specs"
  )
})

it("registers validation adapters after concrete metadata", () => {
  const trace: string[] = []
  registerMetadataLayers({
    commonObjects: () => trace.push("commonObjects"),
    forms: () => trace.push("forms"),
    appliedObjects: () => trace.push("appliedObjects"),
    validationAdapters: () => trace.push("validationAdapters"),
  })
  expect(trace).toEqual([
    "commonObjects",
    "forms",
    "appliedObjects",
    "validationAdapters",
  ])
})
```

- [x] **Step 2: Запустить тест и подтвердить скрытую саморегистрацию**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/register.test.ts metadata/project/specs.test.ts --no-isolate`

Expected: FAIL: нейтральные модули сейчас сами вызывают `registerCoreMetadata`, а порядок validation adapters не принадлежит composition root.

- [x] **Step 3: Зафиксировать состояние регистрации в нейтральном registry**

```ts
export function assertCoreMetadataRegistered(operation: string): void {
  if (getRegisteredProjectSpecs().length === 0) {
    throw new Error(`Metadata не зарегистрирована перед операцией ${operation}`)
  }
}
```

`project/specs.ts`, `syncStateFiles.ts` и `validation/projectComponents.ts` вызывают только эту проверку. Они не импортируют composition root.

```ts
export interface MetadataRegistrationLayers {
  commonObjects(): void
  forms(): void
  appliedObjects(): void
  validationAdapters(): void
}

export function registerMetadataLayers(layers: MetadataRegistrationLayers): void {
  layers.commonObjects()
  layers.forms()
  layers.appliedObjects()
  layers.validationAdapters()
}
```

- [x] **Step 4: Перенести validation registration во внешний порядок**

`registerCoreMetadata()` вызывает `registerValidationMetadataAdapters()` после common objects, forms и applied objects. `registerValidationMetadata.ts` больше не вызывает `registerCoreMetadata()` и регистрирует только owner-fact collectors/form adapters, используя уже заполненные registries.

- [x] **Step 5: Явно подготовить тесты и worker boundaries**

Тесты, импортирующие `project`/`validation` напрямую, вызывают `registerCoreMetadata()` в setup. Worker entrypoint получает подготовленный rules snapshot или вызывает composition root до входа в нейтральную функцию; сам `preparedYamlProjectWorker.ts` не импортирует `register.ts`.

- [x] **Step 6: Проверить четыре прямых нарушения регистрации**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/register.test.ts metadata/project metadata/validation/projectComponents.test.ts metadata/validation/yamlFactExtractor.test.ts --no-isolate`

Run: `pnpm test:architecture`

Expected: `project/specs.ts`, `project/syncStateFiles.ts`, `validation/projectComponents.ts`, `validation/registerValidationMetadata.ts` больше не импортируют `metadata/register.ts`.

Run: `pnpm architecture:baseline`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 97037f181`

- [x] **Step 7: Зафиксировать изменение**

```bash
git add packages/core/index.ts packages/core/metadata/register.ts packages/core/metadata/project packages/core/metadata/validation .dependency-cruiser-known-violations.json
git commit -m "refactor: :recycle: вынести регистрацию metadata на границу"
```

### Task 7: Нейтральный metadataItemAugmenter

**Files:**
- Move: `packages/core/metadata/importFromXml/metadataItemAugmenter.ts` to `packages/core/metadata/orchestration/metadataItem/augmenterRegistry.ts`
- Move: `packages/core/metadata/importFromXml/metadataItemAugmenter.test.ts` to `packages/core/metadata/orchestration/metadataItem/augmenterRegistry.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/register.ts`
- Modify: `packages/core/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Create: `tools/dependency-cruiser/test/metadata-item-augmenter-boundary.test.mjs`

**Interfaces:**
- Produces: `registerMetadataItemXmlImportAugmenter`, `applyMetadataItemXmlImportAugmenter` and test reset next to `orchestration/metadataItem`.
- Keeps: concrete configuration-extension augmenter under `appliedObjects/configurationExtension`.

- [x] **Step 1: Добавить архитектурную проверку нового владельца**

```js
test("metadata item augmenter registry belongs to orchestration", () => {
  assert.equal(existsSync("packages/core/metadata/importFromXml/metadataItemAugmenter.ts"), false)
  assert.equal(existsSync("packages/core/metadata/orchestration/metadataItem/augmenterRegistry.ts"), true)
})
```

- [x] **Step 2: Запустить тест и подтвердить старое размещение**

Run: `node --test tools/dependency-cruiser/test/metadata-item-augmenter-boundary.test.mjs`

Expected: FAIL: registry ещё находится в `importFromXml`.

- [x] **Step 3: Переместить registry без изменения поведения**

Перенести интерфейс, Map, duplicate guard, lookup и сообщения ошибок без функциональных изменений. Обновить импорты consumers и concrete registration.

- [x] **Step 4: Проверить XML import и последнее прямое нарушение**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/orchestration/metadataItem/augmenterRegistry.test.ts metadata/orchestration/metadataItem/fromXMLToYAML.test.ts metadata/importFromXml/importConfigurationExtension.test.ts --no-isolate`

Run: `pnpm test:architecture`

Expected: `orchestration/metadataItem/fromXMLToYAML.ts` больше не достигает `importFromXml/metadataItemAugmenter.ts`.

Run: `pnpm architecture:baseline`

Run: `pnpm architecture:cycle-baseline -- --accept-rewrite`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 97037f181`

- [x] **Step 5: Зафиксировать изменение**

```bash
git add packages/core/metadata/importFromXml packages/core/metadata/orchestration/metadataItem packages/core/metadata/forms/clientApplicationForm packages/core/metadata/appliedObjects/configurationExtension tools/dependency-cruiser/test/metadata-item-augmenter-boundary.test.mjs .dependency-cruiser-known-violations.json .dependency-cruiser-cycle-baseline.json
git commit -m "refactor: :recycle: перенести registry metadata-item augmenter"
```

### Task 8: Достижение 0/0 и удаление baseline границ

**Files:**
- Delete: `.dependency-cruiser-known-violations.json`
- Modify: `.dependency-cruiser-cycle-baseline.json` only if paths moved and metrics did not grow
- Modify: `tools/dependency-cruiser/test/quick-boundary-fixes.test.mjs`

**Interfaces:**
- Produces: полный production-граф с `not-in-allowed = 0` и `neutral-not-reach-implementations = 0` без baseline границ.

- [x] **Step 1: Снять строгий отчёт без смягчения baseline**

Run: `pnpm architecture:baseline`

Expected: команда удаляет `.dependency-cruiser-known-violations.json`, потому что сериализованный список пуст.

- [x] **Step 2: Проверить отсутствие всех 34 исходных источников**

Добавить в `quick-boundary-fixes.test.mjs` явный список всех 22 production-файлов, на которые приходятся 34 прямых нарушения:

```js
const remediatedBoundarySources = [
  "packages/core/metadata/orchestration/formElement/fn.ts",
  "packages/core/metadata/orchestration/formElement/helper.ts",
  "packages/core/metadata/orchestration/formElement/ruleFactory.ts",
  "packages/core/metadata/orchestration/formElement/singletonName.ts",
  "packages/core/metadata/orchestration/formElement/toEnterprise.ts",
  "packages/core/metadata/orchestration/formElement/toJSONSchema.ts",
  "packages/core/metadata/orchestration/formElement/types.ts",
  "packages/core/metadata/orchestration/metadataItem/element.ts",
  "packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.ts",
  "packages/core/metadata/orchestration/metadataItem/yaml.ts",
  "packages/core/metadata/orchestration/property/toJSONSchema.ts",
  "packages/core/metadata/project/specs.ts",
  "packages/core/metadata/project/syncStateFiles.ts",
  "packages/core/metadata/validation/dataPath/formIndex.ts",
  "packages/core/metadata/validation/dataPath/formTraversal.ts",
  "packages/core/metadata/validation/dataPath/formYamlIndex.ts",
  "packages/core/metadata/validation/dataPath/objectFields.ts",
  "packages/core/metadata/validation/dataPath/ownerFacts.ts",
  "packages/core/metadata/validation/dataPath/typeDescription.ts",
  "packages/core/metadata/validation/projectComponents.ts",
  "packages/core/metadata/validation/registerValidationMetadata.ts",
  "packages/core/metadata/validation/yamlFactExtractor.ts",
]
```

Для каждого файла проверить отсутствие запрещённых исходящих зависимостей, а затем проверить, что `.dependency-cruiser-known-violations.json` отсутствует. Отдельно проверить отсутствие импортов `metadata/register.ts` в `project`/`validation`, `forms` в `orchestration/formElement` и `validation`, `systemEnumerations/types.ts` в `orchestration`, `importFromXml/metadataItemAugmenter.ts` во всём дереве.

- [x] **Step 3: Выполнить полную архитектурную проверку**

Run: `pnpm test:architecture:rules`

Run: `pnpm test:architecture`

Expected: PASS; вывод сообщает `0 нарушений границ`, cycle metrics не превышают 4 компоненты, 1079 модулей и 5628 зависимостей.

- [x] **Step 4: Выполнить полную проверку проекта**

Run: `pnpm test`

Run: `pnpm duplicates -- --base 97037f181`

Expected: все тесты проходят; новых дубликатов нет.

- [x] **Step 5: Проверить рабочее дерево и итоговую разницу**

Run: `git diff --check 97037f181..HEAD`

Run: `git diff --check`

Run: `git status --short`

Expected: `git diff --check` не печатает ошибок; перед финальным коммитом status содержит только ожидаемое удаление baseline и итоговые тестовые уточнения.

- [x] **Step 6: Зафиксировать нулевой baseline**

```bash
git add -A .dependency-cruiser-known-violations.json .dependency-cruiser-cycle-baseline.json tools/dependency-cruiser/test/quick-boundary-fixes.test.mjs
git commit -m "chore: :wrench: удалить baseline границ metadata"
```

## Completion Check

- `not-in-allowed`: 0.
- `neutral-not-reach-implementations`: 0.
- `.dependency-cruiser-known-violations.json` отсутствует.
- Cycle baseline не превышает 4 компоненты, 1079 модулей и 5628 внутренних зависимостей.
- `pnpm test:architecture:rules` проходит.
- `pnpm test:architecture` проходит без смягчения нарушений.
- `pnpm test` проходит во всех пакетах.
- `pnpm duplicates -- --base 97037f181` не находит новых дубликатов.
- XML-фикстуры не изменены.
- В `BasePropertyRule` и `PropertyRule` не добавлены новые служебные поля.
