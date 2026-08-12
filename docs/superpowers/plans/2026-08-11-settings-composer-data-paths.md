# Settings Composer Data Paths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить двустороннее преобразование русских и XML-имён путей `КомпоновщикНастроек`, разрешение полного типизированного графа, проверку совместимости видов элементов формы и сохранение исключительного `RowFilter` через согласованный `!xml`.

**Architecture:** Общий resolver путей остаётся единственным механизмом обхода и проверки типов. Нейтральный runtime получает только обобщённое представление зарегистрированного табличного источника и декларативные регистрации; сведения о КомпоновщикеНастроек живут в модуле форм, а объект отчёта подключает тот же граф допустимым направлением зависимости `appliedObjects → forms`. Совместимость элементов продолжает проверяться через `allowedKinds`, а типозависимые свойства таблицы — через общую регистрацию свойств по терминальному типу.

**Tech Stack:** TypeScript, Vitest, существующие `DataPathContribution`, `DataPathTableInfo`, `allowedKinds`, metadata rules, explicit `!xml` registry, E2E XML/NKDK fixtures.

## Global Constraints

- Источник требований: [design spec](/Users/nikita/git/nkdk/.worktrees/settings-composer/docs/superpowers/specs/2026-08-11-settings-composer-data-paths-design.md).
- Не изменять вручную существующие XML-фикстуры. Использовать добавленную пользователем форму `CommonForms/КомпоновщикНастроек/Ext/Form.xml` как источник истины.
- Не создавать отдельный resolver или отдельную проверку типа пути: все переходы должны возвращать `DataPathTypeInfo`, после чего применяются действующие `resolveDataPathCore` и `allowedKinds`.
- Не добавлять признаки в `BasePropertyRule`, `PropertyRule` и построители правил. Новые сведения подключать декларативной регистрацией.
- `!xml` разрешён только для `Table.rowFilter` / `ОтборСтрок` в согласованном случае: XML содержит `<RowFilter xsi:nil="true"/>`, а вычисленный профиль источника равен `none`.
- Общие `implicitValueYAML` таблицы (`РежимВыбора`, drag-and-drop, `Ширина` и остальные) не менять.
- После каждого завершённого слоя выполнять `pnpm check:duplicates -- --base origin/develop`.
- Из-за пользовательских изменений в worktree добавлять в коммиты только перечисленные файлы; не использовать широкое `git add .`.

---

### Task 1: Обобщённый зарегистрированный источник в существующем resolver

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/dataPath/types.ts`
- Modify: `packages/rules/metadata/validation/dataPath/coreResolver.ts`
- Test: `packages/rules/metadata/validation/dataPath/resolver.test.ts`

- [ ] **Step 1: Добавить падающие проверки зарегистрированного источника**

В существующий набор `resolver.test.ts` добавить два договора:

1. зарегистрированная колонка возвращает `targetName`, поэтому `Composer.Settings` преобразуется в `Composer.Настройки` и обратно;
2. для `DynamicList` сначала запрашивается зарегистрированная колонка `SettingsComposer`, а неизвестные свойства по-прежнему завершаются как непрозрачный источник без ошибки.

Пример регистрации в тесте:

```ts
const registeredSource = (type: string): DataPathTypeInfo => ({
  kinds: ["tableSource"],
  nextTypes: [],
  terminalTypes: [type],
  table: { kind: "Registered", type },
})

const settingsColumn: FormDataPathColumnSource = {
  name: "Настройки",
  targetName: "Settings",
  typeInfo: registeredSource("DataCompositionSettings"),
}
```

- [ ] **Step 2: Убедиться, что тесты падают по ожидаемой причине**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/validation/dataPath/resolver.test.ts
```

Expected: TypeScript не знает вариант `Registered`, а `DynamicList` завершает обход до вызова зарегистрированной колонки.

- [ ] **Step 3: Добавить нейтральный вариант источника**

В `DataPathTableInfo` добавить только обобщённый вариант, без упоминания КомпоновщикаНастроек:

```ts
export type DataPathTableInfo =
  | { kind: "Registered"; type: string }
  | { kind: "ValueTable" }
  // остальные существующие варианты без изменений
```

В `tableSourceFromColumn` считать `Registered` источником с известной схемой, потому что его колонки предоставляет registry:

