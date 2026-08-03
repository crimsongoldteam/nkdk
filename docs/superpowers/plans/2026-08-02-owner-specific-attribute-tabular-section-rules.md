# Owner-Specific Attribute And Tabular Section Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить максимально широкие правила реквизитов и табличных частей законченными owner-specific правилами, отклонять неподдерживаемые YAML-поля и не добавлять лишние XML-default без reference.

**Architecture:** Общие правила разбиваются на упорядоченные фрагменты `properties + xmlOrder`; каждый прикладной объект собирает и регистрирует собственные правила реквизита, табличной части и её реквизита. Нейтральный resolver обеспечивает приоритет явного `itemRule`, а отдельная jscpd-команда сравнивает текущий отчёт с базовой ревизией и блокирует только новые дубли.

**Tech Stack:** TypeScript 7, TypeBox/Ajv, Vitest 4, pnpm 10, jscpd 5.0.12, Node.js 26, XML/YAML rules.ts.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не добавлять новые `fromXML`/`toXML`/`fromYAML`/`toYAML`; договор выражается через `rules.ts`, фрагменты и регистрации.
- Не добавлять поля в `BasePropertyRule`/`PropertyRule` и параметры существующих построителей.
- `orchestration`, `validation` и `project` не получают условий по конкретному `itemType`, XML-корню или каталогу прикладного объекта.
- Каждый владелец получает собственные property type, schema name и законченные правила; общими остаются только фрагменты и нейтральные помощники.
- Явный `propertyRule.itemRule` имеет приоритет над зарегистрированным правилом во всех общих потребителях.
- Неподдерживаемое владельцем поле отсутствует в JSON Schema и отклоняется валидацией.
- Внешняя обработка и внешний отчёт используют соответственно договоры `MetadataDataProcessor` и `MetadataReport`.
- Существующие дубли не блокируют разработку; jscpd отклоняет только новые дубли относительно базовой ревизии.
- Перед завершением выполнить mutation testing изменённого production-кода, `pnpm type-check`, полный `pnpm test`, round-trip `cf/doc` и проверку jscpd.

---

## Карта файлов

Новые общие единицы:

- `packages/core/metadata/commonObjects/metadataRuleFragment.ts` — тип фрагмента и проверяемая композиция законченного правила.
- `packages/core/metadata/orchestration/property/resolvePropertyItemRule.ts` — единое разрешение явного и зарегистрированного `itemRule`.
- `packages/core/metadata/commonObjects/metadataAttribute/fragments.ts` — переиспользуемые блоки обычного реквизита.
- `packages/core/metadata/commonObjects/metadataAttribute/registerOwnerCollection.ts` — нейтральная регистрация owner-specific коллекции реквизитов.
- `packages/core/metadata/commonObjects/metadataTabularSection/fragments.ts` — блоки табличной части и фабрики `InternalInfo`/вложенной коллекции.
- `packages/core/metadata/commonObjects/metadataTabularSection/registerOwnerCollection.ts` — нейтральная регистрация owner-specific табличных частей.
- `packages/core/metadata/commonObjects/metadataRegisterAttribute/fragments.ts` — блоки реквизитов регистров без ветвления по владельцу.
- `scripts/check-new-duplicates.mjs` — два запуска jscpd и сравнение мультимножеств дублей.
- `scripts/check-new-duplicates.test.mjs` — проверка сравнения отчётов без запуска полного сканирования.

Owner-specific правила живут в `childRules.ts` рядом с объектом:

- `metadataCatalog`, `metadataDocument`, `metadataTask`, `metadataBusinessProcess`, `metadataExchangePlan`;
- `metadataChartOfAccounts`, `metadataChartOfCalculationTypes`, `metadataChartOfCharacteristicTypes`;
- `metadataDataProcessor`, `metadataReport`;
- `metadataInformationRegister`, `metadataAccumulationRegister`, `metadataAccountingRegister`, `metadataCalculationRegister`.

Каждый `rules.ts` импортирует только свой `childRules.ts` и использует собственные построители коллекций. Общие `metadataAttribute/rules.ts`, `metadataTabularSection/rules.ts` и `metadataRegisterAttribute/rules.ts` после миграции перестают владеть законченными правилами прикладных объектов.

---

### Task 1: Добавить проверку только новых дублей

**Files:**
- Create: `.jscpd.json`
- Create: `scripts/check-new-duplicates.mjs`
- Create: `scripts/check-new-duplicates.test.mjs`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `--base <git-ref>` либо `JSCPD_BASE_REF`; без них — `merge-base HEAD ${JSCPD_TARGET_REF:-develop}`.
- Produces: `duplicateFingerprint(reportClone, sourceRoot): string`, `findNewDuplicates(baseClones, currentClones): CloneDelta[]` и CLI `pnpm duplicates` с кодом 1 только при положительном приращении мультимножества.

- [ ] **Step 1: Написать падающие тесты сравнения мультимножеств**

Создать `scripts/check-new-duplicates.test.mjs`:

```js
import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { findNewDuplicates } from "./check-new-duplicates.mjs"

const clone = (fingerprint) => ({ fingerprint, firstFile: { name: `${fingerprint}-a.ts` }, secondFile: { name: `${fingerprint}-b.ts` } })

describe("findNewDuplicates", () => {
  it("не считает существующий дубль новым", () => {
    assert.deepEqual(findNewDuplicates([clone("old")], [clone("old")]), [])
  })

  it("возвращает только новый отпечаток", () => {
    assert.deepEqual(findNewDuplicates([clone("old")], [clone("old"), clone("new")]), [clone("new")])
  })

  it("учитывает увеличение числа пар с тем же отпечатком", () => {
    assert.deepEqual(findNewDuplicates([clone("copy")], [clone("copy"), clone("copy")]), [clone("copy")])
  })
})
```

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run: `node --test scripts/check-new-duplicates.test.mjs`

Expected: FAIL с `ERR_MODULE_NOT_FOUND` для `check-new-duplicates.mjs`.

- [ ] **Step 3: Установить jscpd и добавить конфигурацию**

Run: `pnpm add -Dw jscpd@5.0.12`

Создать `.jscpd.json`:

```json
{
  "minLines": 5,
  "minTokens": 50,
  "mode": "mild",
  "format": ["typescript", "javascript"],
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/coverage/**",
    "**/__fixtures__/**",
    "**/*.snap"
  ],
  "reporters": ["json"]
}
```

