# All Agreed Doc Round-Trip Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить все ещё не реализованные, но уже согласованные расхождения round-trip конфигурации `doc`: контекстные XML-defaults форм документа и отчёта, контейнеры TypeDescription, пустые форматированные заголовки ExtendedTooltip, namespace-префиксы, `EqualItemsWidth`, `GraphicalSchemaField.Edit` и неверное YAML-имя стандартного `Task.Description`; закрепить согласованную канонизацию `HeaderHorizontalAlign=Auto`.

**Architecture:** Контекст формы определяется по её основному реквизиту и локальному `formDataPathIndex`; общие metadata-слои не получают знаний о документах и отчётах. Смысловые defaults и имена выражаются существующими параметрами `rules.ts` и регистрациями стандартных членов, а технические namespace-префиксы восстанавливаются локально по XML-свойству и вложенности. Reference XML, configuration index для восстановления лексического XML, новые признаки правил и новые специальные fromXML/toXML не добавляются.

**Tech Stack:** TypeScript 7, Vitest 4, TypeBox, декларативные `rules.ts`, metadata validation, `round-trip-yaml`, jscpd через `pnpm duplicates`.

## Global Constraints

- План выполняется от коммита `af04b6dd7`; исправление defaults справочника `9/25` уже реализовано и повторно в план не входит.
- Уже реализованы договоры `Button.Type`, `EnableContentChange`, `AutoCellHeight`, `RadioButtonType`, `UseForFoldersAndItems`, обязательные `PredefinedItem.Code/Description`, `Characteristics`, `StyleItem.Type`, дополнения `GanttChartField`, порядок `CommandInterface.Item` и объектно-зависимые правила реквизитов/табличных частей.
- Существующие XML-фикстуры не изменять: они являются источником истины. Разрешены изменения только TypeScript-ожиданий YAML.
- Не добавлять `reference`, новые поля `BasePropertyRule`/`PropertyRule`, параметры построителей или частные условия в `orchestration`, `validation` и `project`.
- Не добавлять fromXML/toXML/fromYAML/toYAML; использовать существующие правила, локальные callbacks и регистрацию типов.
- Не запускать Stryker или другие проверки мутантов.
- `Period`, `TopLevelParent` и `RowFilter` не блокируют итоговый round-trip.
- Явный XML `HeaderHorizontalAlign=Auto` канонизируется в отсутствие тега и фиксируется в `.agents/restrictions.md`; reference/index для него не добавляется.
- `EqualItemsWidth` сохраняет три состояния: отсутствует, явная `Истина`, явная `Ложь`; условная валидация по `CheckBoxType` не добавляется.
- `GraphicalSchemaField.Edit` имеет платформенный default `Истина`; YAML сохраняет явную `Ложь`.
- Стандартный `Task.Description` называется в YAML `Наименование`; пользовательский реквизит `Описание` остаётся без преобразования.
- XDTO- и `PredefinedItem.Type`-префиксы не попадают в YAML и восстанавливаются без reference/index.
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
- `packages/core/metadata/commonObjects/xdtoTypeName/toXML.ts` — выбирает пользовательский XDTO-префикс по XML-свойству.
- `packages/core/metadata/commonObjects/xdtoTypeName/toXML.test.ts` — договор `d6p1` возвращаемого значения и `d8p1` параметра.
- `packages/core/metadata/commonObjects/predefinedItem/types.ts` — регистрирует нормализацию префикса `PredefinedItem.Type` по вложенности.
- `packages/core/metadata/commonObjects/predefinedItem/fromYAMLToXML.test.ts` — четыре уровня `d4p1`/`d6p1`/`d8p1`/`d10p1`.
- `packages/core/metadata/forms/elements/checkBoxField/rules.ts` — сохраняет явные boolean-состояния `EqualItemsWidth`.
- `packages/core/metadata/forms/elements/graphicalSchemaField/rules.ts` — публикует `Edit` в YAML с неявной `Истиной`.
- `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts` — декларативные defaults `EqualItemsWidth` и `Edit`.
- `packages/core/metadata/appliedObjects/metadataTask/rules.ts` — имя `Наименование` в описаниях стандартных реквизитов задачи.
- `packages/core/metadata/appliedObjects/metadataTask/standardMembers.ts` — имя `Наименование` в DataPath задачи.
- `packages/core/metadata/validation/dataPath/objectFields.test.ts` — индекс стандартного `Task.Description`.
- `packages/core/metadata/validation/dataPath/resolver.test.ts` — различение стандартного `Наименование` и пользовательского `Описание`.

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