```ts
hasColumns:
  columns.size > 0 ||
  table.kind === "Registered" ||
  table.kind === "ValueList" ||
  table.kind === "GanttChart" ||
  table.kind === "RegisterRecordSet"
```

- [ ] **Step 4: Изменить только порядок разрешения `DynamicList`**

В `resolveTableColumn` сначала вызвать `resolveRegisteredColumn`. Для `DynamicList` сохранить старое непрозрачное завершение, только если registry не вернул колонку:

```ts
const registeredColumnResult = resolveRegisteredColumn(/* existing params */)
if (registeredColumnResult.status === "error") return { status: "done", result: registeredColumnResult.result }

if (tableSource.table.kind === "DynamicList" && registeredColumnResult.column === undefined) {
  return {
    status: "done",
    result: okWithoutTarget({ value, segments, replacements }),
  }
}
```

Общий resolver не должен содержать имена `SettingsComposer`, `Settings` или русские аналоги.

- [ ] **Step 5: Запустить целевые проверки и проверку дублей**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/validation/dataPath/resolver.test.ts
pnpm check:duplicates -- --base origin/develop
```

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/runtime/metadata/ruleRuntime/dataPath/types.ts packages/rules/metadata/validation/dataPath/coreResolver.ts packages/rules/metadata/validation/dataPath/resolver.test.ts
git commit -m "♻️ refactor(data-path): добавить зарегистрированные источники"
```

---

### Task 2: Описать единый граф и 68 пар имён КомпоновщикаНастроек

**Files:**
- Create: `packages/rules/metadata/forms/settingsComposer/dataPathModel.ts`
- Create: `packages/rules/metadata/forms/settingsComposer/dataPathModel.test.ts`

- [ ] **Step 1: Добавить табличный тест полного каталога имён**

В тесте объявить 68 пар из design spec и проверить для каждой пары:

```ts
it.each(settingsComposerNamePairs)("%s ↔ %s", (internal, yaml) => {
  expect(settingsComposerInternalToYaml(internal)).toBe(yaml)
  expect(settingsComposerYamlToInternal(yaml)).toBe(internal)
})
```

Отдельно проверить, что `ИмяМоегоЭлемента` и `МойРеквизит` не переводятся вне зарегистрированного свойства.

- [ ] **Step 2: Запустить тест и получить падение из-за отсутствующего модуля**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/forms/settingsComposer/dataPathModel.test.ts
```

- [ ] **Step 3: Создать декларативный каталог графа**

Модуль должен экспортировать:

```ts
export interface SettingsComposerProperty {
  readonly internal: string
  readonly yaml: string
  readonly typeInfo: DataPathTypeInfo
}