Официальный формат отчёта: `duplicates[]` с `firstFile`/`secondFile`, `lines`, `tokens`; см. `https://jscpd.dev/reporters/json`.

- [ ] **Step 4: Реализовать чистое сравнение отчётов**

В `scripts/check-new-duplicates.mjs` экспортировать:

```js
export function findNewDuplicates(baseClones, currentClones) {
  const remaining = new Map()
  for (const clone of baseClones) {
    remaining.set(clone.fingerprint, (remaining.get(clone.fingerprint) ?? 0) + 1)
  }

  return currentClones.filter((clone) => {
    const count = remaining.get(clone.fingerprint) ?? 0
    if (count === 0) return true
    remaining.set(clone.fingerprint, count - 1)
    return false
  })
}
```

Для каждого JSON-клона вычислять SHA-256 от отсортированной пары нормализованных исходных фрагментов. Фрагмент брать из `duplicationA`/`duplicationB`, если репортёр их отдал; иначе читать строки `start..end` из соответствующего файла. Нормализация меняет CRLF на LF и удаляет завершающие пробелы, но не меняет идентификаторы и литералы.

- [ ] **Step 5: Реализовать CLI без сохранённого baseline-файла**

CLI должен выполнить последовательно:

1. определить базовую ревизию;
2. создать временный каталог через `mkdtemp`;
3. сохранить пути `baseArchive = join(tempDir, "base.tar")`, `baseReportDir = join(tempDir, "base-report")` и `currentReportDir = join(tempDir, "current-report")`;
4. выгрузить базовую ревизию через `git archive --format=tar --output baseArchive baseRef` и распаковать её;
5. определить `jscpdBin` как `node_modules/.bin/jscpd` текущего репозитория и запустить его с существующими в каждом дереве путями из списка `packages`, `scripts`, текущим `configPath`, JSON reporter и соответствующим report directory;
6. сравнить мультимножества отпечатков;
7. вывести только новые пары с файлами и диапазонами, затем установить `process.exitCode = 1`, если список непуст;
8. удалить временный каталог в `finally`.

Вызов `main()` защитить сравнением `import.meta.url` с `pathToFileURL(process.argv[1]).href`, чтобы unit-тест мог импортировать чистые функции без запуска git/jscpd.

Ошибки `git`, `tar`, запуска jscpd и чтения отчёта должны завершать команду кодом 1, а не считаться отсутствием дублей.

- [ ] **Step 6: Подключить команды проекта**

В `package.json` добавить:

```json
{
  "scripts": {
    "duplicates": "node scripts/check-new-duplicates.mjs",
    "test:duplicates-script": "node --test scripts/check-new-duplicates.test.mjs",
    "test": "pnpm test:duplicates-script && pnpm -r run test"
  }
}
```

Остальные существующие scripts сохранить.

- [ ] **Step 7: Проверить скрипт и нулевое сравнение**

Run:

```bash
pnpm test:duplicates-script
pnpm duplicates -- --base HEAD
```

Expected: обе команды PASS; сравнение с `HEAD` не требует устранить старые дубли.

- [ ] **Step 8: Зафиксировать инструмент**

```bash
git add .jscpd.json scripts/check-new-duplicates.mjs scripts/check-new-duplicates.test.mjs package.json pnpm-lock.yaml
git commit -m "chore: :wrench: проверять приращение дублей"
```

---

### Task 2: Добавить проверяемую композицию фрагментов rules.ts

**Files:**
- Create: `packages/core/metadata/commonObjects/metadataRuleFragment.ts`
- Create: `packages/core/metadata/commonObjects/metadataRuleFragment.test.ts`

**Interfaces:**
- Consumes: базовые поля `MetadataItemRule` без `properties`/`xmlOrder` и один или несколько `MetadataRuleFragment`.
- Produces: `metadataRuleFragment(order, properties)` и `composeMetadataItemRule(base, ...fragments)` с сохранением ключей свойств в типе результата.

- [ ] **Step 1: Написать падающие тесты договора композиции**

Проверить в `metadataRuleFragment.test.ts`:

```ts
it("сохраняет порядок и свойства фрагментов", () => {
  const rule = composeMetadataItemRule(
    { itemType: "Probe" },
    metadataRuleFragment(["name"], { name: { type: "string", xml: "Name" } }),
    metadataRuleFragment(["uuid"], { uuid: { type: "string", xml: "_uuid" } })
  )

  expect(rule.xmlOrder).toEqual(["name", "uuid"])
  expect(Object.keys(rule.properties)).toEqual(["name", "uuid"])
})

it.each([
  ["свойство", metadataRuleFragment(["name"], { name: { type: "string" } }), metadataRuleFragment(["name"], { name: { type: "string" } })],
  ["порядок", metadataRuleFragment(["name", "name"], { name: { type: "string" } }), undefined],
])("отклоняет повтор: %s", (_name, first, second) => {
  expect(() => composeMetadataItemRule({ itemType: "Probe" }, first, ...(second ? [second] : []))).toThrow(/повтор/i)
})

it("отклоняет несовпадение properties и xmlOrder", () => {
  expect(() => metadataRuleFragment(["name"], { name: { type: "string" }, comment: { type: "string" } })).toThrow(/comment/)
})
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRuleFragment.test.ts`

Expected: FAIL — модуль композиции отсутствует.

- [ ] **Step 3: Реализовать фрагмент и композицию**

Использовать один именованный типовой переходник внутри helper:

```ts
export interface MetadataRuleFragment<Properties extends Readonly<Record<string, PropertyRule>> = Readonly<Record<string, PropertyRule>>> {
  readonly xmlOrder: readonly (keyof Properties & string)[]
  readonly properties: Properties
}

export function metadataRuleFragment<
  const Properties extends Readonly<Record<string, PropertyRule>>,
  const Order extends readonly (keyof Properties & string)[],
>(xmlOrder: Order, properties: Properties): MetadataRuleFragment<Properties> {
  assertExactFragmentKeys(xmlOrder, properties)
  return Object.freeze({ xmlOrder: Object.freeze([...xmlOrder]), properties: Object.freeze({ ...properties }) })
}
```

`composeMetadataItemRule` объединяет фрагменты слева направо, бросает ошибку с `itemType` и ключом при повторе и возвращает замороженные `xmlOrder`/`properties`. Приведение объединённого объекта держать только в функции `asComposedMetadataRule` и покрыть приведёнными тестами.

- [ ] **Step 4: Запустить узкие тесты и type-check core**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRuleFragment.test.ts metadata/orchestration/property/xmlPropertyOrder.test.ts
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS; существующий общий `getCompiledXMLPropertyOrder` пока сохраняет обратную совместимость для немигрированных правил.