### Task 4: Контекстные namespace-префиксы

**Files:**
- Modify: `packages/core/metadata/commonObjects/xdtoTypeName/toXML.ts:5-55`
- Modify: `packages/core/metadata/commonObjects/xdtoTypeName/toXML.test.ts:1-40`
- Modify: `packages/core/metadata/commonObjects/predefinedItem/types.ts:1-25`
- Modify: `packages/core/metadata/commonObjects/predefinedItem/fromYAMLToXML.test.ts:1-125`

**Interfaces:**
- Consumes: `PropertyRule.xml`, `registerMetadataItemCollectionRule.mapItemOutput`, готовый XML одного `PredefinedItem`.
- Produces: `XDTOReturningValueType` с `d6p1`, `XDTOValueType` с `d8p1`; `normalizePredefinedItemTypePrefixes(xml, depth)` с префиксами `d4p1`, `d6p1`, `d8p1`, `d10p1` по уровню.

- [ ] **Step 1: Добавить падающий тест XDTO-префиксов**

В `xdtoTypeName/toXML.test.ts` импортировать `MetadataWebServiceOperationRules` и
`MetadataWebServiceParameterRules`, заменить общий тест пользовательского namespace табличным:

```ts
it.each([
  {
    rule: MetadataWebServiceOperationRules.properties.xdtoReturningValueType,
    xml: "XDTOReturningValueType",
    prefix: "d6p1",
  },
  {
    rule: MetadataWebServiceParameterRules.properties.xdtoValueType,
    xml: "XDTOValueType",
    prefix: "d8p1",
  },
] as const)("exports custom namespace for $xml with $prefix", ({ rule, prefix }) => {
  expect(
    exportXDTOTypeNameToXML(context, rule, {
      namespace: "http://www.1c.ru/dmil",
      name: "DMILResponse",
    })
  ).toEqual({
    "#text": `${prefix}:DMILResponse`,
    [`_xmlns:${prefix}`]: "http://www.1c.ru/dmil",
  })
})
```

Существующие проверки `xs:string` и `v8:Structure` оставить без изменения.

- [ ] **Step 2: Добавить падающий тест четырёх уровней PredefinedItem**

В `predefinedItem/fromYAMLToXML.test.ts` добавить:

```ts
it("restores current-config Type prefixes by predefined item depth", () => {
  const xml = convertCollection(
    {
      Корень: {
        ТипЗначения: "Справочник.ЗначенияХарактеристик",
        Элементы: {
          Дочерний: {
            ТипЗначения: "Справочник.ЗначенияХарактеристик",
            Элементы: {
              Третий: {
                ТипЗначения: "Справочник.ЗначенияХарактеристик",
                Элементы: {
                  Четвертый: { ТипЗначения: "Справочник.ЗначенияХарактеристик" },
                },
              },
            },
          },
        },
      },
    },
    chartContext()
  )

  const prefixes = [...xml.matchAll(/<v8:Type xmlns:(d\d+p1)="http:\/\/v8\.1c\.ru\/8\.1\/data\/enterprise\/current-config">\1:CatalogRef\.ЗначенияХарактеристик<\/v8:Type>/g)]
    .map((match) => match[1])
  expect(prefixes).toEqual(["d4p1", "d6p1", "d8p1", "d10p1"])
})
```

- [ ] **Step 3: Запустить красную стадию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate metadata/commonObjects/xdtoTypeName/toXML.test.ts metadata/commonObjects/predefinedItem/fromYAMLToXML.test.ts
```

Expected: параметр получает `d6p1` вместо `d8p1`; предопределённые элементы используют `cfg`.

- [ ] **Step 4: Выбирать XDTO-префикс по правилу свойства**

В `xdtoTypeName/toXML.ts` удалить `matchingReferencePrefix`, переименовать неиспользуемый
`referenceValue` в `_referenceValue` и заменить выбор prefix:

```ts
const prefixForNamespace = (namespace: string, rule: PropertyRule | undefined): string => {
  if (namespace === XML_SCHEMA_NAMESPACE) return "xs"
  if (namespace === V8_DATA_CORE_NAMESPACE) return "v8"
  return rule?.xml === "XDTOValueType" ? "d8p1" : "d6p1"
}

