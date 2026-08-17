# Form Conditional Appearance Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Проверять параметры оформления, оформляемые элементы и типизированные операнды условий в условном оформлении формы и `DynamicList`, сохраняя неразрешимые импортированные значения как согласованные XML-аномалии.

**Architecture:** Общий resolver получает декларативный граф составных типов и независимые представления доступности через `dataPaths`; `BasePropertyRule` и `PropertyRule` не расширяются. Валидатор условного оформления использует эффективный индекс формы, нейтральный resolver и нормализованные конечные типы, а импортный завершающий проход ставит теги только после неуспешного разрешения.

**Tech Stack:** TypeScript, TypeBox, Vitest, metadata rules composition, form validation passes, XML-anomaly infrastructure.

## Global Constraints

- Спецификация: `docs/superpowers/specs/2026-08-17-form-conditional-appearance-validation-design.md`.
- База проверки дублей: `75e10f274`.
- Существующие XML-фикстуры не изменяются.
- Верхнеуровневое оформление и оформление `DynamicList` проходят один обработчик; полного исключения для `DynamicList` нет.
- Неразрешимое импортированное поле условия получает `!xml/value`, оформляемый элемент — `!xml/reference`; предупреждения не создаются.
- Resolver не запускается для уже помеченного значения. Тег сохраняется до ручного удаления.
- Ручное неизвестное значение без тега является ошибкой.
- Матрица `ВидСравнения × тип значения` не реализуется.
- При неизвестном типе, `<any>` или теге совместимость пары не проверяется.
- Для `Поля` проверяется существование элемента, но не ограничивается его вид.
- `Оформление.Текст/Формат` с `Тип: Поле` остаются только структурно проверяемыми.
- После каждого слоя выполняется `pnpm duplicates -- --base 75e10f274`.
- В worktree уже есть незавершённые изменения двух файлов `appearanceFields`; их нужно проверить по TDD-циклу задачи 1, не отбрасывать и не смешивать с другими коммитами.

---

### Task 1: Закрытый каталог параметров оформления