- [ ] **Step 5: Зафиксировать композицию**

```bash
git add packages/core/metadata/commonObjects/metadataRuleFragment.ts packages/core/metadata/commonObjects/metadataRuleFragment.test.ts
git commit -m "refactor: :recycle: добавить композицию правил метаданных"
```

---

### Task 3: Обеспечить приоритет явного itemRule

**Files:**
- Create: `packages/core/metadata/orchestration/property/resolvePropertyItemRule.ts`
- Create: `packages/core/metadata/orchestration/property/resolvePropertyItemRule.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts`
- Modify: `packages/core/metadata/operations/targetResolver.ts`
- Modify: `packages/core/metadata/validation/metadataTargetTraversal.ts`
- Modify: `packages/core/metadata/validation/excludeIfEqualNameYAML.ts`
- Modify: `packages/core/metadata/validation/rulesSnapshot.ts`
- Modify: `packages/core/metadata/project/projectSpecRegistry.ts`

**Interfaces:**
- Consumes: `PropertyRule` и необязательное fallback-правило регистрации.
- Produces: `resolvePropertyItemRule(propertyRule, fallback?): MetadataItemRule | undefined`, всегда выбирающий явный `propertyRule.itemRule` первым.

- [ ] **Step 1: Написать падающий тест resolver**

```ts
it("выбирает явное правило свойства раньше зарегистрированного", () => {
  const explicit = probeItemRule("Explicit")
  const registered = probeItemRule("Registered")

  expect(resolvePropertyItemRule({ type: "Probe", itemRule: explicit }, registered)).toBe(explicit)
  expect(resolvePropertyItemRule({ type: "Probe" }, registered)).toBe(registered)
})
```

- [ ] **Step 2: Добавить падающую интеграционную проверку JSON Schema**

В `ruleFactory.test.ts` зарегистрировать коллекцию с fallback-полем `fallback`, а в property rule передать явное item rule только с полем `explicit`. Проверить в inline- и externalRefs-контексте:

```ts
expect(compiled.Check({ A: { explicit: "yes" } })).toBe(true)
expect(compiled.Check({ A: { fallback: "no" } })).toBe(false)
```

Expected before implementation: второй объект ошибочно принимается зарегистрированной схемой.

- [ ] **Step 3: Реализовать resolver**

```ts
export function resolvePropertyItemRule(
  propertyRule: PropertyRule,
  fallback?: MetadataItemRule
): MetadataItemRule | undefined {
  if ("itemRule" in propertyRule && propertyRule.itemRule !== undefined) {
    return propertyRule.itemRule as MetadataItemRule
  }
  return fallback ?? getTypeRule(propertyRule.type, "collectionItemRule")?.itemRule
}
```

- [ ] **Step 4: Подключить resolver ко всем общим обходам**

Заменить локальные функции с порядком «registration → explicit» в пяти потребителях на `resolvePropertyItemRule`. В `ruleFactory.ts` использовать resolver:

- в прямом XML → YAML импорте;
- в `itemRuleFromProperty` для YAML → XML;
- в inline JSON Schema exporter;
- в externalRefs factory: для зарегистрированного правила вернуть существующий `$ref`, для отличающегося явного правила вернуть inline record/array schema, построенную `exportMetadataItemToJSONSchema`.

Не добавлять знания о property type или владельцах в эти файлы.

- [ ] **Step 5: Запустить проверки общих потребителей**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/orchestration/property/resolvePropertyItemRule.test.ts \
  metadata/orchestration/metadataCollection/ruleFactory.test.ts \
  metadata/validation/metadataTargetTraversal.test.ts \
  metadata/validation/excludeIfEqualNameYAML.test.ts
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Зафиксировать нейтральный приоритет**

```bash
git add packages/core/metadata/orchestration packages/core/metadata/operations/targetResolver.ts packages/core/metadata/validation packages/core/metadata/project/projectSpecRegistry.ts
git commit -m "fix: :bug: учитывать явное правило вложенной коллекции"
```

---

### Task 4: Разделить общие правила на переиспользуемые блоки