const prefix = prefixForNamespace(value.namespace, rule)
```

Имя и URI типа не менять. Не добавлять новое поле в `PropertyRule`.

- [ ] **Step 5: Нормализовать PredefinedItem.Type по глубине**

В `predefinedItem/types.ts` добавить локальную функцию и передать её в регистрацию коллекции:

```ts
const CURRENT_CONFIG_NAMESPACE = "http://v8.1c.ru/8.1/data/enterprise/current-config"

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function normalizePredefinedItemTypePrefixes(
  xml: Record<string, unknown>,
  depth = 0
): Record<string, unknown> {
  const prefix = `d${4 + depth * 2}p1`
  const type = asRecord(xml.Type)
  const qname = asRecord(type?.["v8:Type"])
  const namespaceEntry = Object.entries(qname ?? {}).find(
    ([key, value]) => key.startsWith("_xmlns:") && value === CURRENT_CONFIG_NAMESPACE
  )
  const text = qname?.["#text"]
  let result = xml

  if (type !== undefined && qname !== undefined && namespaceEntry !== undefined && typeof text === "string") {
    const sourcePrefix = namespaceEntry[0].slice("_xmlns:".length)
    if (text.startsWith(`${sourcePrefix}:`)) {
      const qnameRest = { ...qname }
      delete qnameRest[namespaceEntry[0]]
      result = {
        ...result,
        Type: {
          ...type,
          "v8:Type": {
            ...qnameRest,
            "#text": `${prefix}:${text.slice(sourcePrefix.length + 1)}`,
            [`_xmlns:${prefix}`]: CURRENT_CONFIG_NAMESPACE,
          },
        },
      }
    }
  }

  const childItems = asRecord(result.ChildItems)
  if (childItems === undefined || childItems.Item === undefined) return result
  const sourceItems = Array.isArray(childItems.Item) ? childItems.Item : [childItems.Item]
  const mappedItems = sourceItems.map((item) => {
    const record = asRecord(item)
    return record === undefined ? item : normalizePredefinedItemTypePrefixes(record, depth + 1)
  })
  return {
    ...result,
    ChildItems: {
      ...childItems,
      Item: Array.isArray(childItems.Item) ? mappedItems : mappedItems[0],
    },
  }
}
```

В `registerMetadataItemCollectionRule({ propertyType: "PredefinedItemCollection", ... })` добавить:

```ts
mapItemOutput: ({ xml }) => normalizePredefinedItemTypePrefixes(xml),
```

- [ ] **Step 6: Запустить зелёную стадию**

Run ту же команду Vitest. Expected: PASS; встроенные `xs`/`v8` и пустой `Type` также остаются
зелёными.

- [ ] **Step 7: Создать коммит задачи**

```bash
git add packages/core/metadata/commonObjects/xdtoTypeName packages/core/metadata/commonObjects/predefinedItem
git commit -m "fix: :bug: восстановить контекстные XML-префиксы"
```

### Task 5: Трёхзначный договор EqualItemsWidth

**Files:**
- Modify: `packages/core/metadata/forms/elements/checkBoxField/rules.ts:10-31`
- Modify: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts:1-330`
- Modify: `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts:1250-1295`

**Interfaces:**
- Consumes: общий `CheckBoxFieldCommonRulesProperties`, стандартный boolean XML/YAML converter.
- Produces: отсутствие XML/YAML как `Авто`; явные `true`/`false` как `Истина`/`Ложь` для обычного и табличного `CheckBoxField`.

- [ ] **Step 1: Добавить падающий round-trip трёх состояний**

В `forms/elements/__tests__/fromXMLToYAML.test.ts` добавить:

```ts
it.each([CheckBoxFieldRules, TableCheckBoxFieldRules])(
  "$itemType сохраняет три состояния EqualItemsWidth",
  (rule) => {
    const cases = [
      [{ _name: "Флажок" }, undefined, undefined],
      [{ _name: "Флажок", EqualItemsWidth: true }, "Истина", true],
      [{ _name: "Флажок", EqualItemsWidth: false }, "Ложь", false],
    ] as const

    for (const [xml, yamlValue, restoredValue] of cases) {
      const yaml = testMetadataItemFromXMLToYAML({ rule, xml, name: "Флажок" }).yaml
      if (yamlValue === undefined) expect(yaml).not.toHaveProperty("ОдинаковаяШиринаЭлементов")
      else expect(yaml).toHaveProperty("ОдинаковаяШиринаЭлементов", yamlValue)

      const restored = testMetadataItemFromYAMLToXML({ rule, yaml, name: "Флажок" }).xml
      if (restoredValue === undefined) expect(restored).not.toHaveProperty("EqualItemsWidth")
      else expect(restored).toHaveProperty("EqualItemsWidth", restoredValue)
    }
  }
)
```

