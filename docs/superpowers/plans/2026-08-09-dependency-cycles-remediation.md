# Dependency Cycles Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить все 20 циклических production-компонент и оставить пустой cycle-baseline без изменения публичного поведения metadata-операций.

**Architecture:** Исправления идут от локального смешения деклараций и реализаций к развороту зависимостей между context, resourceTopology, workerPool, validation и projectState. Нейтральные слои объявляют узкие договоры; реализации подключаются через прямые адаптеры, расширяемые карты и внешнюю точку сборки.

**Tech Stack:** TypeScript 7, Node.js 26, Vitest 4, dependency-cruiser 18, pnpm 10.

## Global Constraints

- Исходная точка реализации: commit `9a2fdce1f`.
- Не изменять существующие XML-фикстуры.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры построителей правил.
- Не добавлять `as any` или `as unknown` вне именованного адаптера с отдельным тестом.
- Сохранять публичные пути импортов реэкспортами.
- Не принимать новый или выросший цикл; baseline обновлять только после уменьшения.
- После каждой задачи выполнять `pnpm test`, `pnpm test:architecture` и `pnpm duplicates -- --base 9a2fdce1f`.
- После перемещения файлов выполнять `pnpm architecture:cycle-baseline -- --accept-rewrite` только после зелёных focused-тестов.
- Каждый task завершать отдельным коммитом Conventional Commits с gitmoji на русском языке.

---

### Task 1: Локальные декларации и константы

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/constants.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/childObjects.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rootIO.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/types.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/types.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/xmlImportSources.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/helper.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/types.ts`
- Create: `tools/dependency-cruiser/test/local-cycle-boundaries.test.mjs`

**Interfaces:**
- Produces: `CONFIGURATION_XML_FILE` из `configuration/constants.ts`.
- Produces: `MetadataCatalogStandardAttributeNames` и `FormRulesTags` из соответствующих `rules.ts`.
- Produces: `MetadataMapItem`, `MetadataFieldsRulesItem`, `MetadataFieldsRules` из `metadataPath/helper.ts`, реэкспортированные старым `types.ts`.

- [ ] **Step 1: Добавить падающую архитектурную проверку**

```js
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const read = (path) => readFileSync(path, "utf8")

test("локальные декларации не импортируются из выведенных types.ts", () => {
  assert.doesNotMatch(read("packages/core/metadata/appliedObjects/configuration/childObjects.ts"), /from "\.\/rootIO"/u)
  assert.doesNotMatch(read("packages/core/metadata/appliedObjects/metadataCatalog/rules.ts"), /from "\.\/types"/u)
  assert.doesNotMatch(read("packages/core/metadata/forms/clientApplicationForm/rules.ts"), /from "\.\/types"/u)
  assert.doesNotMatch(read("packages/core/metadata/commonObjects/metadataPath/helper.ts"), /from "\.\/types"/u)
})
```

- [ ] **Step 2: Подтвердить исходное падение**

Run: `node --test tools/dependency-cruiser/test/local-cycle-boundaries.test.mjs`

Expected: FAIL на четырёх существующих обратных импортах.

- [ ] **Step 3: Перенести константы без изменения значений**

```ts
// configuration/constants.ts
export const CONFIGURATION_XML_FILE = "Configuration.xml"

// metadataCatalog/rules.ts и clientApplicationForm/rules.ts
export const MetadataCatalogStandardAttributeNames: Record<string, string> = {
  PredefinedDataName: "ИмяПредопределенныхДанных",
  Predefined: "Предопределенный",
  Ref: "Ссылка",
  DeletionMark: "ПометкаУдаления",
  IsFolder: "ЭтоГруппа",
  Owner: "Владелец",
  Parent: "Родитель",
  Description: "Наименование",
  Code: "Код",
}
export const FormRulesTags = { Form: "Form", Metadata: "Metadata" } as const
```

В `types.ts` сохранить прежние экспорты:

```ts
export { MetadataCatalogStandardAttributeNames } from "./rules"
export { FormRulesTags } from "./rules"
```

Все внутренние потребители импортируют значения прямо из `rules.ts` или `constants.ts`, не через `types.ts`.

- [ ] **Step 4: Развернуть зависимость metadataPath**

Перенести интерфейсы `MetadataMapItem`, `MetadataFieldsRulesItem` и `MetadataFieldsRules` в `helper.ts` перед функциями преобразования. В `types.ts` заменить локальные объявления на:

```ts
import type { MetadataFieldsRules } from "./helper"
export type { MetadataMapItem, MetadataFieldsRulesItem, MetadataFieldsRules } from "./helper"
```

- [ ] **Step 5: Проверить типы и поведение**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/configuration metadata/appliedObjects/metadataCatalog metadata/forms/clientApplicationForm metadata/commonObjects/metadataPath --no-isolate`

Expected: PASS; значения XML/YAML и публичные экспорты не изменились.

- [ ] **Step 6: Проверить архитектуру и сократить baseline**

Run: `node --test tools/dependency-cruiser/test/local-cycle-boundaries.test.mjs`

Run: `pnpm test:architecture`

Run: `pnpm architecture:cycle-baseline -- --accept-rewrite`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 9a2fdce1f`

Expected: компоненты `configuration`, `metadataCatalog`, `metadataPath` и `clientApplicationForm/rules.ts` отсутствуют в cycle-baseline; новых компонент нет.

- [ ] **Step 7: Зафиксировать изменение**

```bash
git add packages/core/metadata/appliedObjects/configuration packages/core/metadata/appliedObjects/metadataCatalog packages/core/metadata/forms/clientApplicationForm packages/core/metadata/commonObjects/metadataPath tools/dependency-cruiser/test/local-cycle-boundaries.test.mjs .dependency-cruiser-cycle-baseline.json
git commit -m "refactor: :recycle: отделить локальные декларации от типов"
```

---

### Task 2: Независимые contracts для парных циклов

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/syncStateContracts.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncStateBinary.ts`
- Create: `packages/core/metadata/validation/dataPath/formatContracts.ts`
- Modify: `packages/core/metadata/validation/dataPath/finalizationPredicate.ts`
- Modify: `packages/core/metadata/validation/dataPath/formatter.ts`
- Create: `packages/core/xml/import/contracts.ts`
- Modify: `packages/core/xml/import/importer.ts`
- Modify: `packages/core/xml/import/saxesParser.ts`
- Create: `packages/platform/src/sessions/contracts.ts`
- Modify: `packages/platform/src/sessions/manager.ts`
- Modify: `packages/platform/src/sessions/nodeRuntime.ts`
- Modify: `tools/dependency-cruiser/test/local-cycle-boundaries.test.mjs`