**Files:**
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts`

**Interfaces:**
- Consumes: `AppearanceFieldsRules`, `createSettingsParameterValueJSONSchema`, `BooleanJSONSchema`, `HorizontalAlign`.
- Produces: `exportAppearanceFieldsToJSONSchema`, принимающий только 12 известных параметров и согласованные формы их значений.

- [x] **Step 1: Проверить незавершённый diff**

  Run: `git diff -- packages/rules/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.ts packages/rules/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts`

  Схема должна содержать `additionalProperties: false`, отдельные схемы цвета, шрифта, горизонтального положения, строкового значения и nullable boolean; тест не должен ослаблять существующие проверки.

- [x] **Step 2: Дополнить падающую проверку закрытого договора**

  ```ts
  it("rejects an unknown appearance parameter", () => {
    expect(compiledAppearanceFieldsSchema.Check({ НеизвестноеОформление: "Истина" })).toBe(false)
  })
  ```

  В одном `it.each` оставить проверки `Истина`, `Ложь`, `{ Значение: "Истина" }`, `null`, числа, строки и массива для `ВыделятьОтрицательные`, `ОтметкаНезаполненного`, `Видимость`, `Доступность`, `ТолькоПросмотр`, `Отображать`.

- [x] **Step 3: Получить RED или подтвердить уже выполненный GREEN**

  Run: `pnpm --filter @nkdk/rules exec vitest run metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts`

  Expected: новый тест падает до реализации; если незавершённый diff уже реализует договор, тест проходит и diff сверяется со Step 1.

- [x] **Step 4: Довести реализацию до минимального каталога**

  ```ts
  const AppearanceBooleanValueJSONSchema = Nullable(BooleanJSONSchema)
  // ЦветФона/ЦветТекста -> nullable Color
  // Шрифт -> nullable StrictFont
  // ГоризонтальноеПоложение -> nullable HorizontalAlign
  // Формат/Текст -> canonical string/i18n/formatted/Field
  // шесть флагов -> nullable boolean
  ```

  Не добавлять параметры в `AppearanceFieldsRules` и не разрешать `Тип: Поле` в этом слое.

- [x] **Step 5: Подтвердить GREEN, проверить дубли и зафиксировать слой**

  Run: `pnpm --filter @nkdk/rules exec vitest run metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts`

  Run: `pnpm duplicates -- --base 75e10f274`

  ```bash
  git add packages/rules/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.ts packages/rules/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts
  git commit -m "fix: :bug: ограничить параметры условного оформления"
  ```

---

### Task 2: Общий типизированный граф и представления доступности

**Files:**
- Create: `packages/runtime/metadata/validation/dataPath/typedGraph.ts`
- Create: `packages/runtime/metadata/validation/dataPath/typedGraph.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/dataPath/types.ts`
- Modify: `packages/runtime/metadata/validation/dataPath/registry.ts`
- Modify: `packages/runtime/metadata/validation/dataPath/registrySet.test.ts`
- Modify: `packages/rules/metadata/validation/dataPath/coreResolver.ts`
- Modify: `packages/rules/metadata/validation/dataPath/resolver.test.ts`

**Interfaces:**
- Produces: `DataPathGraphTarget`, `TypedDataPathTypeDeclaration`, `DataPathViewDeclaration`, вклады `typedGraph`/`dataPathView`, методы registry `resolveTypedMember`/`checkTraceAvailability`, функции-обёртки `resolveTypedDataPathMember`/`checkDataPathTraceAvailability` и `ResolvedDataPathTarget.trace`.
- Consumes: существующий `DataPathTypeInfo`, таблицы, type resolvers и перевод имён.

- [x] **Step 1: Добавить падающие unit-тесты графа**

  ```ts
  const graph: readonly TypedDataPathTypeDeclaration[] = [{
    type: "Root",
    aliases: ["Корень"],
    members: [
      { internal: "Nested", yaml: "Вложенное", target: { kind: "structured", type: "Nested" } },
      { internal: "Rows", yaml: "Строки", target: { kind: "collection", itemType: "Row" } },
      { internal: "Flag", yaml: "Флаг", target: { kind: "terminal", terminalTypes: ["boolean"] } },
    ],
  }, {
    type: "Nested",
    members: [{ internal: "Date", yaml: "Дата", target: { kind: "terminal", terminalTypes: ["dateTime"] } }],
  }]
  ```

  Проверить псевдоним типа, внутреннее/YAML-имя члена, три вида цели и неизвестное свойство.

- [x] **Step 2: Добавить падающие тесты view**

  ```ts
  const view: DataPathViewDeclaration = {
    purpose: "formConditionalFilter",
    types: { Root: ["Nested", "Flag"], Nested: ["Date"] },
  }
  ```

  Проверить `available` для `Root.Nested.Date`, `unavailable` для `Root.Rows` и отсутствие ограничения у трассы без составных узлов.

- [x] **Step 3: Запустить тесты и подтвердить RED**

  Run: `pnpm --filter @nkdk/runtime exec vitest run metadata/validation/dataPath/typedGraph.test.ts metadata/validation/dataPath/registrySet.test.ts`

  Expected: FAIL из-за отсутствующих деклараций и методов registry.

- [x] **Step 4: Реализовать декларации без расширения property rules**

  ```ts
  export type DataPathGraphTarget =
    | { readonly kind: "terminal"; readonly terminalTypes: readonly string[] }
    | { readonly kind: "structured"; readonly type: string }
    | { readonly kind: "collection"; readonly itemType: string }

  export interface TypedDataPathMemberDeclaration {
    readonly internal: string
    readonly yaml: string
    readonly target: DataPathGraphTarget
  }

  export interface DataPathTraceMember {
    readonly type: string
    readonly internal: string
    readonly yaml: string
  }
  ```

  Добавить `structured` в `DataPathValueKind`. Составной узел хранить отдельно от коллекции, не кодировать фиктивной таблицей `Registered`.

- [x] **Step 5: Расширить registry двумя вкладами**

  ```ts
  | { readonly kind: "typedGraph"; readonly types: readonly TypedDataPathTypeDeclaration[] }
  | { readonly kind: "dataPathView"; readonly view: DataPathViewDeclaration }
  ```

  Registry строит индексы типов, псевдонимов и членов при композиции. Повтор типа, псевдонима или имени члена должен давать понятную ошибку в тесте.

- [x] **Step 6: Подключить нейтральный обход к core resolver**

  ```ts
  const member = resolveTypedDataPathMember({ type: state.structuredType, segment: lookupSegment })
  if (member === undefined) return error(params, `ПутьКДанным "${value}": неизвестное свойство "${segment}"`)
  state = stateFromTypedMember(member, state.trace)
  ```

  `terminal` формирует конечные типы, `structured` продолжает рекурсию, `collection` создаёт настоящий табличный источник. Core resolver накапливает трассу, но не применяет `formConditionalFilter`.

- [x] **Step 7: Подтвердить GREEN, проверить дубли и зафиксировать слой**

  Run: `pnpm --filter @nkdk/runtime exec vitest run metadata/validation/dataPath/typedGraph.test.ts metadata/validation/dataPath/registrySet.test.ts`

  Run: `pnpm --filter @nkdk/rules exec vitest run metadata/validation/dataPath/resolver.test.ts`

  Run: `pnpm duplicates -- --base 75e10f274`

  ```bash
  git add packages/runtime/metadata/validation/dataPath packages/runtime/metadata/ruleRuntime/dataPath/types.ts packages/rules/metadata/validation/dataPath/coreResolver.ts packages/rules/metadata/validation/dataPath/resolver.test.ts
  git commit -m "feat: :sparkles: добавить типизированный граф путей данных"
  ```

---

### Task 3: SettingsComposer и встроенные составные типы

**Files:**
- Replace: `packages/rules/metadata/forms/settingsComposer/dataPathModel.ts` with `packages/rules/metadata/forms/settingsComposer/dataPathGraph.ts`
- Rename/Modify: `packages/rules/metadata/forms/settingsComposer/dataPathModel.test.ts` to `dataPathGraph.test.ts`
- Modify: `packages/rules/metadata/forms/settingsComposer/dataPathRules.ts`
- Modify: `packages/rules/metadata/forms/settingsComposer/dataPathRules.test.ts`
- Create: `packages/rules/metadata/forms/commonObjects/planner/dataPathRules.ts`
- Create: `packages/rules/metadata/forms/commonObjects/planner/dataPathRules.test.ts`
- Create: `packages/rules/metadata/commonObjects/standardPeriod/dataPathRules.ts`
- Create: `packages/rules/metadata/commonObjects/standartBeginningDate/dataPathRules.ts`
- Modify: `packages/rules/metadata/validation/dataPath/typeDescription.integration.test.ts`
- Modify: `packages/rules/metadata/validation/dataPath/resolver.test.ts`
- Modify: `packages/rules/metadata/validation/dataPath/coreResolver.ts`
- Modify: `packages/rules/metadata/composition/metadataRules.ts`

**Interfaces:**
- Consumes: `typedGraph`, `dataPathView`, `formattingNamePairs` из Task 2.
- Produces: четыре набора `dataPaths` и view `formConditionalFilter`.

- [x] **Step 1: Переписать тесты SettingsComposer и получить RED**

  Сохранить все пары `settingsComposerNamePairs` и конечные типы. Ожидать `structured` для составных узлов и `collection` только для реальных списков `Filter`, `Selection`, `Order`, `ConditionalAppearance` и соседей.

  Run: `pnpm --filter @nkdk/rules exec vitest run metadata/forms/settingsComposer/dataPathGraph.test.ts metadata/forms/settingsComposer/dataPathRules.test.ts`

- [x] **Step 2: Перенести SettingsComposer без изменения доступных путей**

  Перенести каждый узел и член прежнего `settingsComposerGraph` в
  `readonly TypedDataPathTypeDeclaration[]`: `collections(...)` становятся
  целью `collection`, `terminals(...)` — целью `terminal`. Корневые
  `Settings`, `UserSettings`, `FixedSettings` остаются членами
  `DataCompositionSettingsComposer`. `dataPathRules.ts` содержит только вклады
  графа, пар имён и двух существующих `elementProperty`.

- [x] **Step 3: Добавить падающие тесты встроенных типов**

  ```ts
  Период.ДатаНачала -> dateTime
  Период.ДатаОкончания -> dateTime
  Начало.Дата -> dateTime
  Планировщик.НачалоПериодаОтображения -> dateTime
  Планировщик.ОтображатьТекущуюДату -> boolean
  Планировщик.МинимальнаяШиринаКолонки -> decimal
  ```

  Проверить неизвестные свойства и недоступность `StandardPeriod.Вариант` в `formConditionalFilter`.

- [x] **Step 4: Объявить StandardPeriod и StandardBeginningDate**

  `StandardPeriod`: `Variant` как перечисление, `StartDate/ДатаНачала` и `EndDate/ДатаОкончания` как `dateTime`. `StandardBeginningDate`: `Date/Дата` как `dateTime`. View разрешает только даты со скриншотов. Удалить `standardPeriod` и `standardPeriodField()` из `coreResolver.ts`.

- [x] **Step 5: Объявить подтверждённые поля Planner**

  ```ts
  const plannerConditionalFields = {
    НачалоПериодаОтображения: "dateTime",
    КонецПериодаОтображения: "dateTime",
    ВыравниватьГраницыЭлементовПоШкалеВремени: "boolean",
    ОтображатьПеренесенныеЗаголовкиШкалыВремени: "boolean",
    ОтображатьПеренесенныеЗаголовки: "boolean",
    КратностьПериодическогоВарианта: "decimal",
    ОтступСНачалаПереносаШкалыВремени: "decimal",
    ОтступСКонцаПереносаШкалыВремени: "decimal",
    ОтображатьТекущуюДату: "boolean",
    АвтоМинимальнаяШиринаКолонки: "boolean",
    МинимальнаяШиринаКолонки: "decimal",
    АвтоМинимальнаяВысотаСтроки: "boolean",
    МинимальнаяВысотаСтроки: "decimal",
    ФиксироватьЗаголовокИзмерений: "boolean",
    ФиксироватьЗаголовокШкалыВремени: "boolean",
  } as const
  ```

  Для `internal` использовать подтверждённые Syntax Helper английские имена, для `yaml` — ключи выше. Другие свойства не объявлять; view перечисляет эти 15 членов.

- [x] **Step 6: Подключить декларации и подтвердить GREEN**

  ```ts
  dataPaths: [
    ...settingsComposerDataPathRules,
    ...plannerDataPathRules,
    ...standardPeriodDataPathRules,
    ...standardBeginningDateDataPathRules,
    ...appliedObjectDataPathRules,
  ]
  ```

  Run: `pnpm --filter @nkdk/rules exec vitest run metadata/forms/settingsComposer/dataPathGraph.test.ts metadata/forms/settingsComposer/dataPathRules.test.ts metadata/forms/commonObjects/planner/dataPathRules.test.ts metadata/validation/dataPath/typeDescription.integration.test.ts metadata/validation/dataPath/resolver.test.ts`

  Run: `pnpm duplicates -- --base 75e10f274`

- [x] **Step 7: Зафиксировать слой**

  ```bash
  git add packages/rules/metadata/forms/settingsComposer packages/rules/metadata/forms/commonObjects/planner packages/rules/metadata/commonObjects/standardPeriod packages/rules/metadata/commonObjects/standartBeginningDate packages/rules/metadata/validation/dataPath packages/rules/metadata/composition/metadataRules.ts
  git commit -m "refactor: :recycle: перенести составные пути на общий граф"
  ```

---

### Task 4: Смысловая проверка условного оформления

**Files:**
- Create: `packages/rules/metadata/forms/clientApplicationForm/conditionalAppearanceTraversal.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/conditionalAppearanceTraversal.test.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/validateConditionalAppearance.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/validateConditionalAppearance.test.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/conditionalOperandTypes.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/conditionalOperandTypes.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/validate.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/validationRules.ts`
- Modify: `packages/rules/metadata/validation/dataPath/terminalTypes.ts`
- Modify: `packages/rules/metadata/validation/dataPath/terminalTypes.test.ts`
- Modify: `packages/rules/metadata/validation/validateForm.integration.test.ts`

**Interfaces:**
- Produces: `collectConditionalAppearanceOccurrences`, `resolveConditionalAppearanceField`, `inferConditionalOperandType`, `dataPathTerminalGroupsIntersect`, `validateFormConditionalAppearance`.
- Consumes: `FormDataPathContext`, `OwnerMetadataCache`, `resolveDataPath`, view Task 2, `normalizeDataPathTerminalType`.

- [x] **Step 1: Добавить падающий тест обхода двух корней**

  ```yaml
  УсловноеОформлениеРеквизитов:
    Элементы:
      - Поля: [ПолеФормы]
        Отбор:
          Элементы:
            - ЛевоеЗначение: .Число
              ПравоеЗначение: 0
  Реквизиты:
    Список:
      Тип: ДинамическийСписок
      ДинамическийСписок:
        УсловноеОформление:
          Элементы:
            - Отбор:
                Элементы:
                  - ЛевоеЗначение: .Ссылка
                    ПравоеЗначение: .Владелец
  ```

  Проверить YAML-пути, рекурсивные группы и `tableContext: { dataPath: "Список" }` для `DynamicList`.

- [x] **Step 2: Реализовать чистый обход**

  ```ts
  interface ConditionalOperandOccurrence {
    readonly side: "left" | "right"
    readonly value: unknown
    readonly yamlPath: YamlPath
    readonly tableContext?: TableContext
  }
  interface ConditionalTargetOccurrence {
    readonly value: string
    readonly yamlPath: YamlPath
    readonly parent: Record<string, unknown> | unknown[]
    readonly key: string | number
  }
  ```

  Обходчик не разрешает пути и не создаёт диагностик. Отсутствующие `Поля` и пустое поле `.` допустимы.

- [x] **Step 3: Добавить падающую таблицу совместимости**

  ```ts
  decimal ↔ decimal -> true
  decimal ↔ string -> false
  CatalogRef.А ↔ CatalogRef.Б -> true
  AnyIBRef ↔ DocumentRef.Заказ -> true
  string | decimal ↔ decimal -> true
  <any> ↔ boolean -> undefined
  unknown ↔ boolean -> undefined
  ```

- [x] **Step 4: Реализовать консервативную совместимость**

  ```ts
  export function dataPathTerminalGroupsIntersect(
    left: NormalizedDataPathTerminalType,
    right: NormalizedDataPathTerminalType,
  ): boolean | undefined
  ```

  `undefined` для `notResolved`/`<any>`, `true` при пересечении и для `AnyIBRef` с любым `*Ref.*`, `false` только для известных непересекающихся групп. `ВидСравнения` в функцию не передаётся.

  В `conditionalOperandTypes.ts` сначала использовать существующий
  `importDcsMetadataTypedValueFromYAML`, затем отобразить полученный вид в
  `DataPathTypeInfo`: `decimal`, `boolean`, `dateTime`, `string`, `Order`,
  `ValueListType`, `StandardBeginningDate`. Для `ref` вывести ссылочное
  семейство из канонического корня metadata value; если корень нельзя
  определить, вернуть неизвестный тип. `Field` обрабатывает resolver, а
  `DesignTimeValue` не даёт достоверного типа.

- [x] **Step 5: Добавить падающие тесты валидатора**

  Покрыть существующий/неизвестный элемент, обычное поле, `StandardPeriod`, известное/неизвестное поле `DynamicList`, недоступный член view, несовместимые `decimal/string`, составные/ссылочные типы, константу слева и отсутствие проверки при неизвестном типе.

- [x] **Step 6: Реализовать адаптер resolver**

  ```ts
  if (tagged) return { status: "tagged" }
  if (value === ".") return { status: "deferred" }
  const relative = value.startsWith(".") ? value.slice(1) : value
  const resolverValue = params.tableContext === undefined
    ? relative
    : `${params.tableContext.dataPath}.${relative}`
  const result = resolveDataPath({ ...params, value: resolverValue })
  if (result.status === "error") return { status: "error", diagnostics: result.diagnostics }
  if (result.target === undefined) return { status: "deferred" }
  if (!checkDataPathTraceAvailability("formConditionalFilter", result.target.trace)) return { status: "unavailable" }
  return { status: "resolved", target: result.target }
  ```

  `DynamicList` не получает отдельной ветки.

- [x] **Step 7: Реализовать проверку целей и операндов**

  Цели искать в `dataPathContext.elementsByName`. Неизвестное обычное имя —
  ошибка на точном YAML-пути. Статусы `unavailable`, `deferred` и `error` у
  непомеченного ручного операнда также превращать в ошибку; эти же статусы
  становятся тегом только в импортном проходе Task 5. Операнды проверять
  независимо; пару сравнивать только при двух известных типах. Удалить
  `collectDynamicListTypeValueWarnings` и `formWarningProvider`.

- [x] **Step 8: Подключить ко второму проходу и подтвердить GREEN**

  Вызвать валидатор после подготовки `dataPathContext`, до `dedupeDiagnostics`.

  Run: `pnpm --filter @nkdk/rules exec vitest run metadata/forms/clientApplicationForm/conditionalAppearanceTraversal.test.ts metadata/forms/clientApplicationForm/conditionalOperandTypes.test.ts metadata/forms/clientApplicationForm/validateConditionalAppearance.test.ts metadata/validation/dataPath/terminalTypes.test.ts metadata/validation/validateForm.integration.test.ts`

  Run: `pnpm duplicates -- --base 75e10f274`

- [x] **Step 9: Зафиксировать слой**

  ```bash
  git add packages/rules/metadata/forms/clientApplicationForm packages/rules/metadata/validation/dataPath/terminalTypes.ts packages/rules/metadata/validation/dataPath/terminalTypes.test.ts packages/rules/metadata/validation/validateForm.integration.test.ts
  git commit -m "feat: :sparkles: проверять условное оформление формы"
  ```

---

### Task 5: XML-аномалии импортированных значений

**Files:**
- Create: `packages/rules/metadata/forms/clientApplicationForm/conditionalAppearanceAnomalies.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/conditionalAppearanceAnomalies.test.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/conditionalAppearanceExplicitXML.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/importDataPathCompatibility.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/importDataPathCompatibility.test.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/explicitXMLPropertyRegistry.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/availableFields/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/availableFields/fromYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/availableFields/toJSONSchema.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/availableFields/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/availableFields/toXML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts`
- Modify: `packages/rules/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/composition/metadataRules.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts`
- Modify: `packages/rules/metadata/validation/validateForm.integration.test.ts`

**Interfaces:**
- Produces: `finalizeImportedConditionalAppearanceAnomalies`, carrier `!xml/value` для DCS Field и `!xml/reference` для `AvailableFields`, дословный экспорт payload.
- Consumes: обход Task 4, resolver, `xmlAnomalyTagValue`, `markYAMLScalarTag`, `yamlScalarTagAt`, исходные значения до канонизации.

- [x] **Step 1: Добавить падающие тесты импортной классификации**

  ```yaml
  ЛевоеЗначение: !xml/value НеизвестныйИсточник.Поле
  Поля:
    - !xml/reference НеизвестныйЭлемент
    - Поле: !xml/reference ДругойЭлемент
      Использование: Истина
  ```

  Проверить теги без диагностик, сохранение метаданных расширенной записи и отсутствие тега у разрешимого поля. Payload — исходный внутренний XML-текст.

- [x] **Step 2: Реализовать импортный завершающий проход**

  После построения эффективного индекса повторно собрать оформление. Для неразрешённого импортированного `Field`:

  ```ts
  occurrence.parent[occurrence.key] = xmlAnomalyTagValue("xml/value", originalInternalValue)
  markYAMLScalarTag(occurrence.parent, occurrence.key, "xml/value")
  ```

  Для цели использовать `xml/reference`. Тегировать `unavailable`, `deferred`, `error`; предупреждений не создавать. Расширить `finalizeImportedFormDataPaths` в `worker.ts`, не вводить новый проход.

- [x] **Step 3: Добавить падающие тесты постоянного тега**

  Проверить непустой payload, ошибку пустого payload, отсутствие вызова resolver, отсутствие диагностики избыточности и независимую проверку второго операнда без сравнения пары.

- [x] **Step 4: Зарегистрировать carrier DCS Field**

  Расширить существующий `transportScalar` необязательным преобразователем,
  не затрагивая `PropertyRule`:

  ```ts
  readonly transformPayload?: (payload: string) => unknown
  ```

  `collectExplicitXMLPropertyActions` передаёт в `useYamlValue` результат
  `transformPayload(payload)`, а без преобразователя сохраняет прежний payload.
  Поэтому тип `ExplicitXMLPropertyAction` для `useYamlValue.yamlValue`
  расширяется со `string` до `unknown`; остальные варианты action не меняются.
  Покрыть оба режима в `fromYAMLToXML.test.ts` и сохранение закрытой внешней
  схемы в `toJSONSchemaExplicitXML.test.ts`.

  В `conditionalAppearanceExplicitXML.ts` зарегистрировать
  `FilterItemComparison.leftValue/rightValue` так, чтобы DCS-конвертер получил
  поле с ведущей служебной точкой:

  ```ts
  {
    action: "transportScalar",
    itemType: "FilterItemComparison",
    propertyKey: "leftValue",
    transformPayload: (payload) => `.${payload}`,
  }
  ```

  Повторить регистрацию для `rightValue`. Проверять реальный scalar tag, а не
  строковый префикс. Обычная строка `"!xml/value X"` без тега остаётся строкой.
  `DcsMetadataTypedValue` распознаёт `.X` как `Field` и экспортирует
  `<dcsset:left xsi:type="dcscor:Field">X</dcsset:left>`.

- [x] **Step 5: Поддержать !xml/reference в AvailableFields**

  В `fromYAML.ts` читать тег массива и тег свойства `Поле` через `yamlScalarTagAt`, проверять payload и передавать в модель только его. JSON Schema принимает непустой carrier в двух позициях; внешняя схема подсказок не рекламирует `!xml`.

- [x] **Step 6: Подтвердить round-trip и проверить дубли**

  Run: `pnpm --filter @nkdk/rules exec vitest run metadata/ruleRuntime/property/fromYAMLToXML.test.ts metadata/ruleRuntime/property/toJSONSchemaExplicitXML.test.ts metadata/forms/clientApplicationForm/conditionalAppearanceAnomalies.test.ts metadata/forms/clientApplicationForm/importDataPathCompatibility.test.ts metadata/commonObjects/dataCompositionSystem/availableFields/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/availableFields/toJSONSchema.test.ts metadata/commonObjects/dataCompositionSystem/availableFields/toXML.integration.test.ts metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts metadata/validation/validateForm.integration.test.ts`

  Run: `pnpm duplicates -- --base 75e10f274`

- [x] **Step 7: Зафиксировать слой**

  ```bash
  git add packages/runtime/metadata/ruleRuntime/property/explicitXMLPropertyRegistry.ts packages/rules/metadata/ruleRuntime/property packages/rules/metadata/forms/clientApplicationForm packages/rules/metadata/importFromXml/worker.ts packages/rules/metadata/commonObjects/dataCompositionSystem packages/rules/metadata/composition/metadataRules.ts packages/rules/metadata/validation/validateForm.integration.test.ts
  git commit -m "feat: :sparkles: сохранять аномальные поля условного оформления"
  ```

---

### Task 6: Документация и итоговая проверка

**Files:**
- Modify: `.agents/restrictions.md`
- Modify: `.agents/xml-anomalies.md`
- Review only: `docs/superpowers/specs/2026-08-17-form-conditional-appearance-validation-design.md`

**Interfaces:**
- Produces: временные ограничения и точные carrier-договоры тегов.

- [x] **Step 1: Обновить restrictions**

  ```md
  - Resolver может не определять часть полей набора данных DynamicList; при XML-импорте такие пути получают !xml/value и не проходят смысловую проверку.
  - Совместимость ВидСравнения с типами операндов условного оформления не проверяется.
  - Совместимость пары не проверяется, если тип операнда неизвестен, равен <any> или зарегистрирован как XML-аномалия.
  ```

  Сохранить ограничение `Оформление.Текст/Формат` с `Тип: Поле`.

- [x] **Step 2: Обновить реестр XML-аномалий**

  Для двух carrier записать точное место, импортную причину, непустой payload, дословный экспорт, отсутствие resolver/диагностики избыточности и отличие DCS `!xml/value` от обычного `ПутьКДанным` формы.

- [x] **Step 3: Запустить проверки типов и пакетов**

  Run: `pnpm type-check`

  Run: `pnpm --filter @nkdk/runtime test`

  Run: `pnpm --filter @nkdk/rules test:native`

  Expected: команды успешны; `test:native` запускать вне песочницы из-за LMDB.

- [x] **Step 4: Выполнить обязательные полные проверки**

  Run: `pnpm duplicates -- --base 75e10f274`

  Run: `pnpm test`

  Run: `pnpm test:architecture:rules`

  Run: `pnpm test:architecture`

  Expected: новые дубли отсутствуют, все проверки зелёные.

- [x] **Step 5: Выполнить корпусную проверку**

  Импортировать в `mktemp -d` репрезентативные формы из `/Users/nikita/git/round-trip-compact/cf` с `SettingsComposer`, `Planner`, `StandardPeriod`, `StandardBeginningDate`, `DynamicList`. Разрешимые пути остаются обычными, неразрешимые получают тег, последующая validation не создаёт для них ошибок или предупреждений. Корпус не изменять.

- [x] **Step 6: Проверить итоговый diff и тесты**

  Run: `git diff --check 75e10f274..HEAD`

  Run: `git status --short`

  Убедиться, что XML-фикстуры не менялись и `architecture.md` не обновлялся без согласования. В отчёте перечислить новые/расширенные тесты и уникальный договор каждого.

- [x] **Step 7: Зафиксировать документацию**

  ```bash
  git add .agents/restrictions.md .agents/xml-anomalies.md docs/superpowers/plans/2026-08-17-form-conditional-appearance-validation.md
  git commit -m "docs: :memo: описать ограничения условного оформления"
  ```