- [ ] **Step 2: Исправить декларативный тест default**

В `implicitValueYAMLContract.test.ts` удалить `equalItemsWidth: false` из `expected` проверки checkbox
и добавить `"equalItemsWidth"` в `expectedNoImplicitValueYAML` вместе с `skipOnInput`.

- [ ] **Step 3: Запустить красную стадию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate metadata/forms/elements/__tests__/fromXMLToYAML.test.ts metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: явная `Ложь` теряется, декларативный тест требует `noImplicitValueYAML`.

- [ ] **Step 4: Заменить ошибочный YAML-default**

В `CheckBoxFieldCommonRulesProperties` изменить только одно правило:

```ts
equalItemsWidth: {
  yaml: "ОдинаковаяШиринаЭлементов",
  type: "boolean",
  noImplicitValueYAML: true,
},
```

Не добавлять условие по `CheckBoxType`, callback или строковое значение `Авто`.

- [ ] **Step 5: Запустить зелёную стадию**

Run ту же команду Vitest. Expected: PASS для обоих правил и всех трёх состояний.

- [ ] **Step 6: Создать коммит задачи**

```bash
git add packages/core/metadata/forms/elements/checkBoxField/rules.ts packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
git commit -m "fix: :bug: сохранить явный EqualItemsWidth"
```

### Task 6: YAML-договор GraphicalSchemaField.Edit

**Files:**
- Modify: `packages/core/metadata/forms/elements/graphicalSchemaField/rules.ts:70-85`
- Modify: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts:1-370`
- Modify: `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts:870-900`

**Interfaces:**
- Consumes: `booleanRule`, платформенный default `Edit=true`.
- Produces: отсутствующий/явный `true` канонизируются в отсутствие YAML/XML; явный `false` сохраняется как `Редактирование: Ложь` и `<Edit>false</Edit>`.

- [ ] **Step 1: Добавить падающий round-trip Edit**

Импортировать `GraphicalSchemaFieldRules` в `forms/elements/__tests__/fromXMLToYAML.test.ts` и
добавить:

```ts
it("сохраняет явный GraphicalSchemaField.Edit=false", () => {
  const absent = testMetadataItemFromXMLToYAML({
    rule: GraphicalSchemaFieldRules,
    xml: { _name: "Схема" },
    name: "Схема",
  }).yaml
  expect(absent).not.toHaveProperty("Редактирование")
  expect(
    testMetadataItemFromYAMLToXML({ rule: GraphicalSchemaFieldRules, yaml: absent, name: "Схема" }).xml
  ).not.toHaveProperty("Edit")

  const explicitFalse = testMetadataItemFromXMLToYAML({
    rule: GraphicalSchemaFieldRules,
    xml: { _name: "Схема", Edit: false },
    name: "Схема",
  }).yaml
  expect(explicitFalse).toHaveProperty("Редактирование", "Ложь")
  expect(
    testMetadataItemFromYAMLToXML({ rule: GraphicalSchemaFieldRules, yaml: explicitFalse, name: "Схема" }).xml
  ).toHaveProperty("Edit", false)

  const explicitTrue = testMetadataItemFromXMLToYAML({
    rule: GraphicalSchemaFieldRules,
    xml: { _name: "Схема", Edit: true },
    name: "Схема",
  }).yaml
  expect(explicitTrue).not.toHaveProperty("Редактирование")
})
```

- [ ] **Step 2: Добавить декларативную проверку**

В проверку defaults `GraphicalSchemaFieldRules` добавить `edit: true` и отдельные утверждения:

```ts
expect(GraphicalSchemaFieldRules.properties.edit).toMatchObject({
  implicitValueYAML: true,
  toEnterprise: false,
})
expect(GraphicalSchemaFieldRules.properties.edit).not.toHaveProperty("toYAML")
expect(GraphicalSchemaFieldRules.properties.edit).not.toHaveProperty("fromYAML")
```

- [ ] **Step 3: Запустить красную стадию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate metadata/forms/elements/__tests__/fromXMLToYAML.test.ts metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: `Edit=false` отсутствует в YAML, правило содержит запрещающие флаги.

- [ ] **Step 4: Сделать Edit смысловым YAML-свойством**

В `graphicalSchemaField/rules.ts` заменить правило:

```ts
edit: booleanRule({
  yaml: "Редактирование",
  implicitValueYAML: true,
  toEnterprise: false,
}),
```

Не добавлять defaults по `ReadOnly` или `DataPath`.

- [ ] **Step 5: Запустить зелёную стадию**

Run ту же команду Vitest. Expected: PASS.

- [ ] **Step 6: Создать коммит задачи**

```bash
git add packages/core/metadata/forms/elements/graphicalSchemaField/rules.ts packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
git commit -m "fix: :bug: сохранить GraphicalSchemaField.Edit"
```

### Task 7: Корректное имя стандартного Task.Description

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataTask/rules.ts:30-39`
- Modify: `packages/core/metadata/appliedObjects/metadataTask/standardMembers.ts:3-10`
- Modify: `packages/core/metadata/validation/dataPath/objectFields.test.ts:230-255`
- Modify: `packages/core/metadata/validation/dataPath/resolver.test.ts:95-130,1820-1870`

