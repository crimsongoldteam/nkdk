# All Agreed Doc Round-Trip Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить все ещё не реализованные, но уже согласованные расхождения round-trip конфигурации `doc`: контекстные XML-defaults форм документа и отчёта, контейнеры TypeDescription и пустые форматированные заголовки ExtendedTooltip; закрепить согласованную канонизацию `HeaderHorizontalAlign=Auto`.

**Architecture:** Контекст формы определяется по её основному реквизиту и локальному `formDataPathIndex`; общие metadata-слои не получают знаний о документах и отчётах. Остальные договоры выражаются существующими параметрами `rules.ts` и таблицей `TypeDescriptionRules`; reference XML, новые признаки правил и специальные fromXML/toXML не добавляются.

**Tech Stack:** TypeScript 7, Vitest 4, TypeBox, декларативные `rules.ts`, metadata validation, `round-trip-yaml`, jscpd через `pnpm duplicates`.

## Global Constraints

- План выполняется от коммита `73478dd81`; исправление defaults справочника `9/25` уже реализовано и повторно в план не входит.
- Уже реализованы договоры `Button.Type`, `EnableContentChange`, `AutoCellHeight`, `RadioButtonType`, `UseForFoldersAndItems`, обязательные `PredefinedItem.Code/Description`, `Characteristics`, `StyleItem.Type`, дополнения `GanttChartField`, порядок `CommandInterface.Item` и объектно-зависимые правила реквизитов/табличных частей.
- Существующие XML-фикстуры не изменять: они являются источником истины. Разрешены изменения только TypeScript-ожиданий YAML.
- Не добавлять `reference`, новые поля `BasePropertyRule`/`PropertyRule`, параметры построителей или частные условия в `orchestration`, `validation` и `project`.
- Не добавлять fromXML/toXML/fromYAML/toYAML; использовать существующие правила, локальные callbacks и регистрацию типов.
- Не запускать Stryker или другие проверки мутантов.
- `Period`, `TopLevelParent` и `RowFilter` не блокируют итоговый round-trip.
- Явный XML `HeaderHorizontalAlign=Auto` канонизируется в отсутствие тега и фиксируется в `.agents/restrictions.md`; reference/index для него не добавляется.
- Перед каждым коммитом задачи запускать её целевые тесты. Перед завершением выполнить `pnpm type-check`, `pnpm test`, `pnpm duplicates` и round-trip `cf/doc`.

---

## File Structure

- `packages/core/metadata/forms/clientApplicationForm/mainAttributeKinds.ts` — локальный нейтральный помощник формы: проверяет kinds основного реквизита по сырой коллекции реквизитов и `FormDataPathIndex`.
- `packages/core/metadata/forms/clientApplicationForm/rules.ts` — контекстный синтез трёх документных и четырёх отчётных XML-defaults.
- `packages/core/metadata/forms/clientApplicationForm/validate.ts` — отклоняет документные/отчётные YAML-поля у формы с неподходящим основным реквизитом.
- `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts` — наблюдаемый договор подходящего/неподходящего основного реквизита и явных значений.
- `packages/core/metadata/validation/validateForm.test.ts` — диагностика недопустимых контекстных полей.
- `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts` — ожидаемый компактный YAML формы отчёта без неявного `ТипФормыОтчета: Основная`.
- `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts` — defaults четырёх отчётных полей и сохранение действующих defaults документа.
- `packages/core/metadata/commonObjects/typeDescription/types.ts` — модификатор `complex` для восьми базовых/конкретных типов.
- `packages/core/metadata/commonObjects/typeDescription/toXML.test.ts` — табличный договор `TypeSet` для базового и `Type` для конкретного типа.
- `packages/core/metadata/forms/elements/extendedTooltip/rules.ts` — `preserveEmptyXML` заголовка.
- `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts` — round-trip пустого форматированного заголовка и канонизация четырёх табличных `HeaderHorizontalAlign=Auto`.

### Task 1: Контекстные defaults форм документа и отчёта