**Files:**
- Create: `packages/core/metadata/commonObjects/metadataAttribute/fragments.ts`
- Create: `packages/core/metadata/commonObjects/metadataAttribute/registerOwnerCollection.ts`
- Create: `packages/core/metadata/commonObjects/metadataTabularSection/fragments.ts`
- Create: `packages/core/metadata/commonObjects/metadataTabularSection/registerOwnerCollection.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: `metadataRuleFragment`, существующие неизменённые property rules и `registerMetadataItemCollectionRule`.
- Produces: `metadataAttributeRuleBase`, `metadataTabularSectionRuleBase`, структурные `metadataAttributeModelProperties`/`metadataTabularSectionModelProperties`, именованные фрагменты обычного реквизита/табличной части, registration helper и фабрики property builders без знаний о владельцах.

- [ ] **Step 1: Усилить существующие round-trip тесты порядка**

Расширить существующие `it.each` так, чтобы представитель обычного реквизита и табличной части сравнивал полный XML с неизменяемой fixture и дополнительно проверял:

```ts
expect(getCompiledXMLPropertyOrder(rule)).toEqual(rule.xmlOrder)
expect(new Set(rule.xmlOrder).size).toBe(Object.keys(rule.properties).length)
```

До извлечения фрагментов тесты должны оставаться зелёными; это characterization-проверка реорганизации, а не новый класс входа.

- [ ] **Step 2: Извлечь блоки обычного реквизита без изменения свойств**

Перенести определения из `metadataAttribute/rules.ts` в `fragments.ts` по точной карте:

| Фрагмент | Ключи в XML-порядке |
|---|---|
| `attributeIdentityFragment` | `objectBelonging`, `name` |
| `attributePresentationFragment({ allowedTypes })` | `synonym`, `comment`, `type`, `passwordMode`, `format`, `editFormat`, `toolTip`, `markNegatives`, `mask`, `multiLine`, `extendedEdit`, `minValue`, `maxValue` |
| `attributeFillFragment` | `fillFromFillingValue`, `fillValue` |
| `attributeChoiceFragment` | `fillChecking`, `choiceFoldersAndItems`, `choiceParameterLinks`, `choiceParameters`, `quickChoice`, `createOnInput`, `choiceForm`, `linkByType`, `choiceHistoryOnInput` |
| `attributeUseFragment` | `use` |
| `attributeSearchAndHistoryFragment` | `indexing`, `fullTextSearch`, `dataHistory` |
| `attributeIndexAndFullTextFragment` | `indexing`, `fullTextSearch` |
| `attributeBinaryStorageUseFragment` | `binaryDataStorageLocationUse` |
| `attributeBinaryStorageUseFieldFragment` | `binaryDataStorageLocationUseField` |
| `attributeUuidFragment` | `uuid` |

`attributePresentationFragment` принимает только `allowedTypes?: TypeDescriptionAllowedTypes`; прочие свойства копируются без изменения defaults.

`metadataAttributeRuleBase` содержит только общий договор элемента, не набор полей:

```ts
export const metadataAttributeRuleBase = {
  itemType: "MetadataAttribute",
  metadataTargetOwner: { kind: "inherit" },
  externalMetadata: { segment: "Attribute", placement: "ownerChild" },
} as const
```

Для сохранения общего публичного model-типа экспортировать `metadataAttributeModelProperties` как объединение всех property maps фрагментов без `xmlOrder`. Этот объект не регистрируется и не используется как XML/YAML-схема владельца.

- [ ] **Step 3: Извлечь блоки табличной части**

Перенести из `metadataTabularSection/rules.ts`:

| Фрагмент | Ключи |
|---|---|
| `tabularSectionInternalInfoFragment(params)` | `internalInfo` |
| `tabularSectionIdentityFragment` | `objectBelonging`, `name` |
| `tabularSectionPresentationFragment` | `synonym`, `comment`, `toolTip` |
| `tabularSectionFillCheckingFragment` | `fillChecking` |
| `tabularSectionStandardAttributesFragment` | `standardAttributes` |
| `tabularSectionUseFragment` | `use` |
| `tabularSectionLineNumberFragment` | `lineNumberLength` |
| `tabularSectionAttributesFragment(propertyType)` | `attributes` |
| `tabularSectionUuidFragment` | `uuid` |

`tabularSectionInternalInfoFragment` принимает готовые `getName` и `items`; общий файл не перечисляет owner item types. `tabularSectionAttributesFragment` принимает только конкретный property type вложенной коллекции.

`metadataTabularSectionRuleBase` содержит только:

```ts
export const metadataTabularSectionRuleBase = {
  itemType: "MetadataTabularSection",
  externalMetadata: { segment: "TabularSection", placement: "ownerChild" },
} as const
```

Аналогично экспортировать незарегистрированный `metadataTabularSectionModelProperties` только для общего структурного TypeScript-типа.

- [ ] **Step 4: Добавить нейтральные registration helper**

```ts
export function registerOwnerAttributeCollection(params: {
  propertyType: string
  schemaName: string
  itemRule: MetadataItemRule
}): void {
  registerMetadataItemCollectionRule({
    ...params,
    xmlElement: "Attribute",
    keyField: "name",
    collectionItemRule: true,
  })
}
```

Для табличной части создать точный helper:

```ts
export function registerOwnerTabularSectionCollection(params: {
  propertyType: string
  schemaName: string
  itemRule: MetadataItemRule
}): void {
  registerMetadataItemCollectionRule({
    ...params,
    xmlElement: "TabularSection",
    keyField: "name",
    collectionItemRule: true,
  })
}
```

Оба helper не принимают `itemType` владельца.

В тех же двух файлах добавить фабрики `createOwnerAttributeCollectionRuleBuilder(propertyType)` и `createOwnerTabularSectionCollectionRuleBuilder(propertyType)`. Они сохраняют существующие `ownerFactRole`, `operationTarget`, `migrationSegment` и `requiresMigration`, но конкретный строковый property type получают от applied object.

- [ ] **Step 5: Временно пересобрать старые exports из фрагментов**

До миграции потребителей сохранить имена существующих правил, но построить их через `composeMetadataItemRule`. Это обеспечивает зелёный промежуточный коммит; окончательное удаление универсальных exports выполняется в Task 9.

- [ ] **Step 6: Запустить существующие тесты реквизитов и табличных частей**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/commonObjects/metadataAttribute \
  metadata/commonObjects/metadataTabularSection
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS без изменения XML fixtures.

- [ ] **Step 7: Зафиксировать общие блоки**

```bash
git add packages/core/metadata/commonObjects/metadataAttribute packages/core/metadata/commonObjects/metadataTabularSection
git commit -m "refactor: :recycle: разделить правила реквизитов на блоки"
```

---

### Task 5: Перевести каталог, документ и процессные объекты

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataCatalog/childRules.ts`
- Create: `packages/core/metadata/appliedObjects/metadataDocument/childRules.ts`
- Create: `packages/core/metadata/appliedObjects/metadataTask/childRules.ts`
- Create: `packages/core/metadata/appliedObjects/metadataBusinessProcess/childRules.ts`
- Create: `packages/core/metadata/appliedObjects/metadataExchangePlan/childRules.ts`
- Create: `packages/core/metadata/appliedObjects/__tests__/ownerChildRules.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/builders.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/types.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataTask/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataTask/builders.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataBusinessProcess/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataBusinessProcess/builders.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataExchangePlan/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataExchangePlan/builders.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/__tests__/directRoundTrip.test.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`

**Interfaces:**
- Consumes: фрагменты и registration helper Task 4.
- Produces: по три законченных правила и три property type для каждого владельца.

- [ ] **Step 1: Добавить падающую табличную проверку состава**

В существующие тесты объектов добавить один parameterized contract с точной матрицей:

| Владелец | Реквизит объекта | Табличная часть | Вложенный реквизит |
|---|---|---|---|
| Catalog | presentation allowed, fill, choice, use, search/history, binary use, binary field | use, line number | presentation allowed, choice, search/history |
| Document | presentation allowed, fill, choice, search/history, binary field | line number | presentation allowed, choice, search/history |
| Task | presentation, fill, choice, search/history | line number | presentation allowed, choice, search/history |
| BusinessProcess | presentation, fill, choice, search/history | line number | presentation allowed, choice, search/history |
| ExchangePlan | presentation, fill, choice, search/history, binary field | line number | presentation allowed, choice, search/history |

Во всех строках неявно присутствуют identity/uuid; у табличной части — internalInfo, identity, presentation, fillChecking, standardAttributes, attributes, uuid.

Проверка должна сравнивать `Object.keys(rule.properties)` и `rule.xmlOrder`, а также отрицательно проверять хотя бы один запрещённый YAML-ключ через скомпилированную JSON Schema.