export const SETTINGS_COMPOSER_TYPE = "DataCompositionSettingsComposer"
export const settingsComposerNamePairs: readonly (readonly [internal: string, yaml: string])[]
export function settingsComposerTypeInfo(type: string): DataPathTypeInfo
export function resolveSettingsComposerProperty(type: string, segment: string): FormDataPathColumnSource | undefined
```

`settingsComposerTypeInfo` возвращает зарегистрированный источник с каноническим терминальным типом:

```ts
export function settingsComposerTypeInfo(type: string): DataPathTypeInfo {
  return {
    kinds: ["tableSource"],
    nextTypes: [],
    terminalTypes: [type],
    table: { kind: "Registered", type },
    sourceText: type,
  }
}
```

Граф описать по таблицам design spec: `SettingsComposer`, `Settings`, `UserSettings`, `Structure`, коллекции и скалярные свойства. Для каждого свойства задавать `name` = YAML-сегмент и `targetName` = XML-сегмент; именно существующий механизм replacement выполняет преобразование.

Для скаляров использовать действующие терминальные типы (`boolean`, `string`, `dateTime`, `Picture`, `<any>`, `Field`, системные перечисления). Для коллекций использовать канонические типы `DataCompositionSettings`, `DataCompositionFilter`, `DataCompositionGroupFields`, `DataCompositionSelection`, `DataCompositionOrder`, `DataCompositionConditionalAppearance` и остальные типы из матрицы.

- [ ] **Step 4: Проверить проекции графа без владельца формы**

Расширить тест таблицей представителей каждой группы:

```ts
it.each([
  ["DataCompositionSettings", "ItemFilter", "ЭлементОтбор", "DataCompositionFilter"],
  ["DataCompositionFilter", "ComparisonType", "ВидСравнения", "DataCompositionComparisonType"],
  ["DataCompositionGroupFields", "BeginOfPeriod", "НачалоПериода", "DataCompositionField|dateTime|DataCompositionPeriodAdditionType"],
  ["DataCompositionOrder", "OrderAvailableFields", "ДоступныеПоляПорядка", "DataCompositionAvailableFields"],
])(/* assert source and terminal types */)
```

Включить все группы проекций из spec, а не все 505 путей по отдельности.

- [ ] **Step 5: Запустить тесты и проверку дублей**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/forms/settingsComposer/dataPathModel.test.ts
pnpm check:duplicates -- --base origin/develop
```

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/rules/metadata/forms/settingsComposer/dataPathModel.ts packages/rules/metadata/forms/settingsComposer/dataPathModel.test.ts
git commit -m "✨ feat(forms): описать граф КомпоновщикаНастроек"
```

---

### Task 3: Подключить реквизит формы, DynamicList и объект отчёта к одному графу

**Files:**
- Create: `packages/rules/metadata/forms/settingsComposer/dataPathRules.ts`
- Create: `packages/rules/metadata/forms/settingsComposer/dataPathRules.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataReport/dataPathRules.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/validationRules.ts`
- Modify: `packages/rules/metadata/composition/metadataRules.ts`
- Modify: `packages/runtime/metadata/validation/dataPath/typeDescription.ts`
- Test: `packages/rules/metadata/validation/dataPath/typeDescription.test.ts`
- Test: `packages/rules/metadata/validation/dataPath/resolver.test.ts`
- Test: `packages/rules/metadata/validation/validateForm.test.ts`

- [ ] **Step 1: Заменить старые тесты непрозрачности на падающие проверки владельцев**

Проверить в обоих режимах имён:

```text
КомпоновщикНастроек.Настройки.ПараметрыДанных
КомпоновщикНастроек.Settings.DataParameters

Отчет.КомпоновщикНастроек.Настройки
Отчет.SettingsComposer.Settings

Список.КомпоновщикНастроек.Настройки.Отбор
Список.SettingsComposer.Settings.Filter
```

Ожидаемые результаты должны содержать одинаковые терминальные типы и replacements только стандартных свойств. Отдельно проверить неизвестное зарегистрированное свойство: `...Настройки.Неизвестно` должно давать существующую диагностику неизвестной колонки/реквизита.

- [ ] **Step 2: Запустить тесты и подтвердить, что текущие platform-source matchers скрывают ошибки**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/validation/dataPath/typeDescription.test.ts metadata/validation/dataPath/resolver.test.ts metadata/validation/validateForm.test.ts
```

- [ ] **Step 3: Зарегистрировать тип и колонки формы**

`settingsComposerDataPathRules` должен состоять из существующих contributions:

```ts
export const settingsComposerDataPathRules: readonly DataPathContribution[] = [
  {
    kind: "typeResolver",
    resolver: ({ baseType }) =>
      baseType === "SettingsComposer" || baseType === "КомпоновщикНастроекКомпоновкиДанных"
        ? settingsComposerTypeInfo(SETTINGS_COMPOSER_TYPE)
        : undefined,
  },
  {
    kind: "tableColumn",
    resolver: ({ table, segment }) => {
      if (table.kind === "DynamicList" && (segment === "SettingsComposer" || segment === "КомпоновщикНастроек")) {
        return {
          name: "КомпоновщикНастроек",
          targetName: "SettingsComposer",
          typeInfo: settingsComposerTypeInfo(SETTINGS_COMPOSER_TYPE),
        }
      }
      return table.kind === "Registered"
        ? resolveSettingsComposerProperty(table.type, segment)
        : undefined
    },
  },
]
```

Из `typeDescription.ts` удалить opaque mapping `SettingsComposer → platformSource`: тип теперь приходит через registry. Из `clientApplicationForm/validationRules.ts` удалить три частных `formPlatformSourceMatcher` для английских путей SettingsComposer.

- [ ] **Step 4: Заменить opaque-переход отчёта типизированным**

В `metadataReport/dataPathRules.ts` импортировать только фабрику типа из `forms/settingsComposer` и вернуть существующий `traversalTransition`:

```ts
{
  kind: "traversalTransition",
  resolver: ({ owner, segment }) =>
    owner.ref.kind === "ОтчетОбъект" && (segment === "SettingsComposer" || segment === "КомпоновщикНастроек")
      ? {
          typeInfo: settingsComposerTypeInfo(SETTINGS_COMPOSER_TYPE),
          sourceName: "КомпоновщикНастроек",
          tableSource: settingsComposerTableSource(SETTINGS_COMPOSER_TYPE),
        }
      : undefined,
}
```

Не добавлять зависимость `forms → appliedObjects`.

- [ ] **Step 5: Подключить form-owned registration в composition**

В `metadataRules.ts` собирать:

```ts
const dataPathRules = defineMetadataRules({
  ...emptyMetadataRules,
  dataPaths: [...settingsComposerDataPathRules, ...appliedObjectDataPathRules],
})
```

- [ ] **Step 6: Запустить целевые тесты и архитектуру**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/forms/settingsComposer/dataPathRules.test.ts metadata/validation/dataPath/typeDescription.test.ts metadata/validation/dataPath/resolver.test.ts metadata/validation/validateForm.test.ts
pnpm test:architecture
pnpm check:duplicates -- --base origin/develop
```

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/rules/metadata/forms/settingsComposer/dataPathRules.ts packages/rules/metadata/forms/settingsComposer/dataPathRules.test.ts packages/rules/metadata/appliedObjects/metadataReport/dataPathRules.ts packages/rules/metadata/forms/clientApplicationForm/validationRules.ts packages/rules/metadata/composition/metadataRules.ts packages/runtime/metadata/validation/dataPath/typeDescription.ts packages/rules/metadata/validation/dataPath/typeDescription.test.ts packages/rules/metadata/validation/dataPath/resolver.test.ts packages/rules/metadata/validation/validateForm.test.ts
git commit -m "✨ feat(data-path): подключить владельцев КомпоновщикаНастроек"
```

---

### Task 4: Проверить рекурсивные `Элементы.…ТекущиеДанные` и преобразование путей

**Files:**
- Test: `packages/rules/metadata/validation/dataPath/resolver.test.ts`
- Test: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`
- Test: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`

- [ ] **Step 1: Добавить падающий интеграционный набор цепочек**

Проверить три уровня:

```text
КомпоновщикНастроек.Настройки
Элементы.КомпоновщикНастроекНастройки.ТекущиеДанные.ЭлементПараметрыДанных
Элементы.КомпоновщикНастроекНастройкиЭлементПараметрыДанных.ТекущиеДанные.Параметр
```

и XML-эквиваленты:

```text
КомпоновщикНастроек.Settings
Items.КомпоновщикНастроекНастройки.CurrentData.ItemDataParameters
Items.КомпоновщикНастроекНастройкиЭлементПараметрыДанных.CurrentData.Parameter
```

Проверить, что имена элементов после `Элементы` не переводятся. Добавить отрицательные случаи: ссылка на не-табличный элемент, неизвестная колонка и цикл из двух таблиц.