**Interfaces:**
- Produces: `XmlSyncState`, `XmlSyncStateDiff`, `DataPathFormatDirection`, `ImportContentFromXMLOptions`, `PlatformSessionManagerDependencies` из leaf contracts.
- Preserves: прежние type-экспорты из `syncState.ts`, `formatter.ts`, `importer.ts` и `manager.ts`.

- [ ] **Step 1: Расширить падающую архитектурную проверку**

```js
test("парные реализации зависят от leaf contracts", () => {
  assert.doesNotMatch(read("packages/core/metadata/appliedObjects/configuration/syncStateBinary.ts"), /from "\.\/syncState"/u)
  assert.doesNotMatch(read("packages/core/metadata/validation/dataPath/finalizationPredicate.ts"), /from "\.\/formatter"/u)
  assert.doesNotMatch(read("packages/core/xml/import/saxesParser.ts"), /from "\.\/importer"/u)
  assert.doesNotMatch(read("packages/platform/src/sessions/nodeRuntime.ts"), /from "\.\/manager"/u)
})
```

- [ ] **Step 2: Подтвердить исходное падение**

Run: `node --test tools/dependency-cruiser/test/local-cycle-boundaries.test.mjs`

Expected: FAIL на каждой из четырёх пар.

- [ ] **Step 3: Перенести договоры и сохранить реэкспорты**

Каждый новый файл содержит дословно перенесённые type/interface объявления. Старые владельцы экспортируют их обратно:

```ts
export type { XmlSyncState, XmlSyncStateDiff } from "./syncStateContracts"
export type { DataPathFormatDirection } from "./formatContracts"
export type { ImportContentFromXMLOptions } from "./contracts"
export type { PlatformSessionManagerDependencies } from "./contracts"
```

Реализации импортируют contract напрямую.

- [ ] **Step 4: Проверить пакеты**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/platform type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/configuration/syncState.test.ts metadata/validation/dataPath/formatter.test.ts xml/import --no-isolate`

Run: `pnpm --filter @nkdk/platform test`

Expected: PASS.

- [ ] **Step 5: Проверить архитектуру, baseline и дубли**

Run: `node --test tools/dependency-cruiser/test/local-cycle-boundaries.test.mjs`

Run: `pnpm test:architecture`

Run: `pnpm architecture:cycle-baseline -- --accept-rewrite`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 9a2fdce1f`

Expected: четыре двухмодульные компоненты отсутствуют.

- [ ] **Step 6: Зафиксировать изменение**

```bash
git add packages/core/metadata/appliedObjects/configuration packages/core/metadata/validation/dataPath packages/core/xml/import packages/platform/src/sessions tools/dependency-cruiser/test/local-cycle-boundaries.test.mjs .dependency-cruiser-cycle-baseline.json
git commit -m "refactor: :recycle: выделить договоры парных модулей"
```

---

### Task 3: Helpers элементов и ядро преобразования BaseForm

**Files:**
- Modify: `packages/core/metadata/forms/elements/autoCommandBar/helper.ts`
- Modify: `packages/core/metadata/forms/elements/contextMenu/helper.ts`
- Modify: `packages/core/metadata/forms/elements/searchControlAddition/helper.ts`
- Modify: `packages/core/metadata/forms/elements/viewStatusAddition/helper.ts`
- Modify: `packages/core/metadata/forms/elements/extendedTooltip/helper.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/convertYAMLToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseForm.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Modify: `tools/dependency-cruiser/test/local-cycle-boundaries.test.mjs`

**Interfaces:**
- Produces: `convertClientApplicationFormYAMLToXMLCore(params): DirectClientApplicationFormXMLResult` без импорта `baseForm.ts` и без регистрации type rule.
- Preserves: `convertClientApplicationFormFromYAMLToXML` из `fromYAMLToXML.ts` как реэкспорт ядра.

- [ ] **Step 1: Добавить проверки границ**

```js
test("helpers элементов не импортируют выведенные types.ts", () => {
  for (const element of ["autoCommandBar", "contextMenu", "searchControlAddition", "viewStatusAddition", "extendedTooltip"]) {
    assert.doesNotMatch(read(`packages/core/metadata/forms/elements/${element}/helper.ts`), /from "\.\/types"/u)
  }
})

test("baseForm использует независимое ядро", () => {
  assert.doesNotMatch(read("packages/core/metadata/forms/clientApplicationForm/baseForm.ts"), /from "\.\/fromYAMLToXML"/u)
  assert.doesNotMatch(read("packages/core/metadata/forms/clientApplicationForm/convertYAMLToXML.ts"), /from "\.\/baseForm"/u)
})
```

- [ ] **Step 2: Подтвердить исходное падение**

Run: `node --test tools/dependency-cruiser/test/local-cycle-boundaries.test.mjs`

Expected: FAIL; `convertYAMLToXML.ts` ещё отсутствует, helpers импортируют `types.ts`.

- [ ] **Step 3: Заменить типы helpers структурными договорами**

```ts
type ContentRecord = Readonly<Record<string, unknown>>
type ContentWithChildren = ContentRecord & { readonly childItems?: readonly unknown[] }
type AutoCommandBarContent = ContentWithChildren & { readonly autofill?: boolean }
```

Каждый helper объявляет только нужный локальный тип и сохраняет прежнюю функцию `isHasContent`. Имена `get*Name` продолжают принимать `{ name: string }`.

- [ ] **Step 4: Выделить ядро формы**

Перенести `ConvertClientApplicationFormFromYAMLToXMLParams`, `DirectClientApplicationFormXMLResult`, `convertClientApplicationFormFromYAMLToXML` и её чистые helpers в `convertYAMLToXML.ts`. Экспорт ядра:

```ts
export function convertClientApplicationFormYAMLToXMLCore(
  params: ConvertClientApplicationFormFromYAMLToXMLParams,
): DirectClientApplicationFormXMLResult
```

В `baseForm.ts` импортировать ядро. В `fromYAMLToXML.ts` оставить namespaces, `registerTypeRule`, `requireBaseConfigurationIndex` и совместимый wrapper:

```ts
export const convertClientApplicationFormFromYAMLToXML =
  convertClientApplicationFormYAMLToXMLCore