**Files:**
- Create: `packages/core/metadata/forms/clientApplicationForm/mainAttributeKinds.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts:27-53,244-283,520-559`
- Modify: `packages/core/metadata/forms/clientApplicationForm/validate.ts:30-91`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts:28-102`
- Modify: `packages/core/metadata/validation/validateForm.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts:697-706`
- Modify: `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts:1067-1110`

**Interfaces:**
- Consumes: `YAMLPropertySource.raw("attributes")`, `ConfigurationContextWithExportToXML.importFromYAML.formDataPathIndex`, `FormDataPathIndex.getRoot(name)`.
- Produces: `hasMainAttributeKind(attributes: unknown, index: FormDataPathIndex | undefined, kinds: ReadonlySet<string>): boolean`; XML-defaults только для kinds `ДокументОбъект` и `ОтчетОбъект`; diagnostics на недопустимых YAML-полях.

- [ ] **Step 1: Добавить падающие проверки XML-defaults и явных значений**

В `fromYAMLToXML.test.ts` добавить локальный построитель входа и две проверки:

```ts
const formWithMainAttribute = (
  type: string,
  properties: Partial<ClientApplicationFormYAML> = {}
): ClientApplicationFormYAML => ({
  ...properties,
  Реквизиты: {
    Объект: { Тип: type, ОсновнойРеквизит: "Истина" },
  },
}) as ClientApplicationFormYAML

it("восстанавливает XML-defaults формы документа только по основному реквизиту", () => {
  const document = convertClientApplicationFormFromYAMLToXML({
    context: mockContextToXML(),
    yaml: formWithMainAttribute("ДокументОбъект.Заказ"),
    name: "ФормаДокумента",
  })
  expect(document.formXML).toMatchObject({
    AutoTime: "CurrentOrLast",
    UsePostingMode: "Auto",
    RepostOnWrite: true,
  })

  const other = convertClientApplicationFormFromYAMLToXML({
    context: mockContextToXML(),
    yaml: formWithMainAttribute("СправочникОбъект.Товары"),
    name: "ФормаСправочника",
  })
  expect(other.formXML).not.toHaveProperty("AutoTime")
  expect(other.formXML).not.toHaveProperty("UsePostingMode")
  expect(other.formXML).not.toHaveProperty("RepostOnWrite")
})

it("восстанавливает XML-defaults формы отчёта и сохраняет явные значения", () => {
  const implicit = convertClientApplicationFormFromYAMLToXML({
    context: mockContextToXML(),
    yaml: formWithMainAttribute("ОтчетОбъект.Продажи"),
    name: "ФормаОтчета",
  })
  expect(implicit.formXML).toMatchObject({
    ReportFormType: "Main",
    AutoShowState: "Auto",
    ReportResultViewMode: "Auto",
    ViewModeApplicationOnSetReportResult: "Auto",
  })

  const explicit = convertClientApplicationFormFromYAMLToXML({
    context: mockContextToXML(),
    yaml: formWithMainAttribute("ОтчетОбъект.Продажи", {
      ТипФормыОтчета: "Настройка",
      АвтоОтображениеСостояния: "НеОтображать",
      РежимОтображенияРезультатаОтчета: "Обычный",
    }),
    name: "ФормаНастроек",
  })
  expect(explicit.formXML).toMatchObject({
    ReportFormType: "Settings",
    AutoShowState: "DontShow",
    ReportResultViewMode: "Default",
  })
})
```

Расширить документный тест явными `АвтоВремя: "Последним"`, `РежимПроведения: "Неоперативный"` и `ПерепроводитьПриЗаписи: "Ложь"`; ожидать `Last`, `Regular`, `false`.

- [ ] **Step 2: Добавить падающую проверку контекстной валидации**

В `validateForm.test.ts` добавить один табличный договор для неподходящих полей:

```ts
it.each([
  ["АвтоВремя: Последним", "/АвтоВремя", "ДокументОбъект"],
  ["ТипФормыОтчета: Настройка", "/ТипФормыОтчета", "ОтчетОбъект"],
] as const)("отклоняет контекстное поле %s без подходящего основного реквизита", (field, path, kind) => {
  const project = createProject({
    form: [
      "Реквизиты:",
      "  Объект:",
      "    Тип: Строка",
      "    ОсновнойРеквизит: Истина",
      field,
    ],
  })

  expect(runValidateForm(project)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path, severity: "error", source: "structure", message: expect.stringContaining(kind) }),
    ])
  )
})
```

- [ ] **Step 3: Запустить красную стадию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts metadata/validation/validateForm.test.ts
```