**Interfaces:**
- Consumes: существующий индекс полей владельца и декларации `registerStandardMembers`.
- Produces: `Description ↔ Наименование` для задачи; пользовательский `Описание` остаётся точным полем без replacement.

- [ ] **Step 1: Изменить ожидания индекса стандартных полей задачи**

В `objectFields.test.ts` заменить договор `Description`:

```ts
expect(resolveObjectFieldSegment({ index, segment: "Description", nameMode: "internal" })).toMatchObject({
  name: "Наименование",
  kind: "standardAttribute",
})
expect(index.fields.get("Наименование")).toMatchObject({
  name: "Наименование",
  kind: "standardAttribute",
})
```

- [ ] **Step 2: Зафиксировать оба разных DataPath задачи**

В `resolver.test.ts`:

- в табличной проверке стандартных реквизитов заменить
  `["Объект.Описание", "Описание"]` на `["Объект.Наименование", "Наименование"]`;
- заменить проверку `prefers an exact owner field...` полной проверкой обоих имён и обоих корней:

```ts
it.each([
  ["Объект", "TaskObject.ЗадачаИсполнителя", "ЗадачаОбъект"],
  ["Список", "TaskRef.ЗадачаИсполнителя", "Задача"],
] as const)("keeps a task attribute distinct from standard Description through %s", (root, type, ownerKind) => {
  const model = {
    itemType: "MetadataTask" as const,
    attributes: [{ name: "Описание", type: { type: ["string"] } }],
  }
  const owners = ownerCache([
    owner({
      ref: { kind: "ЗадачаОбъект", name: "ЗадачаИсполнителя" },
      rule: MetadataTaskRules,
      model,
    }),
    owner({
      ref: { kind: "Задача", name: "ЗадачаИсполнителя" },
      rule: MetadataTaskRules,
      model,
    }),
  ])
  const index = indexWithAttributes([attribute(root, { type: [type] })])

  expect(
    resolveDataPathCore({
      value: `${root}.Наименование`,
      nameMode: "yaml",
      index,
      ownerCache: owners,
    })
  ).toMatchObject({
    status: "ok",
    replacements: [{ segmentIndex: 1, from: "Наименование", to: "Description", reason: "standardMember" }],
    target: { source: { kind: "objectField", owner: { kind: ownerKind }, name: "Наименование" } },
  })

  expect(
    resolveDataPathCore({
      value: `${root}.Description`,
      nameMode: "internal",
      index,
      ownerCache: owners,
    })
  ).toMatchObject({
    status: "ok",
    replacements: [{ segmentIndex: 1, from: "Description", to: "Наименование", reason: "standardMember" }],
  })

  expect(
    resolveDataPathCore({
      value: `${root}.Описание`,
      nameMode: "yaml",
      index,
      ownerCache: owners,
    })
  ).toMatchObject({
    status: "ok",
    replacements: [],
    target: { source: { kind: "objectField", owner: { kind: ownerKind }, name: "Описание" } },
  })
})
```