export type {
  ConvertClientApplicationFormFromYAMLToXMLParams,
  DirectClientApplicationFormXMLResult,
} from "./convertYAMLToXML"
```

- [ ] **Step 5: Добавить регрессионный тест единого ядра**

```ts
it("public converter and BaseForm use the same conversion core", () => {
  const direct = convertClientApplicationFormFromYAMLToXML(params)
  const core = convertClientApplicationFormYAMLToXMLCore(params)
  expect(direct).toEqual(core)
})
```

- [ ] **Step 6: Выполнить проверки**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/forms/elements metadata/forms/clientApplicationForm/baseForm.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts --no-isolate`

Run: `node --test tools/dependency-cruiser/test/local-cycle-boundaries.test.mjs`

Run: `pnpm test:architecture`

Run: `pnpm architecture:cycle-baseline -- --accept-rewrite`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 9a2fdce1f`

Expected: helper-компоненты и цикл `baseForm/fromYAMLToXML` отсутствуют.

- [ ] **Step 7: Зафиксировать изменение**

```bash
git add packages/core/metadata/forms tools/dependency-cruiser/test/local-cycle-boundaries.test.mjs .dependency-cruiser-cycle-baseline.json
git commit -m "refactor: :recycle: отделить helpers и ядро преобразования формы"
```

---

### Task 4: Владение регистрацией GroupItemAuto и ChildFormNames

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemAuto/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemAuto/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemAuto/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemAuto/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemAuto/index.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/forms/index.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/registerChildFormNames.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts`
- Create: `tools/dependency-cruiser/test/registration-cycle-boundaries.test.mjs`

**Interfaces:**
- Produces: idempotent `registerChildFormNamesAdapter()` рядом с forms.
- Preserves: type-rule handlers `GroupItemAuto/importFromXML`, `importFromYAML`, `exportToYAML` и `ChildFormNames/syncExternalFromXML`.

- [ ] **Step 1: Добавить падающую проверку регистрации**

```js
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("types.ts не выполняет runtime-регистрацию", () => {
  const source = readFileSync("packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemAuto/types.ts", "utf8")
  assert.doesNotMatch(source, /registerTypeRule/u)
  assert.doesNotMatch(source, /from "\.\/(?:fromXML|fromYAML|toYAML)"/u)
})

test("commonObjects не импортирует form adapter", () => {
  const source = readFileSync("packages/core/metadata/commonObjects/index.ts", "utf8")
  assert.doesNotMatch(source, /childFormNames\/syncExternalFromXML/u)
})
```

- [ ] **Step 2: Подтвердить исходное падение**

Run: `node --test tools/dependency-cruiser/test/registration-cycle-boundaries.test.mjs`

Expected: FAIL на `types.ts` и `commonObjects/index.ts`.

- [ ] **Step 3: Перенести регистрации GroupItemAuto к реализациям**

В конец каждого преобразователя добавить соответствующий `registerTypeRule`. `index.ts` явно импортирует:

```ts
import "./fromXML"
import "./fromXMLToYAML"
import "./fromYAML"
import "./toYAML"
```

Из `types.ts` удалить runtime imports и вызовы регистрации.

- [ ] **Step 4: Перенести ChildFormNames adapter в forms**

`registerChildFormNames.ts` импортирует существующую функцию `syncChildFormNamesFromXML` и регистрирует её ровно один раз:

```ts
let registered = false
export function registerChildFormNamesAdapter(): void {
  if (registered) return
  registered = true
  registerTypeRule("ChildFormNames", "syncExternalFromXML", syncChildFormNamesFromXML)
}
```

`forms/index.ts` вызывает функцию внутри `registerForms()`. `commonObjects/index.ts` больше не импортирует adapter. `convertFromXML.ts` удаляет `import "../../commonObjects"`; порядок гарантирует `registerCoreMetadata()`.

- [ ] **Step 5: Проверить регистрацию и round-trip**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/structureItemGroup metadata/commonObjects/childFormNames metadata/forms/clientApplicationForm --no-isolate`

Run: `node --test tools/dependency-cruiser/test/registration-cycle-boundaries.test.mjs`

Run: `pnpm test:architecture`

Run: `pnpm architecture:cycle-baseline -- --accept-rewrite`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 9a2fdce1f`

Expected: компоненты GroupItemAuto и ChildFormNames отсутствуют; повторный `registerCoreMetadata()` остаётся безопасным.

- [ ] **Step 6: Зафиксировать изменение**

```bash
git add packages/core/metadata/commonObjects packages/core/metadata/forms tools/dependency-cruiser/test/registration-cycle-boundaries.test.mjs .dependency-cruiser-cycle-baseline.json
git commit -m "refactor: :recycle: перенести регистрацию к владельцам реализаций"
```

---