- [ ] **Step 2: Подтвердить падение на общих property type**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataCatalog metadata/appliedObjects/metadataDocument metadata/appliedObjects/metadataTask metadata/appliedObjects/metadataBusinessProcess metadata/appliedObjects/metadataExchangePlan`

Expected: FAIL — Task/BusinessProcess/ExchangePlan используют `MetadataAttributes`, Catalog использует общую табличную часть, вложенные коллекции имеют общие типы.

- [ ] **Step 3: Создать законченные правила владельцев**

В каждом `childRules.ts` явно собрать три константы. Например каталог:

```ts
export const MetadataCatalogAttributeRules = composeMetadataItemRule(
  metadataAttributeRuleBase,
  attributeIdentityFragment,
  attributePresentationFragment({ allowedTypes: METADATA_ATTRIBUTE_ALLOWED_TYPES }),
  attributeFillFragment,
  attributeChoiceFragment,
  attributeUseFragment,
  attributeSearchAndHistoryFragment,
  attributeBinaryStorageUseFragment,
  attributeBinaryStorageUseFieldFragment,
  attributeUuidFragment
)
```

Для каждого владельца использовать ровно блоки из матрицы Step 1. Вложенный реквизит каждого владельца получает собственную константу и собственный property type, даже при одинаковом наборе блоков.

- [ ] **Step 4: Зарегистрировать отдельные типы и схемы**

Использовать точные тройки:

| Owner | Attribute type/schema | Tabular type/schema | Nested attribute type/schema |
|---|---|---|---|
| Catalog | `MetadataCatalogAttributes` / `MetadataCatalogAttribute` | `MetadataCatalogTabularSections` / `MetadataCatalogTabularSection` | `MetadataCatalogTabularSectionAttributes` / `MetadataCatalogTabularSectionAttribute` |
| Document | `MetadataDocumentAttributes` / `MetadataDocumentAttribute` | `MetadataDocumentTabularSections` / `MetadataDocumentTabularSection` | `MetadataDocumentTabularSectionAttributes` / `MetadataDocumentTabularSectionAttribute` |
| Task | `MetadataTaskAttributes` / `MetadataTaskAttribute` | `MetadataTaskTabularSections` / `MetadataTaskTabularSection` | `MetadataTaskTabularSectionAttributes` / `MetadataTaskTabularSectionAttribute` |
| BusinessProcess | `MetadataBusinessProcessAttributes` / `MetadataBusinessProcessAttribute` | `MetadataBusinessProcessTabularSections` / `MetadataBusinessProcessTabularSection` | `MetadataBusinessProcessTabularSectionAttributes` / `MetadataBusinessProcessTabularSectionAttribute` |
| ExchangePlan | `MetadataExchangePlanAttributes` / `MetadataExchangePlanAttribute` | `MetadataExchangePlanTabularSections` / `MetadataExchangePlanTabularSection` | `MetadataExchangePlanTabularSectionAttributes` / `MetadataExchangePlanTabularSectionAttribute` |

- [ ] **Step 5: Обновить построители и свойства rules.ts**

Каждый builder возвращает новый строковый type владельца. Удалить локальные `itemRule`-переопределения, когда собственный property type уже зарегистрирован с тем же правилом. Не менять `operationTarget`, `ownerFactRole`, YAML/XML имена и пути.

- [ ] **Step 6: Запустить групповые round-trip/schema тесты**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/appliedObjects/metadataCatalog \
  metadata/appliedObjects/metadataDocument \
  metadata/appliedObjects/metadataTask \
  metadata/appliedObjects/metadataBusinessProcess \
  metadata/appliedObjects/metadataExchangePlan \
  metadata/validation/schemaRegistry.test.ts
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS; XML fixtures не изменены.

- [ ] **Step 7: Зафиксировать первую группу владельцев**

```bash
git add packages/core/metadata/appliedObjects/metadataCatalog packages/core/metadata/appliedObjects/metadataDocument packages/core/metadata/appliedObjects/metadataTask packages/core/metadata/appliedObjects/metadataBusinessProcess packages/core/metadata/appliedObjects/metadataExchangePlan
git commit -m "refactor: :recycle: выделить правила реквизитов по владельцам"
```

---

### Task 6: Перевести планы метаданных

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataChartOfAccounts/childRules.ts`
- Create: `packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/childRules.ts`
- Create: `packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/childRules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfAccounts/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfAccounts/builders.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/builders.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/builders.ts`
- Modify: `packages/core/metadata/appliedObjects/__tests__/ownerChildRules.test.ts`
- Modify: `packages/core/metadata/appliedObjects/__tests__/directRoundTrip.test.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`

**Interfaces:**
- Consumes: Task 4.
- Produces: отдельные top-level, tabular-section и nested-attribute rules для трёх планов.

- [ ] **Step 1: Добавить падающую матрицу планов**

| Владелец | Реквизит объекта | Табличная часть | Вложенный реквизит |
|---|---|---|---|
| ChartOfAccounts | presentation, fill, choice, search/history | line number | presentation allowed, choice, search/history |
| ChartOfCalculationTypes | presentation, fill, choice, search/history | line number | presentation allowed, choice, search/history |
| ChartOfCharacteristicTypes | presentation allowed, fill, choice, use, search/history | use, line number | presentation allowed, choice, search/history |

Проверить отдельно, что YAML-поле `Использование` разрешено только у `ChartOfCharacteristicTypes` и его табличной части.