- [ ] **Step 2: Запустить тесты**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/validation/dataPath/resolver.test.ts metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
```

- [ ] **Step 3: Довести модель графа, не меняя алгоритм CurrentData**

Исправлять только декларации `dataPathModel.ts`, если конкретной коллекции или проекции не хватает. Существующие `resolveCurrentDataPath`, защита от циклов и dialect `Items/Элементы`, `CurrentData/ТекущиеДанные` должны остаться общими.

- [ ] **Step 4: Добавить проверки всех групп проекций**

В табличном тесте покрыть хотя бы один путь для каждой строки раздела «Проекции текущей строки» design spec, включая пять `*AvailableFields`, `Appearance`, `Fields`, `UserFields` и составные `BeginOfPeriod`/`EndOfPeriod`.

- [ ] **Step 5: Запустить тесты и проверку дублей**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/validation/dataPath/resolver.test.ts metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
pnpm check:duplicates -- --base origin/develop
```

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/rules/metadata/forms/settingsComposer/dataPathModel.ts packages/rules/metadata/forms/settingsComposer/dataPathModel.test.ts packages/rules/metadata/validation/dataPath/resolver.test.ts packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
git commit -m "✅ test(data-path): покрыть цепочки текущих данных"
```

---

### Task 5: Расширить действующую матрицу `allowedKinds`

**Files:**
- Modify: `packages/rules/metadata/forms/elements/table/rules.ts`
- Modify: `packages/rules/metadata/forms/elements/inputField/rules.ts`
- Modify: `packages/rules/metadata/forms/elements/labelField/rules.ts`
- Modify: `packages/rules/metadata/forms/elements/radioButtonField/rules.ts`
- Test: `packages/rules/metadata/forms/elements/dataPathPolicies.test.ts`
- Test: `packages/rules/metadata/forms/clientApplicationForm/dataPathCompatibility.integration.test.ts`

- [ ] **Step 1: Добавить падающую матрицу положительных и отрицательных случаев**

Добавить в существующие `it.each`, не создавать отдельную проверку типа:

```ts
const settingsComposerTableKinds = [
  "DataCompositionSettings",
  "DataCompositionUserSettings",
  "DataCompositionStructure",
  "DataCompositionDataParameters",
  "DataCompositionFilter",
  "DataCompositionGroupFields",
  "DataCompositionSelection",
  "DataCompositionOrder",
  "DataCompositionConditionalAppearance",
  "DataCompositionAppearance",
  "DataCompositionAppearanceFields",
  "DataCompositionAvailableFields",
  "DataCompositionUserFields",
] as const
```

Экспортировать этот закрытый каталог канонических имён из `dataPathModel.ts` и использовать его и в тестах, и в `allowedKinds`, чтобы строки не дублировались.

Проверить границы:

- `ЭлементПараметрыДанных`: только таблица;
- `ЭлементОтбор`: таблица, поле ввода, поле надписи; не поле переключателя;
- `Поле`: только поле ввода и поле надписи;
- `ВидСравнения`, оба `ТипГруппы`, `Применение`, `Расположение`, `ТипДополнения`, `ТипУпорядочивания`: плюс поле переключателя.

- [ ] **Step 2: Запустить тесты и увидеть несовместимые терминальные типы**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/forms/elements/dataPathPolicies.test.ts metadata/forms/clientApplicationForm/dataPathCompatibility.integration.test.ts
```

- [ ] **Step 3: Дополнить только `allowedKinds` существующих правил**

Не добавлять ветвления в `policies.ts`. Терминальные типы из графа должны совпадать со списками каждого вида элемента. Составные `НачалоПериода` и `КонецПериода` останутся допустимы для input/label благодаря `allowComposite: true`, но не для radio.

- [ ] **Step 4: Запустить проверки**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/forms/elements/dataPathPolicies.test.ts metadata/forms/clientApplicationForm/dataPathCompatibility.integration.test.ts
pnpm check:duplicates -- --base origin/develop
```

- [ ] **Step 5: Зафиксировать слой**

```bash
git add packages/rules/metadata/forms/elements/table/rules.ts packages/rules/metadata/forms/elements/inputField/rules.ts packages/rules/metadata/forms/elements/labelField/rules.ts packages/rules/metadata/forms/elements/radioButtonField/rules.ts packages/rules/metadata/forms/elements/dataPathPolicies.test.ts packages/rules/metadata/forms/clientApplicationForm/dataPathCompatibility.integration.test.ts
git commit -m "✨ feat(forms): валидировать виды элементов КомпоновщикаНастроек"
```

---

### Task 6: Типозависимые свойства таблицы через общую регистрацию

**Files:**
- Modify: `packages/runtime/metadata/validation/dataPath/registry.ts`
- Create: `packages/rules/metadata/forms/elements/table/validateTypeDependentProperties.ts`
- Create: `packages/rules/metadata/forms/elements/table/validateTypeDependentProperties.test.ts`
- Modify: `packages/rules/metadata/forms/settingsComposer/dataPathRules.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/validate.ts`

- [ ] **Step 1: Добавить падающие проверки матрицы свойств**

Проверить:

| Терминальный тип | `РежимОтображения` | `ПодробноеОтображениеИменованныхЭлементовНастройки` |
| --- | :---: | :---: |
| `DataCompositionFilter` | да | да |
| `DataCompositionConditionalAppearance` | нет | да |
| `DataCompositionUserSettings` | да | нет |
| любой другой | нет | нет |

Также проверить, что `ОграниченияИспользования` отсутствует в `TableRules` и что явные общие свойства `РежимВыбора`, drag-and-drop и `Ширина` не получают новых диагностик.

- [ ] **Step 2: Запустить тест и подтвердить отсутствие общего договора**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/forms/elements/table/validateTypeDependentProperties.test.ts
```