### Task 5: Рекурсивные ядра MetadataValue

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fixedArray/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.ts`
- Create: `tools/dependency-cruiser/test/metadata-value-cycle-boundary.test.mjs`

**Interfaces:**
- Produces: главные функции и функции составных значений из одного ядра каждого направления.
- Preserves: старые пути `fixedArray/*` и `formChoiceList/*` как явные реэкспорты.

- [ ] **Step 1: Добавить падающую проверку направления импортов**

```js
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

for (const direction of ["fromXML", "fromYAML", "toXML", "toYAML"]) {
  test(`${direction}: ядро не импортирует совместимые leaf-файлы`, () => {
    const source = readFileSync(`packages/core/metadata/commonObjects/metadataValue/${direction}.ts`, "utf8")
    assert.doesNotMatch(source, new RegExp(`from "\\./(?:fixedArray|formChoiceList)/${direction}"`, "u"))
  })
}
```

- [ ] **Step 2: Подтвердить исходное падение**

Run: `node --test tools/dependency-cruiser/test/metadata-value-cycle-boundary.test.mjs`

Expected: четыре теста FAIL.

- [ ] **Step 3: Перенести составные преобразователи в ядра**

Для каждого направления перенести тела `import/exportFixedArray*` и `import/exportFormChoiceList*` в главный файл ниже основной функции. Рекурсивный вызов остаётся прямым вызовом функции того же модуля.

Leaf-файлы содержат только реэкспорт:

```ts
export { importFixedArrayFromXML } from "../fromXML"
export { importFormChoiceListFromXML } from "../fromXML"
```

Для YAML/XML export применить тот же шаблон с существующими именами функций.

- [ ] **Step 4: Проверить рекурсивные значения**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/metadataValue --no-isolate`

Expected: PASS для вложенных fixed arrays, form choice lists, `undefined`, `xsi:nil` и explicit YAML.

- [ ] **Step 5: Проверить архитектуру и baseline**

Run: `node --test tools/dependency-cruiser/test/metadata-value-cycle-boundary.test.mjs`

Run: `pnpm test:architecture`

Run: `pnpm architecture:cycle-baseline -- --accept-rewrite`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 9a2fdce1f`

Expected: четыре MetadataValue-компоненты отсутствуют.

- [ ] **Step 6: Зафиксировать изменение**

```bash
git add packages/core/metadata/commonObjects/metadataValue tools/dependency-cruiser/test/metadata-value-cycle-boundary.test.mjs .dependency-cruiser-cycle-baseline.json
git commit -m "refactor: :recycle: собрать рекурсивные преобразователи MetadataValue"
```

---

### Task 6: Разделение ChildItems rules/types и прямой context import

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/childItems/rules.ts`
- Modify: `packages/core/metadata/forms/commonObjects/childItems/types.ts`
- Modify: `packages/core/metadata/forms/elements/autoCommandBar/rules.ts`
- Modify: `packages/core/metadata/forms/elements/buttonGroup/rules.ts`
- Modify: `packages/core/metadata/forms/elements/columnGroup/rules.ts`
- Modify: `packages/core/metadata/forms/elements/commandBar/rules.ts`
- Modify: `packages/core/metadata/forms/elements/contextMenu/rules.ts`
- Modify: `packages/core/metadata/forms/elements/page/rules.ts`
- Modify: `packages/core/metadata/forms/elements/pages/rules.ts`
- Modify: `packages/core/metadata/forms/elements/popup/rules.ts`
- Modify: `packages/core/metadata/forms/elements/usualGroup/rules.ts`
- Modify: `packages/core/metadata/context/helpers.ts`
- Create: `tools/dependency-cruiser/test/child-items-cycle-boundary.test.mjs`

**Interfaces:**
- Produces: `commandBarChildItemsRule`, `groupChildItemsRule`, `pagesChildItemsRule`, `tableChildItemsRule` из `childItems/rules.ts`.
- Preserves: реэкспорт построителей из `childItems/types.ts`.

- [ ] **Step 1: Добавить падающую архитектурную проверку**

```js
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("childItems rules не знает конкретные элементы", () => {
  const source = readFileSync("packages/core/metadata/forms/commonObjects/childItems/rules.ts", "utf8")
  assert.doesNotMatch(source, /forms\/elements|\.\.\/\.\.\/elements/u)
})

test("context helper не импортирует orchestration barrel", () => {
  const source = readFileSync("packages/core/metadata/context/helpers.ts", "utf8")
  assert.doesNotMatch(source, /from "\.\.\/orchestration"/u)
})
```

- [ ] **Step 2: Подтвердить исходное падение**

Run: `node --test tools/dependency-cruiser/test/child-items-cycle-boundary.test.mjs`

Expected: FAIL, потому что `rules.ts` ещё не существует и helper использует barrel.

- [ ] **Step 3: Перенести построители child items**

`rules.ts` содержит только `defineWidePropertyRule`, `PropertyRule` и четыре интерфейса/функции построения. `types.ts` импортирует и реэкспортирует их:

```ts
export {
  commandBarChildItemsRule,
  groupChildItemsRule,
  pagesChildItemsRule,
  tableChildItemsRule,
} from "./rules"
```

Все element `rules.ts` импортируют построители прямо из `childItems/rules.ts`.

- [ ] **Step 4: Исправить context helper**

```ts
import type { MetadataItemType } from "../orchestration/metadataItem/registry"
```

Другие импорты `context/helpers.ts` не менять.

- [ ] **Step 5: Проверить формы и архитектуру**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/forms metadata/context/helpers.test.ts --no-isolate`

Run: `node --test tools/dependency-cruiser/test/child-items-cycle-boundary.test.mjs`

Run: `pnpm test:architecture`

Run: `pnpm architecture:cycle-baseline -- --accept-rewrite`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 9a2fdce1f`

Expected: компоненты из 28 и 9 модулей отсутствуют.

- [ ] **Step 6: Зафиксировать изменение**

```bash
git add packages/core/metadata/forms packages/core/metadata/context/helpers.ts tools/dependency-cruiser/test/child-items-cycle-boundary.test.mjs .dependency-cruiser-cycle-baseline.json
git commit -m "refactor: :recycle: разделить правила и типы дочерних элементов"
```

---

### Task 7: Нейтральный context и договор локальных фактов

**Files:**
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/configurationIndex/collector/context.ts`
- Modify: `packages/core/metadata/configurationIndex/exportRuntime.ts`
- Modify: `packages/core/metadata/orchestration/formElement/types.ts`
- Modify: `packages/core/metadata/orchestration/yamlImportError.ts`
- Create: `packages/core/metadata/orchestration/property/localFacts.ts`
- Modify: `packages/core/metadata/orchestration/property/importYamlTypes.ts`
- Modify: `packages/core/metadata/project/localIndexes.ts`
- Modify: `tools/dependency-cruiser/test/context-boundary.test.mjs`

**Interfaces:**
- Produces: расширения `FromXMLConfigurationContext.configurationIndex`, `ToXMLConfigurationContext.configurationIndex`, form-element и YAML diagnostic context у владельцев типов.
- Produces: `LocalYamlFact`, `LocalMetadataFactsWriter`, `LocalMetadataIndex`, `LocalIndexes`, `LocalIndexesCollector` из `orchestration/property/localFacts.ts`.

- [ ] **Step 1: Усилить падающую проверку context**

```js
test("configuration context не импортирует владельцев расширений", () => {
  const source = readFileSync("packages/core/metadata/context/types.ts", "utf8")
  assert.doesNotMatch(source, /configurationIndex\/(?:collector\/context|exportRuntime)/u)
  assert.doesNotMatch(source, /orchestration\/(?:formElement\/types|yamlImportError)/u)
})

test("property import contracts не импортируют project localIndexes", () => {
  const source = readFileSync("packages/core/metadata/orchestration/property/importYamlTypes.ts", "utf8")
  assert.doesNotMatch(source, /project\/localIndexes/u)
})
```

- [ ] **Step 2: Подтвердить исходное падение**

Run: `node --test tools/dependency-cruiser/test/context-boundary.test.mjs`

Expected: FAIL на перечисленных imports.

- [ ] **Step 3: Подключить context-поля через declaration merging**

В файлах-владельцах добавить расширения:

```ts
declare module "../../context/types" {
  interface FromXMLConfigurationContext {
    configurationIndex?: ConfigurationIndexCollectionContext
  }
  interface ToXMLConfigurationContext {
    readonly configurationIndex?: ConfigurationIndexExportRuntime
  }
}
```

`formElement/types.ts` дополняет поля с `ElementType` и `ElementXMLWithoutId`; `yamlImportError.ts` дополняет `FormimportFromYAMLContext.diagnostics`. Из `context/types.ts` удалить обратные imports, сохранив базовые интерфейсы.

- [ ] **Step 4: Вынести договор локальных фактов**

`localFacts.ts` получает интерфейсы, сейчас разделённые между `importYamlTypes.ts` и `project/localIndexes.ts`. Он импортирует только нейтральные `PropertyRule`, `YamlPath`, `YamlDiagnosticLocation`, `MetadataTargetOwner` и `FormDataPathIndex`.

`project/localIndexes.ts` реализует `LocalIndexesCollector` и реэкспортирует публичные типы:

```ts
export type {
  LocalMetadataIndex,
  LocalIndexes,
  LocalIndexesCollector,
} from "../orchestration/property/localFacts"
```

`importYamlTypes.ts` импортирует договор из `./localFacts`, не из project.

- [ ] **Step 5: Проверить context и прямой import**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/context metadata/configurationIndex metadata/project/localIndexes.test.ts metadata/orchestration/property --no-isolate`

Run: `node --test tools/dependency-cruiser/test/context-boundary.test.mjs`

Run: `pnpm test:architecture`

Run: `pnpm architecture:cycle-baseline -- --accept-rewrite`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 9a2fdce1f`

Expected: context не имеет обратных импортов, а компонента из 23 модулей уменьшается без новых циклов.

- [ ] **Step 6: Зафиксировать изменение**

```bash
git add packages/core/metadata/context packages/core/metadata/configurationIndex packages/core/metadata/orchestration packages/core/metadata/project/localIndexes.ts tools/dependency-cruiser/test/context-boundary.test.mjs .dependency-cruiser-cycle-baseline.json
git commit -m "refactor: :recycle: отделить расширения context и локальные факты"
```

---

### Task 8: Самостоятельный ResourceTopology

**Files:**
- Modify: `packages/core/metadata/resourceTopology/types.ts`
- Modify: `packages/core/metadata/resourceTopology/compiler.ts`
- Create: `packages/core/metadata/resourceTopology/providerRegistry.ts`
- Create: `packages/core/metadata/resourceTopology/metadataProvider.ts`
- Modify: `packages/core/metadata/resourceTopology/registry.ts`
- Modify: `packages/core/metadata/project/projectSpecRegistry.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/xmlAreas.ts`
- Modify: `packages/core/metadata/register.ts`
- Create: `tools/dependency-cruiser/test/resource-topology-cycle-boundary.test.mjs`

**Interfaces:**
- Produces: `MetadataResourceTopologyTypeMap`, `MetadataResourceDeclaration` и `CompiledMetadataResourceTopology` без импорта `MetadataItemRule`.
- Produces: `registerMetadataResourceTopologyProvider(provider)` и `getMetadataResourceTopology()` из нейтрального registry.
- Produces: metadata adapter, который единственный импортирует project specs и property rules.

- [ ] **Step 1: Добавить падающую проверку нижнего слоя**

```js
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

for (const file of ["types.ts", "compiler.ts", "providerRegistry.ts"]) {
  test(`resourceTopology/${file} не импортирует project или orchestration`, () => {
    const source = readFileSync(`packages/core/metadata/resourceTopology/${file}`, "utf8")
    assert.doesNotMatch(source, /\.\.\/(?:project|orchestration)\//u)
  })
}
```

- [ ] **Step 2: Подтвердить исходное падение**

Run: `node --test tools/dependency-cruiser/test/resource-topology-cycle-boundary.test.mjs`

Expected: FAIL; provider-файл отсутствует, `types.ts` и `compiler.ts` импортируют верхние слои.

- [ ] **Step 3: Связать item rule через расширяемую карту**

```ts
export interface MetadataResourceTopologyTypeMap {}

export type MetadataResourceItemRule =
  MetadataResourceTopologyTypeMap extends { itemRule: infer ItemRule }
    ? ItemRule
    : never

export interface MetadataContentDeclaration {
  readonly kind: "content"
  readonly itemRule: MetadataResourceItemRule
  readonly projectPattern: string
  readonly role: "configuration" | "properties" | "fileItem"
  readonly required: boolean
  readonly repeatable: boolean
  readonly compositionImpact: "none" | "configurationComposition"
  readonly source: MetadataResourceSource
}

export type MetadataResourceDeclaration =
  | MetadataContentDeclaration
  | MetadataXmlDocumentDeclaration
  | MetadataExternalFileDeclaration
  | MetadataIgnoredPathDeclaration
  | MetadataChildCollectionDeclaration

export interface MetadataResourceTopologySpec {
  readonly resources?: readonly MetadataResourceDeclaration[]
}

export function compileMetadataResourceTopology(
  specs: readonly MetadataResourceTopologySpec[],
): CompiledMetadataResourceTopology
```

`metadataProvider.ts` дополняет карту из верхнего слоя:

```ts
declare module "./types" {
  interface MetadataResourceTopologyTypeMap {
    itemRule: MetadataItemRule
  }
}
```

Compiler больше не импортирует `RegisteredProjectSpec`.

- [ ] **Step 4: Ввести provider registry**

```ts
export interface MetadataResourceTopologyProvider {
  revision(): string
  compile(rootRule?: MetadataResourceItemRule): CompiledMetadataResourceTopology
}

export function registerMetadataResourceTopologyProvider(
  provider: MetadataResourceTopologyProvider,
): void

export function getMetadataResourceTopology(): CompiledMetadataResourceTopology
```

Повторная регистрация другого provider выбрасывает `Metadata resource topology provider уже зарегистрирован`; тестовый reset экспортируется только с суффиксом `ForTests`.

- [ ] **Step 5: Перенести знание rules/project в adapter**

`metadataProvider.ts` содержит текущие `describePropertyResourceTopology`, `describeProjectSpecResourceTopology` и обход rule. Он создаёт provider на основе `getRegisteredProjectSpecs`, `getTypeRule` и revisions. `register.ts` регистрирует provider после common objects/forms/applied objects.

`xmlAreas.ts` импортирует только `getMetadataResourceTopology` из нейтрального registry. `resourceTopology/registry.ts` остаётся совместимым facade и реэкспортирует функции adapter/provider без использования его нижними модулями.

- [ ] **Step 6: Проверить topology contracts и операции**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/resourceTopology metadata/project/projectSpecRegistry.test.ts metadata/orchestration/appliedObject --no-isolate`

Run: `node --test tools/dependency-cruiser/test/resource-topology-cycle-boundary.test.mjs`

Run: `pnpm test:architecture`

Run: `pnpm architecture:cycle-baseline -- --accept-rewrite`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 9a2fdce1f`

Expected: компонента из 23 модулей полностью исчезает; topology snapshots совпадают с прежними.

- [ ] **Step 7: Зафиксировать изменение**

```bash
git add packages/core/metadata/resourceTopology packages/core/metadata/project/projectSpecRegistry.ts packages/core/metadata/orchestration/appliedObject/xmlAreas.ts packages/core/metadata/register.ts tools/dependency-cruiser/test/resource-topology-cycle-boundary.test.mjs .dependency-cruiser-cycle-baseline.json
git commit -m "refactor: :recycle: отделить ResourceTopology от верхних слоёв"
```

---

### Task 9: Расширяемый договор операций WorkerPool

**Files:**
- Modify: `packages/core/metadata/workerPool/types.ts`
- Create: `packages/core/metadata/workerPool/operationRegistry.ts`
- Create: `packages/core/metadata/workerPool/registerOperations.ts`
- Modify: `packages/core/metadata/workerPool/worker.ts`
- Create: `packages/core/metadata/project/workerOperation.types.ts`
- Create: `packages/core/metadata/project/registerWorkerOperation.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/workerPool/projectQueries.ts`
- Create: `packages/core/metadata/workerPool/operationRegistry.test.ts`
- Create: `tools/dependency-cruiser/test/worker-pool-cycle-boundary.test.mjs`

**Interfaces:**
- Produces: `MetadataWorkerOperationTypeMap`, вычисляемые unions команд/результатов и runtime handler registry.
- Removes: imports `project`, `fullSyncToXml` и concrete import contracts из `workerPool/types.ts`.

- [ ] **Step 1: Добавить падающие проверки типов и границы**

```ts
declare module "../workerPool/types" {
  interface MetadataWorkerOperationTypeMap {
    validation: {
      command: { readonly kind: "validation"; readonly task: PreparedYamlProjectWorkerTask }
      result: PreparedYamlProjectWorkerTaskResult
    }
  }
}
```

```js
test("workerPool types не импортирует реализации операций", () => {
  const source = readFileSync("packages/core/metadata/workerPool/types.ts", "utf8")
  assert.doesNotMatch(source, /\.\.\/(?:project|fullSyncToXml|importFromXml)\//u)
})
```

- [ ] **Step 2: Подтвердить исходное падение**

Run: `node --test tools/dependency-cruiser/test/worker-pool-cycle-boundary.test.mjs`

Run: `pnpm --filter @nkdk/core type-check`

Expected: boundary FAIL; расширяемая карта ещё не объявлена.

- [ ] **Step 3: Ввести type map**

```ts
export interface MetadataWorkerOperationTypeMap {
  probe: {
    command: MetadataWorkerProbeCommand
    result: MetadataWorkerProbeResult
  }
}

export type MetadataWorkerOperationCommand =
  MetadataWorkerOperationTypeMap[keyof MetadataWorkerOperationTypeMap]["command"]
export type MetadataWorkerOperationResult =
  MetadataWorkerOperationTypeMap[keyof MetadataWorkerOperationTypeMap]["result"]
```

Конкретные modules дополняют карту через declaration merging. Старые имена union-типов сохраняются.

- [ ] **Step 4: Добавить runtime registry**

```ts
export type MetadataWorkerOperationHandler<K extends keyof MetadataWorkerOperationTypeMap> =
  (command: MetadataWorkerOperationTypeMap[K]["command"], state: MetadataWorkerPersistentState) =>
    Promise<MetadataWorkerOperationTypeMap[K]["result"]>

export function registerMetadataWorkerOperation<K extends keyof MetadataWorkerOperationTypeMap>(
  kind: K,
  handler: MetadataWorkerOperationHandler<K>,
): void

export function runRegisteredMetadataWorkerOperation(
  command: MetadataWorkerOperationCommand,
  state: MetadataWorkerPersistentState,
): Promise<MetadataWorkerOperationResult>
```

Повторный ключ завершается ошибкой
`Worker operation уже зарегистрирована: ${String(kind)}`, неизвестный —
`Worker operation не зарегистрирована: ${command.kind}`. Внутреннее
стирание generic handler выполняется одной функцией
`eraseMetadataWorkerOperationHandler` и покрывается тестом соответствия
`kind`.

- [ ] **Step 5: Зарегистрировать четыре реализации и упростить worker**

`registerOperations.ts` импортирует registration-модули validation, import, fullSync и projectQuery. `worker.ts` вызывает `registerMetadataWorkerOperations()` при инициализации и заменяет concrete switch на lookup registry. Reset hooks для import/fullSync регистрируются рядом с операциями и вызываются registry при `resetOperation`.

- [ ] **Step 6: Проверить registry и worker protocol**

Run: `pnpm --filter @nkdk/core exec vitest run metadata/workerPool/operationRegistry.test.ts metadata/workerPool/worker.test.ts metadata/project/preparedYamlProjectWorker.test.ts metadata/importFromXml/worker.test.ts metadata/fullSyncToXml/worker.test.ts --no-isolate`

Run: `pnpm --filter @nkdk/core type-check`

Run: `node --test tools/dependency-cruiser/test/worker-pool-cycle-boundary.test.mjs`

Run: `pnpm test:architecture`

Run: `pnpm architecture:cycle-baseline -- --accept-rewrite`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 9a2fdce1f`

Expected: workerPool types не достигают конкретных operations; protocol tests проходят.

- [ ] **Step 7: Зафиксировать изменение**

```bash
git add packages/core/metadata/workerPool packages/core/metadata/project packages/core/metadata/importFromXml/worker.ts packages/core/metadata/fullSyncToXml/worker.ts tools/dependency-cruiser/test/worker-pool-cycle-boundary.test.mjs .dependency-cruiser-cycle-baseline.json
git commit -m "refactor: :recycle: расширить договор операций workerPool"
```

---

### Task 10: Leaf contracts ProjectState и validation adapter

**Files:**
- Create: `packages/core/metadata/projectState/contracts/fileIdentity.ts`
- Create: `packages/core/metadata/projectState/contracts/readToken.ts`
- Create: `packages/core/metadata/projectState/contracts/fileUpdate.ts`
- Create: `packages/core/metadata/projectState/contracts/dependencyValidation.ts`
- Create: `packages/core/metadata/diagnostics/types.ts`
- Modify: `packages/core/metadata/validation/types.ts`
- Modify: `packages/core/metadata/projectState/contracts.ts`
- Modify: `packages/core/metadata/projectState/fileUpdate.ts`
- Modify: `packages/core/metadata/projectState/readSession.ts`
- Move: `packages/core/metadata/projectState/dependencyValidation.ts` to `packages/core/metadata/validation/projectStateDependencyValidation.ts`
- Move: `packages/core/metadata/projectState/dependencyValidation.test.ts` to `packages/core/metadata/validation/projectStateDependencyValidation.test.ts`
- Modify: `packages/core/metadata/projectState/binary/store.ts`
- Modify: `packages/core/metadata/projectState/binary/readSession.ts`
- Modify: `packages/core/metadata/projectState/binary/diagnosticBatches.ts`
- Modify: `packages/core/metadata/projectState/index.ts`
- Create: `tools/dependency-cruiser/test/project-state-cycle-boundary.test.mjs`

**Interfaces:**
- Produces: leaf `ProjectStateReadToken`, file identity/update types и `ProjectStateQueryPort` без imports реализации.
- Produces: `ProjectStateDependencyValidator` с методами readiness, references, owners, dependencies и data-path resolution.
- Produces: `createProjectStateDependencyValidator()` в validation.
- Produces: нейтральные `Diagnostic`, `DiagnosticSeverity` и `DiagnosticSource` из `metadata/diagnostics/types.ts`, реэкспортированные `validation/types.ts`.

- [ ] **Step 1: Добавить падающую проверку contracts**

```js
test("projectState leaf contracts не импортируют реализации", () => {
  for (const file of ["fileIdentity.ts", "readToken.ts", "fileUpdate.ts", "dependencyValidation.ts"]) {
    const source = readFileSync(`packages/core/metadata/projectState/contracts/${file}`, "utf8")
    assert.doesNotMatch(source, /\.\.\/(?:binary|fileUpdate|readSession|service|store)/u)
    assert.doesNotMatch(source, /\.\.\/\.\.\/validation/u)
  }
})
```

- [ ] **Step 2: Подтвердить исходное падение**

Run: `node --test tools/dependency-cruiser/test/project-state-cycle-boundary.test.mjs`

Expected: FAIL, потому что leaf-файлы ещё отсутствуют.

- [ ] **Step 3: Разделить contracts и сохранить facade**

Перенести структуры без изменения полей. `contracts.ts` становится только совместимым facade:

```ts
export * from "./contracts/fileIdentity"
export * from "./contracts/readToken"
export * from "./contracts/fileUpdate"
export * from "./contracts/dependencyValidation"
```

Внутренние модули импортируют минимальный leaf, не facade.

- [ ] **Step 4: Определить validation port**

```ts
export interface ProjectStateDependencyValidator {
  readReadiness(params: ProjectStateReadinessParams): ProjectStateDependencyReadiness
  resolveDataPaths(params: ProjectStateResolveDataPathsParams): readonly ProjectStateResolvedDataPathProjection[]
  validateReferences(params: ProjectStateReferenceValidationParams): readonly Diagnostic[]
  validateOwners(params: ProjectStateOwnerValidationParams): readonly Diagnostic[]
  validateDependencies(params: ProjectStateDependencyValidationParams): readonly Diagnostic[]
}
```

`ProjectStateResolvedDataPathProjection` содержит только `requestId`,
`componentPath`, `projectPath`, `resolvedSegments`, `sourceOwner` и
`sourceFieldName`; validation преобразует внутренний `ResolvedDataPathTarget` в
эту проекцию. Параметры используют только `ProjectStateQueryPort` и contract
records. Реализация переносится в validation и экспортирует
`createProjectStateDependencyValidator()`.

- [ ] **Step 5: Передавать validator в binary adapters**

`createBinaryProjectStateStore`, `openBinaryProjectStateReadSession` и `createProjectStateDiagnosticBatches` получают `dependencyValidator: ProjectStateDependencyValidator`. Прямые imports validation удаляются из projectState. Тесты создают validator через `createProjectStateDependencyValidator()` или передают stub.

- [ ] **Step 6: Проверить contracts и validation**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState/contracts.test.ts metadata/validation/projectStateDependencyValidation.test.ts metadata/projectState/binary --no-isolate`

Run: `node --test tools/dependency-cruiser/test/project-state-cycle-boundary.test.mjs`

Run: `pnpm test:architecture`

Run: `pnpm architecture:cycle-baseline -- --accept-rewrite`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 9a2fdce1f`

Expected: projectState contracts и binary adapters не импортируют validation; крупнейшая компонента уменьшается.

- [ ] **Step 7: Зафиксировать изменение**

```bash
git add packages/core/metadata/projectState packages/core/metadata/validation tools/dependency-cruiser/test/project-state-cycle-boundary.test.mjs .dependency-cruiser-cycle-baseline.json
git commit -m "refactor: :recycle: отделить договоры состояния от validation"
```

---

### Task 11: Внешняя сборка ProjectState и пустой cycle-baseline

**Files:**
- Create: `packages/core/metadata/projectState/refreshExecutor.ts`
- Modify: `packages/core/metadata/projectState/refresh.ts`
- Modify: `packages/core/metadata/projectState/service.ts`
- Create: `packages/core/metadata/projectState/createDefaultService.ts`
- Modify: `packages/core/metadata/projectState/index.ts`
- Modify: `packages/core/index.ts`
- Create: `packages/core/metadata/project/preparedYamlContracts.ts`
- Modify: `packages/core/metadata/project/preparedYamlProject.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/projectYamlCache.ts`
- Modify: `packages/core/metadata/validation/validationWorkerPoolTypes.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `packages/core/metadata/workerPool/handle.ts`
- Modify: `packages/core/metadata/fullSyncToXml/types.ts`
- Modify: `packages/core/metadata/project/componentState/types.ts`
- Modify: `packages/core/metadata/projectState/service.test.ts`
- Modify: `.dependency-cruiser-cycle-baseline.json`
- Modify: `tools/dependency-cruiser/test/project-state-cycle-boundary.test.mjs`

**Interfaces:**
- Produces: `ProjectStateRefreshExecutor` и `createPreparedYamlProjectRefreshExecutor(pool, context)`.
- Produces: низкоуровневый `createProjectStateService(options)` без concrete worker imports.
- Produces: `createDefaultProjectStateService()` как composition root; публичный `createProjectStateService` из `packages/core/index.ts` остаётся совместимым alias default-фабрики.

- [ ] **Step 1: Добавить падающую проверку направления**

```js
test("projectState service не импортирует project worker или worker handle", () => {
  const source = readFileSync("packages/core/metadata/projectState/service.ts", "utf8")
  assert.doesNotMatch(source, /\.\.\/project\/preparedYamlProjectWorkerPool/u)
  assert.doesNotMatch(source, /\.\.\/workerPool\/handle/u)
})

test("production graph не содержит циклов", () => {
  const baseline = JSON.parse(readFileSync(".dependency-cruiser-cycle-baseline.json", "utf8"))
  assert.deepEqual(baseline, { version: 1, components: [] })
})
```

- [ ] **Step 2: Подтвердить исходное падение**

Run: `node --test tools/dependency-cruiser/test/project-state-cycle-boundary.test.mjs`

Expected: FAIL на imports service и непустом baseline.

- [ ] **Step 3: Определить refresh executor**

```ts
export interface ProjectStateRefreshExecutor {
  begin(signal?: AbortSignal): ProjectStateRefreshOperation
  processFiles(
    batches: AsyncIterable<ProjectStateValidationFileBatch>,
    producer: Pick<ProjectStateRefreshHandle, "writeFragment" | "deleteFiles">,
    operation: ProjectStateRefreshOperation,
    projectDir: string,
  ): Promise<ProjectStateValidationStats>
  close(): Promise<void>
}
```

`refresh.ts` зависит от этого интерфейса. Adapter в project оборачивает `PreparedYamlProjectWorkerPool` и реализует методы через существующие `runProjectStateRefresh` и `createPreparedYamlValidationOperation`.

- [ ] **Step 4: Разделить низкоуровневый service и composition root**

`CreateProjectStateServiceOptions` требует готовые `workers`, `refreshExecutor`, `dependencyValidator` и writer factory; service больше не создаёт concrete defaults.

`createDefaultService.ts` импортирует:

```ts
const workers = createMetadataWorkerPoolHandle()
const pool = createPreparedYamlProjectWorkerPool({ concurrency, operation })
const dependencyValidator = createProjectStateDependencyValidator()
return createProjectStateService({ workers, refreshExecutor, dependencyValidator })
```

Публичный `packages/core/index.ts` экспортирует default-фабрику под прежним именем `createProjectStateService`. Внутренние низкоуровневые тесты импортируют service напрямую и передают stubs.

- [ ] **Step 5: Очистить оставшиеся обратные imports**

- `projectYamlCache.ts` импортирует `PreparedYamlFile` из leaf `project/preparedYamlContracts.ts`, который не импортирует projectState.
- `validationWorkerPoolTypes.ts` использует `ProjectStateEncodedFileUpdateBatch` из leaf contract.
- `workerPool/handle.ts` использует только `projectState/contracts/readToken.ts`.
- `fullSyncToXml/types.ts` и `project/componentState/types.ts` используют тот же leaf read-token contract, не `projectState/index.ts`.
- Внутренние модули не импортируют `projectState/index.ts`.

- [ ] **Step 6: Проверить service composition**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/core exec vitest run metadata/projectState metadata/project/preparedYamlProjectWorker.test.ts metadata/validation/validateProject.test.ts metadata/importFromXml/importConfiguration.test.ts metadata/fullSyncToXml --no-isolate`

Expected: PASS; default-фабрика создаёт один общий workerPool и закрывает его вместе с service.

- [ ] **Step 7: Получить пустой baseline**

Run: `pnpm test:architecture`

Run: `pnpm architecture:cycle-baseline -- --accept-rewrite`

Run: `node --test tools/dependency-cruiser/test/project-state-cycle-boundary.test.mjs`

Expected: `.dependency-cruiser-cycle-baseline.json` равен `{ "version": 1, "components": [] }`; dependency-cruiser сообщает `0 компонент, 0 модулей, 0 внутренних зависимостей`.

- [ ] **Step 8: Выполнить окончательную проверку**

Run: `pnpm test:architecture:rules`

Run: `pnpm test:architecture`

Run: `pnpm test`

Run: `pnpm duplicates -- --base 9a2fdce1f`

Expected: все команды PASS; нарушения границ остаются `0 / 0`, циклы `0 / 0 / 0`.

- [ ] **Step 9: Зафиксировать завершение**

```bash
git add packages/core/metadata/projectState packages/core/metadata/project packages/core/metadata/workerPool packages/core/metadata/validation packages/core/metadata/importFromXml packages/core/metadata/fullSyncToXml packages/core/index.ts tools/dependency-cruiser/test/project-state-cycle-boundary.test.mjs .dependency-cruiser-cycle-baseline.json
git commit -m "refactor: :recycle: устранить циклы состояния проекта и workerPool"
```

---

## Final Acceptance

- [ ] `pnpm test:architecture:rules` — PASS.
- [ ] `pnpm test:architecture` — PASS, `0` нарушений границ сверх отсутствующего baseline.
- [ ] `.dependency-cruiser-cycle-baseline.json` содержит `components: []`.
- [ ] `pnpm test` — PASS во всех `packages/*`.
- [ ] `pnpm duplicates -- --base 9a2fdce1f` — PASS.
- [ ] `git status --short` не показывает незакоммиченных файлов.