- [ ] **Step 2: Запустить и подтвердить падение на общих типах**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataChartOfAccounts metadata/appliedObjects/metadataChartOfCalculationTypes metadata/appliedObjects/metadataChartOfCharacteristicTypes`

Expected: FAIL — top-level rules используют `MetadataAttributes`/`MetadataAttributesWithAllowedTypes`, вложенные правила общие.

- [ ] **Step 3: Собрать и зарегистрировать owner-specific правила**

Создать для каждого владельца три правила по матрице и зарегистрировать типы:

- `MetadataChartOfAccounts{Attributes,TabularSections,TabularSectionAttributes}`;
- `MetadataChartOfCalculationTypes{Attributes,TabularSections,TabularSectionAttributes}`;
- `MetadataChartOfCharacteristicTypes{Attributes,TabularSections,TabularSectionAttributes}`.

Schema names перечислить явно:

- `MetadataChartOfAccountsAttribute`, `MetadataChartOfAccountsTabularSection`, `MetadataChartOfAccountsTabularSectionAttribute`;
- `MetadataChartOfCalculationTypesAttribute`, `MetadataChartOfCalculationTypesTabularSection`, `MetadataChartOfCalculationTypesTabularSectionAttribute`;
- `MetadataChartOfCharacteristicTypesAttribute`, `MetadataChartOfCharacteristicTypesTabularSection`, `MetadataChartOfCharacteristicTypesTabularSectionAttribute`.

`InternalInfo` и generated type names перенести без изменения из старых owner-specific tabular rules.

- [ ] **Step 4: Обновить builders/rules.ts и удалить использование общих типов**

Не менять остальные свойства планов. `MetadataAttributesWithAllowedTypes` после этого не должен иметь production-потребителей.

- [ ] **Step 5: Запустить тесты планов и схем**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/appliedObjects/metadataChartOfAccounts \
  metadata/appliedObjects/metadataChartOfCalculationTypes \
  metadata/appliedObjects/metadataChartOfCharacteristicTypes \
  metadata/validation/schemaRegistry.test.ts
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Зафиксировать правила планов**

```bash
git add packages/core/metadata/appliedObjects/metadataChartOfAccounts packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes
git commit -m "refactor: :recycle: разделить правила реквизитов планов"
```

---

### Task 7: Исправить договоры обработки и отчёта

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataDataProcessor/childRules.ts`
- Create: `packages/core/metadata/appliedObjects/metadataReport/childRules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDataProcessor/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDataProcessor/builders.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDataProcessor/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataReport/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataReport/builders.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataReport/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/__tests__/ownerChildRules.test.ts`
- Modify: `packages/core/metadata/appliedObjects/__tests__/directRoundTrip.test.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`

**Interfaces:**
- Consumes: Tasks 3–4.
- Produces: шесть owner-specific правил, устраняющих исходную группу 44 файлов.

- [ ] **Step 1: Добавить падающие регрессии XML и JSON Schema**

Для обоих владельцев проверить:

```ts
expect(attributeXML).not.toMatch(/<(Indexing|FullTextSearch|DataHistory|FillFromFillingValue|FillValue)>/)
expect(tabularSectionXML).not.toContain("<LineNumberLength>")
expect(tabularAttributeXML).toContain("<FillFromFillingValue>false</FillFromFillingValue>")
expect(tabularAttributeXML).toContain('<FillValue xsi:nil="true"/>')
expect(tabularAttributeXML).not.toMatch(/<(Indexing|FullTextSearch|DataHistory)>/)
```

JSON Schema должна отклонять те же запрещённые YAML-поля и принимать `ЗаполнятьИзДанныхЗаполнения`/`ЗначениеЗаполнения` только во вложенном реквизите.

- [ ] **Step 2: Запустить тесты и подтвердить исходное падение**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataDataProcessor metadata/appliedObjects/metadataReport`

Expected: FAIL — свойства, отсутствующие в локальном `xmlOrder`, дописываются из широкого `properties`.

- [ ] **Step 3: Собрать точные правила обработки**

- top-level: identity + presentation без allowedTypes + choice + uuid;
- tabular section: internalInfo + identity + presentation + fillChecking + standardAttributes + attributes + uuid;
- nested attribute: identity + presentation with allowedTypes + fill + choice + uuid.

Типы: `MetadataDataProcessorAttributes`, `MetadataDataProcessorTabularSections`, `MetadataDataProcessorTabularSectionAttributes`; схемы: `MetadataDataProcessorAttribute`, `MetadataDataProcessorTabularSection`, `MetadataDataProcessorTabularSectionAttribute`.

- [ ] **Step 4: Собрать отдельные правила отчёта**

Использовать тот же набор блоков, но отдельные константы, property types и schema names `MetadataReport*`. Сохранить report-specific `InternalInfo`/generated types. Не переиспользовать законченные правила обработки.

- [ ] **Step 5: Обновить rules.ts/builders.ts**

Удалить наследование `...MetadataAttributeRules`, локальные неполные `xmlOrder` и ручную регистрацию из `metadataReport/rules.ts`. Регистрация должна находиться в соответствующем `childRules.ts` через нейтральные helper.

- [ ] **Step 6: Запустить регрессии и type-check**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/appliedObjects/metadataDataProcessor \
  metadata/appliedObjects/metadataReport \
  metadata/validation/schemaRegistry.test.ts
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Зафиксировать исправление исходной группы**

```bash
git add packages/core/metadata/appliedObjects/metadataDataProcessor packages/core/metadata/appliedObjects/metadataReport
git commit -m "fix: :bug: сузить правила обработки и отчёта"
```

---

### Task 8: Разделить правила реквизитов четырёх регистров

**Files:**
- Create: `packages/core/metadata/commonObjects/metadataRegisterAttribute/fragments.ts`
- Create: `packages/core/metadata/appliedObjects/metadataInformationRegister/childRules.ts`
- Create: `packages/core/metadata/appliedObjects/metadataAccumulationRegister/childRules.ts`
- Create: `packages/core/metadata/appliedObjects/metadataAccountingRegister/childRules.ts`
- Create: `packages/core/metadata/appliedObjects/metadataCalculationRegister/childRules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataInformationRegister/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataAccumulationRegister/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataAccountingRegister/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataAccountingRegister/builders.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCalculationRegister/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterField/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterAttribute/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterAttribute/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterAttribute/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/__tests__/ownerChildRules.test.ts`
- Modify: `packages/core/metadata/appliedObjects/__tests__/directRoundTrip.test.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`

**Interfaces:**
- Consumes: composition/registration helpers.
- Produces: четыре законченных правила без `toXML`-ветвления по типу родителя.

- [ ] **Step 1: Добавить падающую матрицу регистров**

| Владелец | Поддерживаемые специальные блоки |
|---|---|
| InformationRegister | fill, choice, search/history, binary use, binary field |
| AccumulationRegister | choice, index/full-text, binary use |
| AccountingRegister | choice, index/full-text, binary use |
| CalculationRegister | choice, index/full-text, binary use, schedule link |

У всех присутствуют identity, presentation и uuid. Проверить, что `СвязьСГрафиком` разрешена только регистру расчёта, `Fill*`/`ИсторияДанных` — только регистру сведений, а поле двоичного хранения — только регистру сведений.

- [ ] **Step 2: Подтвердить падение общей схемы**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRegisterAttribute metadata/appliedObjects/metadataInformationRegister metadata/appliedObjects/metadataAccumulationRegister metadata/appliedObjects/metadataAccountingRegister metadata/appliedObjects/metadataCalculationRegister`