- [ ] **Step 3: Добавить декларативную регистрацию без изменения PropertyRule**

Расширить `DataPathContribution` нейтральным контрактом:

```ts
export interface DataPathElementPropertyRegistration {
  readonly itemType: string
  readonly propertyYaml: string
  readonly terminalTypes: readonly string[]
}

type DataPathRegistrationContribution =
  | { readonly kind: "elementProperty"; readonly registration: DataPathElementPropertyRegistration }
  // существующие contributions
```

Registry должен только возвращать разрешённые терминальные типы для пары `itemType + propertyYaml`; сведений о КомпоновщикеНастроек в runtime быть не должно.

- [ ] **Step 4: Зарегистрировать конкретную матрицу в `settingsComposerDataPathRules`**

```ts
{
  kind: "elementProperty",
  registration: {
    itemType: "Table",
    propertyYaml: "РежимОтображения",
    terminalTypes: ["DataCompositionFilter", "DataCompositionUserSettings"],
  },
},
{
  kind: "elementProperty",
  registration: {
    itemType: "Table",
    propertyYaml: "ПодробноеОтображениеИменованныхЭлементовНастройки",
    terminalTypes: ["DataCompositionFilter", "DataCompositionConditionalAppearance"],
  },
},
```

- [ ] **Step 5: Проверять свойства после существующего разрешения пути**

Второй проход формы уже получает `result.target`. Передать target и visit элемента в обобщённый validator; он должен:

1. рассматривать только явно присутствующее зарегистрированное свойство;
2. пропускать неразрешённый путь, чтобы не дублировать диагностику resolver;
3. сравнивать `normalizeDataPathTerminalType(result.target.typeInfo)` с регистрацией;
4. привязывать ошибку к самому свойству, а не к `ПутьКДанным`.

Не вызывать resolver повторно и не создавать параллельную систему типов.

- [ ] **Step 6: Запустить целевые тесты, архитектуру и дубли**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/forms/elements/table/validateTypeDependentProperties.test.ts metadata/validation/validateForm.test.ts
pnpm test:architecture
pnpm check:duplicates -- --base origin/develop
```

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/runtime/metadata/validation/dataPath/registry.ts packages/rules/metadata/forms/elements/table/validateTypeDependentProperties.ts packages/rules/metadata/forms/elements/table/validateTypeDependentProperties.test.ts packages/rules/metadata/forms/settingsComposer/dataPathRules.ts packages/rules/metadata/forms/clientApplicationForm/validate.ts
git commit -m "✨ feat(forms): проверить типозависимые свойства таблиц"
```

---

### Task 7: Контекстный `ОтборСтрок: !xml` без configuration index

**Files:**
- Create: `packages/rules/metadata/forms/elements/table/explicitRowFilter.ts`
- Create: `packages/rules/metadata/forms/elements/table/explicitRowFilter.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/importedYamlFinalizer.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/tableSourceProfile.ts`
- Modify: `packages/rules/metadata/forms/elements/table/dynamicListProperties.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/composition/metadataRules.ts`
- Modify: `.agents/xml-anomalies.md`

- [ ] **Step 1: Добавить падающие тесты трёх профилей и исключения**

Проверить:

1. прямой `DynamicList` → `dynamicList`, без `RowFilter`;
2. `ValueTable` / табличная часть / record set → `rowFilter`, вычисляемый `RowFilter` без YAML-маркера;
3. любой путь КомпоновщикаНастроек, включая `DynamicList.SettingsComposer` и `Элементы.…ТекущиеДанные` → `none`;
4. XML с явным `<RowFilter xsi:nil="true"/>` при профиле `none` → `ОтборСтрок: !xml`;
5. `ОтборСтрок: !xml` → канонический `RowFilter` без reference XML и без configuration index;
6. непустой `!xml` и обычное булево значение отклоняются существующим explicit XML механизмом.