Expected: документные и отчётные defaults отсутствуют, а неподходящие явные поля не дают контекстной диагностики.

- [ ] **Step 4: Вынести общий локальный помощник основного реквизита**

Создать `mainAttributeKinds.ts`:

```ts
import type { FormDataPathIndex } from "../../validation/dataPath/formIndex"

export function hasMainAttributeKind(
  attributes: unknown,
  index: FormDataPathIndex | undefined,
  kinds: ReadonlySet<string>
): boolean {
  if (!isRecord(attributes) || index === undefined) return false

  return Object.entries(attributes).some(([name, rawAttribute]) => {
    if (!isRecord(rawAttribute) || rawAttribute["ОсновнойРеквизит"] !== "Истина") return false
    return index.getRoot(name)?.typeInfo.nextTypes.some(({ kind }) => kinds.has(kind)) === true
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
```

В `rules.ts` удалить частный `hasFoldersAndItemsMainAttribute`, оставить `asRecord` только если у него есть другие потребители и добавить локальную обёртку:

```ts
const DOCUMENT_MAIN_ATTRIBUTE_KINDS = new Set(["ДокументОбъект"])
const REPORT_MAIN_ATTRIBUTE_KINDS = new Set(["ОтчетОбъект"])

const hasMainAttributeFromSource = (
  source: YAMLPropertySource,
  context: ConfigurationContextWithExportToXML | undefined,
  kinds: ReadonlySet<string>
): boolean => hasMainAttributeKind(source.raw("attributes"), context?.importFromYAML?.formDataPathIndex, kinds)
```

`UseForFoldersAndItems` перевести на эту обёртку без изменения поведения.

- [ ] **Step 5: Задать контекстный XML-договор семи полей**

Для каждого правила сохранить `implicitValueYAML`, добавить `defaultValueXML` и условный `toXML`. Шаблон документного свойства:

```ts
autoTime: systemEnumerationRule({
  yaml: "АвтоВремя",
  typeSE: "AutoTimeMode",
  tag: FormRulesTags.Form,
  implicitValueYAML: "CurrentOrLast",
  defaultValueXML: "CurrentOrLast",
  toXML: (source, context) =>
    source.has("autoTime") || hasMainAttributeFromSource(source, context, DOCUMENT_MAIN_ATTRIBUTE_KINDS),
}),
```

Остальные правила задать по точной таблице; в колонке `kind` указан набор,
передаваемый в `hasMainAttributeFromSource`:

| Ключ | `implicitValueYAML` | `defaultValueXML` | kind | Дополнительно |
|---|---|---|---|---|
| `usePostingMode` | `"Auto"` | `"Auto"` | `DOCUMENT_MAIN_ATTRIBUTE_KINDS` | сохранить `xml: "UsePostingMode"` |
| `repostOnWrite` | `true` | `true` | `DOCUMENT_MAIN_ATTRIBUTE_KINDS` | `booleanRule` |
| `reportFormType` | `"Main"` | `"Main"` | `REPORT_MAIN_ATTRIBUTE_KINDS` | удалить `noImplicitValueYAML`, добавить `omitImplicitValueYAMLBySource: true` |
| `autoShowState` | `"Auto"` | `"Auto"` | `REPORT_MAIN_ATTRIBUTE_KINDS` | сохранить `omitImplicitValueYAMLBySource: true` |
| `reportResultViewMode` | `"Auto"` | `"Auto"` | `REPORT_MAIN_ATTRIBUTE_KINDS` | сохранить `omitImplicitValueYAMLBySource: true` |
| `viewModeApplicationOnSetReportResult` | `"Auto"` | `"Auto"` | `REPORT_MAIN_ATTRIBUTE_KINDS` | сохранить `omitImplicitValueYAMLBySource: true` |

Точные условия `toXML`:

```ts
// document rules
source.has("usePostingMode") || hasMainAttributeFromSource(source, context, DOCUMENT_MAIN_ATTRIBUTE_KINDS)
source.has("repostOnWrite") || hasMainAttributeFromSource(source, context, DOCUMENT_MAIN_ATTRIBUTE_KINDS)

// report rules
source.has("reportFormType") || hasMainAttributeFromSource(source, context, REPORT_MAIN_ATTRIBUTE_KINDS)
source.has("autoShowState") || hasMainAttributeFromSource(source, context, REPORT_MAIN_ATTRIBUTE_KINDS)
source.has("reportResultViewMode") || hasMainAttributeFromSource(source, context, REPORT_MAIN_ATTRIBUTE_KINDS)
source.has("viewModeApplicationOnSetReportResult") ||
  hasMainAttributeFromSource(source, context, REPORT_MAIN_ATTRIBUTE_KINDS)
```

У каждого отчётного свойства `toXML` использует `REPORT_MAIN_ATTRIBUTE_KINDS`; явное YAML-значение всегда экспортируется, а неподходящий контекст отклоняется валидатором.

- [ ] **Step 6: Добавить контекстную диагностику формы**

В `validate.ts` вызвать новый `validateContextualFormProperties` из `validateClientApplicationFormFirstPass` после построения `index`. Функция проверяет только явно присутствующие верхнеуровневые YAML-ключи:

```ts
const DOCUMENT_FORM_PROPERTIES = ["АвтоВремя", "РежимПроведения", "ПерепроводитьПриЗаписи"] as const
const REPORT_FORM_PROPERTIES = [
  "ТипФормыОтчета",
  "АвтоОтображениеСостояния",
  "РежимОтображенияРезультатаОтчета",
  "ПрименениеРежимаОтображенияПриУстановкеРезультатаОтчета",
] as const
```

Для каждой явно присутствующей группы без подходящего kind вернуть `diagnosticAtYamlPath` с `severity: "error"`, `source: "structure"`, путём `[yamlProperty]` и сообщением `Свойство <имя> допустимо только для формы с основным реквизитом <kind>.`.

- [ ] **Step 7: Обновить компактные ожидания YAML**

В `reportFormClientApplicationFormYAML` удалить `ТипФормыОтчета: "Основная"`. В `implicitValueYAMLContract.test.ts`:

- удалить `reportFormType` из списка явных полей;
- добавить контракт `reportFormType: "Main"`, `autoShowState: "Auto"`, `reportResultViewMode: "Auto"`, `viewModeApplicationOnSetReportResult: "Auto"`;
- сохранить существующий контракт документа без изменения значений.

- [ ] **Step 8: Запустить зелёную стадию и проверки формы**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts metadata/validation/validateForm.test.ts metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: PASS; `UseForFoldersAndItems` также остаётся зелёным.

- [ ] **Step 9: Создать коммит задачи**

```bash
git add packages/core/metadata/forms/clientApplicationForm packages/core/metadata/validation/validateForm.test.ts packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
git commit -m "fix: :bug: восстановить defaults объектных форм"
```

### Task 2: Канонический контейнер TypeDescription

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/types.ts:494-665`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toXML.test.ts:20-52`

**Interfaces:**
- Consumes: существующий `TypeModifier = "complex" | "typeset" | "alwaysType"` и `exportTypeDescriptionToXML`.
- Produces: базовый тип восьми семейств в `v8:TypeSet`, конкретный `Тип.Имя` в `v8:Type` без reference.

- [ ] **Step 1: Добавить падающую табличную проверку восьми типов**

В `toXML.test.ts` добавить:

```ts
it.each([
  "ChartOfAccountsObject",
  "InformationRegisterRecordSet",
  "AccountingRegisterRecordSet",
  "AccumulationRegisterRecordSet",
  "CalculationRegisterRecordSet",
  "SequenceRecordSet",
  "RecalculationRecordSet",
  "ConstantValueManager",
] as const)("uses TypeSet only for base %s", (type) => {
  expect(exportTypeDescriptionToXML(mockContext, mockRule, { type: [type] })).toEqual({
    "v8:TypeSet": `cfg:${type}`,
  })
  expect(exportTypeDescriptionToXML(mockContext, mockRule, { type: [`${type}.Объект`] })).toEqual({
    "v8:Type": `cfg:${type}.Объект`,
  })
})
```

Существующую проверку `CatalogManager` оставить: она защищает типы, которые действительно должны оставаться `alwaysType`.