- [ ] **Step 3: Запустить красную стадию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate metadata/validation/dataPath/objectFields.test.ts metadata/validation/dataPath/resolver.test.ts
```

Expected: индекс и resolver всё ещё называют стандартный `Description` словом `Описание`.

- [ ] **Step 4: Исправить две регистрации задачи**

В `metadataTask/rules.ts`:

```ts
Description: "Наименование",
```

В `metadataTask/standardMembers.ts`:

```ts
{
  memberKind: "standardAttribute",
  names: { internal: "Description", yaml: "Наименование" },
  family: "primitive",
  phase: "index-time",
  sourceScope: "self",
  kind: "string",
},
```

Общий resolver и пользовательский атрибут `Описание` не менять.

- [ ] **Step 5: Запустить зелёную стадию и покрытие регистраций**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate metadata/validation/dataPath/objectFields.test.ts metadata/validation/dataPath/resolver.test.ts metadata/validation/dataPath/standardMembers.coverage.test.ts
```

Expected: PASS; `Объект.Наименование` резолвится в `Description`, `Объект.Описание` — в
пользовательский реквизит.

- [ ] **Step 6: Создать коммит задачи**

```bash
git add packages/core/metadata/appliedObjects/metadataTask packages/core/metadata/validation/dataPath/objectFields.test.ts packages/core/metadata/validation/dataPath/resolver.test.ts
git commit -m "fix: :bug: исправить имя Description задачи"
```

### Task 8: Полная проверка и round-trip doc

**Files:**
- Verify only: production/test files Tasks 1-7
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
- 15 замен согласованных namespace-префиксов у XDTO и `PredefinedItem.Type`;
- потеря явного `EqualItemsWidth=false`;
- потеря явного `GraphicalSchemaField.Edit=false`;
- замена пользовательского `Объект.Описание` на стандартный `Объект.Description` у задачи;
- уже исправленные defaults справочника, обязательные узлы, дополнения Gantt, порядок CommandInterface и объектно-зависимые поля.

При оценке не считать ошибками:

- `Period`, `TopLevelParent`, `RowFilter`;
- девять канонизаций явного `HeaderHorizontalAlign=Auto` в отсутствие тега.

Любое оставшееся расхождение, кроме перечисленных допустимых канонизаций, записать отдельной причиной и
не объявлять весь согласованный набор закрытым без анализа.

- [ ] **Step 4: Зафиксировать фактический итог без изменения XML-репозитория**

Сохранить в отчёте выполнения:

- число diff-файлов и XML-узлов после исключения допустимых групп;
- по одному пути-примеру каждой оставшейся причины;
- абсолютный путь временного YAML-каталога из вывода skill;
- хэши семи implementation-коммитов;
- результаты `pnpm type-check`, `pnpm test`, `pnpm duplicates`.

Не коммитить изменения `/Users/nikita/git/round-trip-compact`.

- [ ] **Step 5: Вернуть внешний XML-репозиторий в исходное состояние**

После сохранения статистики выполнить:

```bash
git -C /Users/nikita/git/round-trip-compact restore --worktree --staged -- cf/doc
git -C /Users/nikita/git/round-trip-compact clean -fd -- cf/doc
git -C /Users/nikita/git/round-trip-compact status --short -- cf/doc
```

Expected: последняя команда ничего не выводит. Удаление untracked-файлов внутри `cf/doc` заранее
разрешено пользователем.

---

## Self-Review

- Покрыты все ещё не реализованные решения спецификации `2026-08-02-form-contextual-defaults-design.md`: документ, отчёт, восемь TypeDescription, ExtendedTooltip и HeaderHorizontalAlign.
- Покрыты спецификации `2026-08-02-contextual-namespace-prefixes-design.md`,
  `2026-08-02-check-box-equal-items-width-design.md`,
  `2026-08-02-graphical-schema-edit-design.md` и
  `2026-08-02-task-description-datapath-name-design.md`.
- Исправление справочника включено как завершённая предпосылка и не дублируется.
- Уже выполненные планы `reference-free-form-xml-contract` и `owner-specific-attribute-tabular-section-rules` не повторяются.
- В плане нет изменений XML-фикстур, reference, новых общих признаков правил или Stryker.
- Все согласованные группы имеют отдельную красную/зелёную стадию и атомарный implementation-коммит.
- Внешний репозиторий после итоговой диагностики обязательно возвращается к HEAD.