- [ ] **Step 2: Запустить тесты и получить падение на сохранении исключения**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/forms/elements/table/explicitRowFilter.test.ts metadata/forms/elements/table/dynamicListProperties.test.ts metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
```

- [ ] **Step 3: Зарегистрировать единственное согласованное explicit XML значение**

```ts
export const explicitRowFilterRules = defineMetadataRules({
  ...emptyMetadataRules,
  explicitXMLProperties: {
    tableRowFilter: {
      itemType: "Table",
      propertyKey: "rowFilter",
      yamlValue: EMPTY_XML_TAG_VALUE,
      xmlValue: { "_xsi:nil": "true" },
    },
  },
})
```

Подключить слой в `metadataRules.ts`. Не менять общий explicit XML registry и не добавлять configuration index lookup для исключения.

- [ ] **Step 4: Удалять вычисляемые маркеры после XML-import**

Property registry при чтении пометит каждый присутствующий `RowFilter`. В `clientApplicationFormImportedYamlFinalizerRules` добавить нормализацию:

```ts
function normalizeImportedRowFilterMarkers(params: {
  yaml: ClientApplicationFormYAML
  context: FormDataPathContext
  ownerCache: OwnerMetadataCache
}): void {
  // обойти Table через существующий form traversal
  // если yamlScalarTagAt(table, "ОтборСтрок") !== "xml" — пропустить
  // вычислить profile через resolveDataPath + classifyTableSource
  // profile === "none" → сохранить маркер
  // иначе delete table["ОтборСтрок"]
}
```

`requiresFinalization` должен срабатывать либо для compaction путей, либо при наличии tagged `ОтборСтрок`. Скалярный tag удалять отдельно не требуется: после удаления ключа он не сериализуется; не переносить tag на другие объекты.

- [ ] **Step 5: Убедиться, что `Registered` классифицируется как `none`**

`classifyTableSource` должен оставить закрытую матрицу: `rowFilter` только для `ValueTable`, `TabularSection`, `RegisterRecordSet`; `dynamicList` только для прямого корня. `Registered` автоматически попадает в `none`, частные имена в классификатор не добавлять.

- [ ] **Step 6: Зафиксировать аномалию**

Сохранить уже добавленную строку `.agents/xml-anomalies.md` для `Table` / `ОтборСтрок` / `!xml` / `<RowFilter xsi:nil="true"/>`. В описании указать условие `computed profile = none` и ссылку на тест исключения.

- [ ] **Step 7: Запустить целевые тесты, JSON Schema и дубли**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/forms/elements/table/explicitRowFilter.test.ts metadata/forms/elements/table/dynamicListProperties.test.ts metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts metadata/validation/serializedYamlValidation.integration.test.ts
pnpm check:duplicates -- --base origin/develop
```

- [ ] **Step 8: Зафиксировать слой**

```bash
git add .agents/xml-anomalies.md packages/rules/metadata/forms/elements/table/explicitRowFilter.ts packages/rules/metadata/forms/elements/table/explicitRowFilter.test.ts packages/rules/metadata/forms/clientApplicationForm/importedYamlFinalizer.ts packages/rules/metadata/forms/clientApplicationForm/tableSourceProfile.ts packages/rules/metadata/forms/elements/table/dynamicListProperties.test.ts packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts packages/rules/metadata/composition/metadataRules.ts
git commit -m "🐛 fix(forms): сохранить исключительный RowFilter через !xml"
```

---

### Task 8: Полный round-trip формы, конфигурации и расширений

**Files:**
- Preserve user fixture: `e2e/fixtures/xml/cf/CommonForms/КомпоновщикНастроек/Ext/Form.xml`
- Preserve user fixture metadata: `e2e/fixtures/xml/cf/CommonForms/КомпоновщикНастроек.xml`
- Preserve user fixture registration: `e2e/fixtures/xml/cf/Configuration.xml`
- Preserve user standalone content: `e2e/fixtures/xml/cf/Ext/StandaloneConfigurationContent.bin`
- Generated: `e2e/fixtures/nkdk/**`
- Test: `e2e/metadata-project.test.ts`
- Test: `e2e/fixture-layout.test.ts`
- Test: `packages/rules/metadata/forms/elements/__tests__/roundTrip.integration.test.ts`

- [ ] **Step 1: Запустить узкий round-trip элементов формы**

```bash
pnpm --filter @nkdk/rules exec vitest run --config vitest.config.ts metadata/forms/elements/__tests__/roundTrip.integration.test.ts
```

Если тест намеренно исключает `RowFilter`, добавить отдельную проверку explicit `RowFilter` из Task 7; не ослаблять общий round-trip.

- [ ] **Step 2: Импортировать XML E2E и проверить диагностики до обновления эталона**

```bash
pnpm test:e2e -- e2e/metadata-project.test.ts
```