- [ ] **Step 2: Запустить красную стадию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate metadata/commonObjects/typeDescription/toXML.test.ts
```

Expected: базовые значения экспортируются через `v8:Type`, поэтому восемь строк падают; конкретные значения уже проходят.

- [ ] **Step 3: Изменить только восемь модификаторов**

В `TypeDescriptionRules` заменить `modifier: "alwaysType"` на `modifier: "complex"` только у восьми перечисленных типов. Не менять managers, `ReportObject`, `DataProcessorObject`, префиксы и namespace.

- [ ] **Step 4: Запустить зелёную стадию и полный набор TypeDescription**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate metadata/commonObjects/typeDescription
```

Expected: PASS.

- [ ] **Step 5: Создать коммит задачи**

```bash
git add packages/core/metadata/commonObjects/typeDescription/types.ts packages/core/metadata/commonObjects/typeDescription/toXML.test.ts
git commit -m "fix: :bug: канонизировать контейнеры TypeDescription"
```

### Task 3: Пустой ExtendedTooltip.Title и ограничение HeaderHorizontalAlign

**Files:**
- Modify: `packages/core/metadata/forms/elements/extendedTooltip/rules.ts:69-74`
- Modify: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts`
- Verify: `.agents/restrictions.md` — запись про `HeaderHorizontalAlign=Auto` уже существует и не дублируется.

**Interfaces:**
- Consumes: `formattedI8nTextRule({ preserveEmptyXML: true })` и существующий `implicitValueYAML: "Auto"` табличных полей.
- Produces: YAML `{ Форматированный: Истина, Текст: "" }` для явного пустого форматированного Title; отсутствие Title остаётся отсутствием; явный XML Auto канонизируется в отсутствие тега у четырёх типов колонок.

- [ ] **Step 1: Добавить падающий round-trip пустого форматированного заголовка**

В `fromXMLToYAML.test.ts` импортировать `ExtendedTooltipRules` и добавить:

```ts
it("сохраняет пустой форматированный заголовок ExtendedTooltip без reference", () => {
  const yaml = testMetadataItemFromXMLToYAML({
    rule: ExtendedTooltipRules,
    xml: { _name: "ПолеРасширеннаяПодсказка", Title: { _formatted: true } },
    name: "ПолеРасширеннаяПодсказка",
  }).yaml

  expect(yaml).toMatchObject({
    Заголовок: { Форматированный: "Истина", Текст: "" },
  })
  expect(testMetadataItemFromYAMLToXML({
    rule: ExtendedTooltipRules,
    yaml,
    name: "ПолеРасширеннаяПодсказка",
  }).xml).toHaveProperty("Title", { _formatted: true })
})

it("не создаёт отсутствующий заголовок ExtendedTooltip", () => {
  expect(testMetadataItemFromYAMLToXML({
    rule: ExtendedTooltipRules,
    yaml: {},
    name: "ПолеРасширеннаяПодсказка",
  }).xml).not.toHaveProperty("Title")
})
```

- [ ] **Step 2: Запустить красную стадию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate metadata/forms/elements/__tests__/fromXMLToYAML.test.ts
```

Expected: явный пустой `Title` теряется; проверка отсутствующего Title проходит.

- [ ] **Step 3: Включить стандартное сохранение пустого XML**

Изменить только правило заголовка:

```ts
title: formattedI8nTextRule({
  yaml: "Заголовок",
  preserveEmptyXML: true,
}),
```

Не добавлять пользовательские преобразователи и не менять `FormattedI8nText`.

- [ ] **Step 4: Добавить характеристическую проверку согласованной канонизации Auto**

В тот же тест импортировать `TableInputFieldRules`, `TableLabelFieldRules`, `TablePictureFieldRules`, `TableCheckBoxFieldRules` и добавить:

```ts
it.each([
  TableInputFieldRules,
  TableLabelFieldRules,
  TablePictureFieldRules,
  TableCheckBoxFieldRules,
])("canonicalizes explicit table HeaderHorizontalAlign=Auto to an absent XML tag", (rule) => {
  const yaml = testMetadataItemFromXMLToYAML({
    rule,
    xml: { _name: "Колонка", DataPath: "Таблица.Поле", HeaderHorizontalAlign: "Auto" },
    name: "Колонка",
  }).yaml
  expect(yaml).not.toHaveProperty("ГоризонтальноеПоложениеВШапке")
  expect(testMetadataItemFromYAMLToXML({ rule, yaml, name: "Колонка" }).xml)
    .not.toHaveProperty("HeaderHorizontalAlign")
})
```