Expected: FAIL — `MetadataRegisterAttributes` разрешает общий максимальный набор.

- [ ] **Step 3: Разделить commonRegisterFieldProperties на фрагменты**

Сохранить текущие property definitions, но удалить из них owner-ветвления `getRegisterParentItemType`, `exportInformationRegisterOrExplicit` и conditional `toXML`. Разделить ключи по точной карте:

| Фрагмент | Ключи |
|---|---|
| `registerAttributeIdentityFragment` | `objectBelonging`, `name` |
| `registerAttributePresentationFragment` | `synonym`, `comment`, `type`, `passwordMode`, `format`, `editFormat`, `toolTip`, `markNegatives`, `mask`, `multiLine`, `extendedEdit`, `minValue`, `maxValue` |
| `registerAttributeFillFragment` | `fillFromFillingValue`, `fillValue` |
| `registerAttributeChoiceFragment` | `fillChecking`, `choiceFoldersAndItems`, `choiceParameterLinks`, `choiceParameters`, `quickChoice`, `createOnInput`, `choiceForm`, `linkByType`, `choiceHistoryOnInput` |
| `registerAttributeIndexAndFullTextFragment` | `indexing`, `fullTextSearch` |
| `registerAttributeDataHistoryFragment` | `dataHistory` |
| `registerAttributeBinaryStorageUseFragment` | `binaryDataStorageLocationUse` |
| `registerAttributeBinaryStorageUseFieldFragment` | `binaryDataStorageLocationUseField` |
| `registerAttributeScheduleLinkFragment` | `scheduleLink` |
| `registerAttributeUuidFragment` | `uuid` |

`scheduleLink` не содержит проверки родителя: блок выбирает только `MetadataCalculationRegisterAttributeRules`.

Добавить `metadataRegisterAttributeRuleBase`:

```ts
export const metadataRegisterAttributeRuleBase = {
  itemType: "MetadataRegisterAttribute",
  externalMetadata: { segment: "Attribute", placement: "ownerChild" },
} as const
```

- [ ] **Step 4: Собрать и зарегистрировать четыре правила**

Использовать property types/schema names:

- `MetadataInformationRegisterAttributes` / `MetadataInformationRegisterAttribute`;
- `MetadataAccumulationRegisterAttributes` / `MetadataAccumulationRegisterAttribute`;
- `MetadataAccountingRegisterAttributes` / `MetadataAccountingRegisterAttribute`;
- `MetadataCalculationRegisterAttributes` / `MetadataCalculationRegisterAttribute`.

Сохранить `itemType: "MetadataRegisterAttribute"` и external metadata contract.

- [ ] **Step 5: Обновить builders и общие структурные типы**

Каждый register `rules.ts` использует свой property type. В `metadataRegisterAttribute/types.ts` оставить общие XML/YAML структурные типы как объединённый публичный формат, но удалить зависимость model-типа от единственного максимального `MetadataRegisterAttributeRules`; owner-specific schema определяется только правилами владельцев.

Для model-типа собрать только типовое пересечение свойств фрагментов, без runtime rule и `xmlOrder`:

```ts
type MetadataRegisterAttributeProperties =
  typeof registerAttributeIdentityFragment.properties
  & typeof registerAttributePresentationFragment.properties
  & typeof registerAttributeFillFragment.properties
  & typeof registerAttributeChoiceFragment.properties
  & typeof registerAttributeIndexAndFullTextFragment.properties
  & typeof registerAttributeDataHistoryFragment.properties
  & typeof registerAttributeBinaryStorageUseFragment.properties
  & typeof registerAttributeBinaryStorageUseFieldFragment.properties
  & typeof registerAttributeScheduleLinkFragment.properties
  & typeof registerAttributeUuidFragment.properties

export type MetadataRegisterAttribute = MetadataTypeByRule<{
  itemType: "MetadataRegisterAttribute"
  properties: MetadataRegisterAttributeProperties
}>
```

- [ ] **Step 6: Запустить тесты четырёх регистров**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/commonObjects/metadataRegisterAttribute \
  metadata/appliedObjects/metadataInformationRegister \
  metadata/appliedObjects/metadataAccumulationRegister \
  metadata/appliedObjects/metadataAccountingRegister \
  metadata/appliedObjects/metadataCalculationRegister \
  metadata/validation/schemaRegistry.test.ts
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Зафиксировать правила регистров**

```bash
git add packages/core/metadata/commonObjects/metadataRegisterAttribute packages/core/metadata/commonObjects/metadataRegisterField packages/core/metadata/appliedObjects/metadataInformationRegister packages/core/metadata/appliedObjects/metadataAccumulationRegister packages/core/metadata/appliedObjects/metadataAccountingRegister packages/core/metadata/appliedObjects/metadataCalculationRegister
git commit -m "refactor: :recycle: разделить правила реквизитов регистров"
```

---

### Task 9: Удалить универсальные профили и закрепить архитектуру

**Files:**
- Delete: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Delete: `packages/core/metadata/commonObjects/metadataAttribute/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/types.ts`
- Delete: `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`
- Delete: `packages/core/metadata/commonObjects/metadataTabularSection/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/types.ts`
- Delete: `packages/core/metadata/commonObjects/metadataRegisterAttribute/rules.ts`
- Delete: `packages/core/metadata/commonObjects/metadataRegisterAttribute/register.ts`
- Modify: `packages/core/metadata/commonObjects/schemaRegister.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts`
- Modify: `packages/core/metadata/appliedObjects/__tests__/ownerChildRules.test.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`

**Interfaces:**
- Consumes: все owner-specific exports Tasks 5–8.
- Produces: архитектурный договор полного покрытия владельцев и отсутствие production-потребителей универсальных профилей.

- [ ] **Step 1: Добавить падающую архитектурную таблицу**

В `ownerChildRules.test.ts` перечислить 14 владельцев явно. Для десяти владельцев табличных частей проверить три разных property type и три конкретных item rule; для четырёх регистров — собственный attribute type/rule. Дополнительно проверить для каждого правила:

```ts
expect(getCompiledXMLPropertyOrder(rule)).toEqual(rule.xmlOrder)
expect(new Set(rule.xmlOrder).size).toBe(rule.xmlOrder.length)
expect(Object.keys(rule.properties).sort()).toEqual([...rule.xmlOrder].sort())
```

- [ ] **Step 2: Расширить schemaRegistry.test.ts отрицательной матрицей**