Expected before update: импорт и валидация проходят, а сравнение с committed NKDK fixture показывает только новую общую форму/регистрацию и ожидаемые преобразования путей.

- [ ] **Step 3: Обновить эталонный NKDK-проект штатной командой**

```bash
pnpm fixtures:e2e:nkdk
```

Проверить diff: YAML новой формы содержит русские сегменты, пользовательские имена элементов сохранены, единственный невосстановимый `RowFilter` представлен `ОтборСтрок: !xml`; в `.nkdk` остаются индексы конфигурации и всех расширений, transient cache отсутствует.

- [ ] **Step 4: Запустить E2E повторно**

```bash
pnpm test:e2e
```

Ожидается:

- XML → NKDK совпадает с `e2e/fixtures/nkdk` байт-в-байт;
- NKDK → XML совпадает с конфигурацией и всеми тремя расширениями;
- чистый проект проходит валидацию;
- существующая проверка изменённого расширения остаётся неизменной.

- [ ] **Step 5: Проверить состав изменённых fixture-файлов**

```bash
git status --short e2e/fixtures
git diff --stat -- e2e/fixtures
```

Не выполнять массовую нормализацию строк. Не добавлять `e2e/fixtures/xml/cf/ConfigDumpInfo.xml`: он не входит в существующий договор E2E-каталога и не нужен ни импорту, ни сравнению round-trip.

- [ ] **Step 6: Запустить дубли и зафиксировать слой**

```bash
pnpm check:duplicates -- --base origin/develop
git add e2e/fixtures/xml/cf/CommonForms/КомпоновщикНастроек.xml e2e/fixtures/xml/cf/CommonForms/КомпоновщикНастроек/Ext/Form.xml e2e/fixtures/xml/cf/Configuration.xml e2e/fixtures/xml/cf/Ext/StandaloneConfigurationContent.bin e2e/fixtures/nkdk e2e/metadata-project.test.ts e2e/fixture-layout.test.ts packages/rules/metadata/forms/elements/__tests__/roundTrip.integration.test.ts
git commit -m "✅ test(e2e): покрыть КомпоновщикНастроек round-trip"
```

Перед `git add` сверить эти четыре исходных файла через `git status`; не добавлять весь `e2e/fixtures/xml/cf` вслепую.

---

### Task 9: Документация и полная проверка ветки

**Files:**
- Modify: `docs/superpowers/specs/2026-08-11-settings-composer-data-paths-design.md`
- Verify: `.agents/restrictions.md`
- Verify: `.agents/xml-anomalies.md`

- [ ] **Step 1: Сверить реализацию с design spec**

Проверить по пунктам:

- все 68 пар имён;
- три владельца;
- прямые и рекурсивные пути;
- все группы текущей строки;
- матрица четырёх видов элементов;
- матрица двух типозависимых свойств таблицы;
- отсутствие `UseRestrictions`;
- отсутствие изменений общих defaults таблицы;
- матрица `RowFilter` и единственный согласованный `!xml`.

Если реализация выявила уточнение договора, сначала поправить design spec, не менять `.agents/architecture.md` без отдельного согласования.

- [ ] **Step 2: Запустить типизацию и все тесты**

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm test:e2e
pnpm check:duplicates -- --base origin/develop
```

Все команды должны завершиться с кодом 0. Не обновлять dependency-cruiser baseline для обхода ошибки.

- [ ] **Step 3: Проверить рабочее дерево и отсутствие случайных изменений**

```bash
git status --short
git diff --check
git diff --stat origin/develop...HEAD
```

Отдельно убедиться, что нет массового CRLF-diff и не добавлен transient `.nkdk/cache`.

- [ ] **Step 4: Зафиксировать документацию**

```bash
git add docs/superpowers/specs/2026-08-11-settings-composer-data-paths-design.md docs/superpowers/plans/2026-08-11-settings-composer-data-paths.md
git commit -m "📝 docs: зафиксировать поддержку КомпоновщикаНастроек"
```

- [ ] **Step 5: Подготовить итог реализации**

В итоговом сообщении перечислить:

- расширенные существующие тесты;
- новые тесты и уникальный договор каждого;
- отсутствие удалённых round-trip/fixture/architecture тестов;
- результаты шести контрольных команд;
- отдельно отметить, что configuration index не используется для исключительного `RowFilter`.