Этот тест фиксирует уже выбранное ограничение и не требует production-изменения.

- [ ] **Step 5: Запустить зелёную стадию**

Run ту же команду Vitest. Expected: PASS, включая существующую XML-фикстуру `formattedEmptyTitle.xml` без её изменения.

- [ ] **Step 6: Создать коммит задачи**

```bash
git add packages/core/metadata/forms/elements/extendedTooltip/rules.ts packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts
git commit -m "fix: :bug: сохранить пустой заголовок подсказки"
```

### Task 4: Полная проверка и round-trip doc

**Files:**
- Verify only: production/test files Tasks 1-3
- Diagnostic target: `/Users/nikita/git/round-trip-compact/cf/doc`

**Interfaces:**
- Consumes: чистая ветка после атомарных коммитов, установленный jscpd `5.0.12`, skill `round-trip-yaml`.
- Produces: подтверждённый список оставшихся XML-diff; согласованные группы исчезают, допустимые канонизации перечисляются отдельно.

- [ ] **Step 1: Проверить типы, весь проект и новые дубли**

Run последовательно из корня worktree:

```bash
pnpm type-check
pnpm test
pnpm duplicates
```

Expected: все команды завершаются с кодом `0`; `pnpm duplicates` сообщает об отсутствии новых дублей. Stryker не запускать.

- [ ] **Step 2: Проверить чистоту и подготовить внешний XML-репозиторий**

Run:

```bash
git status --short
git -C /Users/nikita/git/round-trip-compact status --short
git -C /Users/nikita/git/round-trip-compact restore --worktree --staged -- cf/doc
git -C /Users/nikita/git/round-trip-compact clean -fd -- cf/doc
```

Expected: worktree NKDK чистый; `cf/doc` возвращён к исходному tracked-состоянию, untracked-файлы внутри `cf/doc` удалены. Это удаление заранее разрешено пользователем для round-trip.

- [ ] **Step 3: Запустить полный round-trip конфигурации doc**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 200
```

Expected: отсутствуют группы:

- defaults 33 форм документов;
- defaults 29 форм отчётов;
- 18 потерь `v8:TypeSet`;
- 24 пустых форматированных `ExtendedTooltip.Title` в шести формах;
- уже исправленные defaults справочника, обязательные узлы, дополнения Gantt, порядок CommandInterface и объектно-зависимые поля.

При оценке не считать ошибками:

- `Period`, `TopLevelParent`, `RowFilter`;
- девять канонизаций явного `HeaderHorizontalAlign=Auto` в отсутствие тега.

Namespace-префиксы TypeDescription, `EqualItemsWidth`, `Edit` и изменения `DataPath` не имеют согласованного решения в текущих спецификациях. Если они остаются, их нужно перечислить отдельным остатком и не объявлять весь round-trip закрытым до отдельного проектирования.

- [ ] **Step 4: Зафиксировать фактический итог без изменения XML-репозитория**

Сохранить в отчёте выполнения:

- число diff-файлов и XML-узлов после исключения допустимых групп;
- по одному пути-примеру каждой оставшейся причины;
- абсолютный путь временного YAML-каталога из вывода skill;
- хэши трёх implementation-коммитов;
- результаты `pnpm type-check`, `pnpm test`, `pnpm duplicates`.

Не коммитить изменения `/Users/nikita/git/round-trip-compact` и не откатывать его после диагностики: diff является результатом round-trip.

---

## Self-Review

- Покрыты все ещё не реализованные решения спецификации `2026-08-02-form-contextual-defaults-design.md`: документ, отчёт, восемь TypeDescription, ExtendedTooltip и HeaderHorizontalAlign.
- Исправление справочника включено как завершённая предпосылка и не дублируется.
- Уже выполненные планы `reference-free-form-xml-contract` и `owner-specific-attribute-tabular-section-rules` не повторяются.
- В плане нет изменений XML-фикстур, reference, новых общих признаков правил или Stryker.
- Неисследованные namespace-префиксы, `EqualItemsWidth`, `Edit` и `DataPath` явно вынесены в остаток: для них нельзя честно писать production-шаги до согласования договора.