Через `it.each` проверить неподдерживаемые YAML-поля для каждого класса владельцев. У каждого случая должна быть одна уникальная причина: `Fill*`, search/history, `Use`, binary use/field, `LineNumberLength` либо `ScheduleLink`.

- [ ] **Step 3: Запустить и подтвердить наличие старых регистраций**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/appliedObjects/__tests__/ownerChildRules.test.ts \
  metadata/validation/schemaRegistry.test.ts
```

Expected: FAIL, пока generic registrations и schema identities ещё доступны.

- [ ] **Step 4: Удалить универсальные законченные правила и регистрации**

Удалить production exports/registrations:

- `MetadataAttributeRules`, `MetadataAttributesWithAllowedTypesRules`, общие tabular attribute profiles;
- `MetadataTabularSectionRules` и owner rules из общего tabular файла, уже перенесённые в applied objects;
- единое `MetadataRegisterAttributeRules`;
- `MetadataAttributes`, `MetadataAttributesWithAllowedTypes`, `MetadataTabularSections`, `MetadataTabularSectionAttributes`, `MetadataTabularSectionAttributesWithFill`, `MetadataRegisterAttributes` как runtime property types.

Сохранить только действительно используемые общие fragments, structural types и registration helper. В `schemaRegister.ts` удалить ручные schema registrations мигрированных коллекций; identity создаёт `registerOwner*Collection`.

В `metadataAttribute/types.ts` и `metadataTabularSection/types.ts` заменить зависимость от удалённых finished rules на `MetadataTypeByRule` от соответствующего `*ModelProperties`. Эти structural property maps не имеют `xmlOrder`, не регистрируются и не участвуют в экспорте/валидации.

- [ ] **Step 5: Обновить characterization-тесты на конкретных представителей**

Тесты общих fixtures перевести на конкретные property types без изменения XML:

- каталог — полный обычный реквизит и табличная часть с `Use`;
- документ — вложенный реквизит без Fill;
- обработка — вложенный реквизит с Fill;
- регистр сведений — register attribute с Fill/history.

Обновить `implicitValueYAMLContract.test.ts`, заменив удалённые generic rules полным списком owner-specific rules.

- [ ] **Step 6: Проверить отсутствие production-потребителей**

Run:

```bash
rg -n "MetadataAttributeRules|MetadataAttributesWithAllowedTypesRules|MetadataTabularSectionRules|MetadataRegisterAttributeRules|type: \"MetadataAttributes\"|type: \"MetadataTabularSections\"|type: \"MetadataRegisterAttributes\"" packages/core/metadata --glob '!**/*.md'
```

Expected: нет production-вхождений; допустимы только утверждения об отсутствии в архитектурном тесте, если они нужны.

- [ ] **Step 7: Запустить core tests и type-check**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataAttribute metadata/commonObjects/metadataTabularSection metadata/commonObjects/metadataRegisterAttribute metadata/appliedObjects metadata/validation/schemaRegistry.test.ts
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 8: Зафиксировать архитектурный договор**

```bash
git add packages/core/metadata/commonObjects packages/core/metadata/appliedObjects packages/core/metadata/validation packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
git commit -m "refactor: :recycle: удалить универсальные профили реквизитов"
```

---

### Task 10: Выполнить полную проверку и round-trip doc

**Files:**
- Modify only if tests expose a defect: production/test files from Tasks 1–9
- Do not modify: existing XML fixtures
- Diagnostic target: `/Users/nikita/git/round-trip-compact/cf/doc`

**Interfaces:**
- Consumes: завершённая реализация и базовая ревизия ветки.
- Produces: зелёные mutation/type/test/jscpd проверки и список оставшихся round-trip отклонений без группы owner defaults.

- [ ] **Step 1: Запустить mutation testing общих production-механизмов**

Run:

```bash
pnpm test:mutation -- --report current \
  packages/core/metadata/commonObjects/metadataRuleFragment.ts \
  packages/core/metadata/orchestration/property/resolvePropertyItemRule.ts \
  packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts \
  packages/core/metadata/commonObjects/metadataAttribute/fragments.ts \
  packages/core/metadata/commonObjects/metadataTabularSection/fragments.ts \
  packages/core/metadata/commonObjects/metadataRegisterAttribute/fragments.ts
```

Expected: PASS без `Timeout`, `RuntimeError` и `CompileError`. Для содержательного выжившего мутанта усилить тест того production-файла, который указан Stryker в `coveredBy`; эквивалентный мутант описать в итогах.

- [ ] **Step 2: Запустить полную проверку проекта**

Run:

```bash
pnpm type-check
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Проверить отсутствие новых дублей**

Run:

```bash
pnpm duplicates
```

Expected: PASS. Старые дубли из базовой ревизии не выводятся как ошибка; новые пары должны быть устранены переиспользованием fragments/helper до продолжения.

- [ ] **Step 4: Очистить только диагностический каталог doc**

Standing authorization пользователя разрешает очистку `cf/doc`:

```bash
git -C /Users/nikita/git/round-trip-compact restore --staged --worktree -- cf/doc
git -C /Users/nikita/git/round-trip-compact clean -fd -- cf/doc
```

Не затрагивать другие каталоги конфигураций.

- [ ] **Step 5: Запустить полный round-trip YAML конфигурации doc**

Из корня feature worktree выполнить:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
  NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc \
  ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: после исключения `Period`, `TopLevelParent`, `RowFilter` отсутствуют добавления:

- `Indexing`, `FullTextSearch`, `DataHistory` у обработок/отчёта;
- `FillFromFillingValue`, `FillValue` у top-level реквизитов обработок/отчёта;
- `LineNumberLength` у их табличных частей;
- search/history у вложенных реквизитов обработок/отчёта.

- [ ] **Step 6: Зафиксировать итоговую статистику**

В итоговом сообщении перечислить:

- число файлов и diff-групп round-trip после трёх согласованных исключений;
- какие тесты расширены/добавлены и уникальный договор каждого нового теста;
- mutation result;
- результат `pnpm type-check`, `pnpm test`, `pnpm duplicates`;
- подтверждение, что XML fixtures не изменены.

- [ ] **Step 7: Зафиксировать только реальные исправления проверки**

Если Steps 1–5 потребовали правок:

```bash
git add packages/core/metadata scripts package.json pnpm-lock.yaml .jscpd.json
git commit -m "test: :white_check_mark: усилить договоры правил владельцев"
```

Если правок нет, отдельный пустой коммит не создавать.
