# Russian Metadata References Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести согласованные ссылки на объекты, таблицы и поля метаданных в единую русскую YAML-форму с обратимым XML round-trip и декларативными ограничениями.

**Architecture:** Расширить нейтральный `metadataTarget` видами `dataTable` и `dataTableField`, не добавляя условий конкретных объектов в runtime. Прикладные модули публикуют физические и виртуальные таблицы через реестр вкладов, собираемый в `metadata/composition`; существующие преобразователи строк, списков и ссылок используют общий разбор и форматирование.

**Tech Stack:** TypeScript 7, TypeBox, Vitest, rules.ts, общий индекс метаданных NKDK.

## Global Constraints

- Английские формы ссылок не принимаются как совместимый YAML; XML сохраняет канонические английские сегменты платформы.
- Не добавлять специальные fromXML/toXML/fromYAML/toYAML для конкретных полей, если договор выражается через rules.ts и общий `metadataTarget`.
- Не изменять существующие XML-фикстуры; они являются источником истины.
- Не добавлять `!xml` и не расширять общие типы правил сверх согласованных `dataTable`/`dataTableField`.
- `ИмяМетода`, `Обработчик`, команды и группы команд остаются без перевода согласно `.agents/restrictions.md`.
- `ДополнительныеИндексы` остаются без перевода и смысловой проверки согласно `.agents/restrictions.md`; относящиеся к ним пункты Task 4 больше не выполняются.
- В блоке `Характеристики` выполнять только перевод; не проверять доступность, типы и межполевые связи.
- После каждого законченного слоя запускать `pnpm duplicates -- --base 64093876e`.

---

### Task 1: Общий формат `dataTable` и `dataTableField`

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/metadataTarget/types.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/metadataTarget/roots.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/metadataTarget/parse.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/metadataTarget/format.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/metadataTargetString.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataTargets/schema.ts`
- Test: `packages/rules/metadata/commonObjects/metadataTargets/parse.test.ts`
- Test: `packages/rules/metadata/commonObjects/metadataTargets/schema.test.ts`
- Test: `packages/rules/metadata/ruleRuntime/property/metadataTargetString.test.ts`

**Interfaces:**
- Produces: `DataTableTargetConstraint`, `DataTableFieldTargetConstraint`, `ParsedDataTableTarget`, `ParsedDataTableFieldTarget` in `@nkdk/runtime/rule-kit`.
- Produces: reversible aliases `SliceFirst ↔ СрезПервых`, `SliceLast ↔ СрезПоследних`, `Balance ↔ Остатки`, `Turnovers ↔ Обороты`, `BalanceAndTurnovers ↔ ОстаткиИОбороты`, `RecordsWithExtDimensions ↔ ДвиженияССубконто`, `DrCrTurnovers ↔ ОборотыДтКт`, `ExtDimensions ↔ Субконто`, `ScheduleData ↔ ДанныеГрафика`, `ActualActionPeriod ↔ ФактическийПериодДействия`, `Points ↔ Точки` and `Base<name> ↔ База<name>`.
- Consumes: existing `rootToYAML`, `memberKindToYAML` and standard member aliases.

- [ ] **Step 1: Write failing parser/formatter tests**

```ts
it.each([
  ["InformationRegister.Регистр.SliceLast", "РегистрСведений.Регистр.СрезПоследних"],
  ["AccumulationRegister.Остатки.BalanceAndTurnovers", "РегистрНакопления.Остатки.ОстаткиИОбороты"],
  ["CalculationRegister.Начисления.BaseБаза", "РегистрРасчета.Начисления.БазаБаза"],
  ["ExternalDataSource.Источник.Cube.Куб.DimensionTable.Измерение", "ВнешнийИсточникДанных.Источник.Куб.Куб.ТаблицаИзмерения.Измерение"],
])("round-trip %s", (model, yaml) => {
  const constraint = { kind: "dataTable" } as const
  expect(formatMetadataTargetToYAML({ canonical: model, constraint })).toBe(yaml)
  expect(parseMetadataTargetFromYAML({ value: yaml, constraint })).toMatchObject({ ok: true, canonical: model })
})
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `pnpm --filter @nkdk/rules exec vitest run packages/rules/metadata/commonObjects/metadataTargets/parse.test.ts packages/rules/metadata/ruleRuntime/property/metadataTargetString.test.ts`
Expected: FAIL because `dataTable` and `dataTableField` are absent.

- [ ] **Step 3: Add the neutral target types and reversible parsing/formatting**

```ts
export interface DataTableTargetConstraint {
  kind: "dataTable"
  roots?: readonly MetadataRootName[]
  owner?: "this"
  validation?: "resolve" | "translateOnly"
}

export interface DataTableFieldTargetConstraint {
  kind: "dataTableField"
  tableProperty: string
  validation?: "resolve" | "translateOnly"
}
```

Implement exact table suffix parsing; a `dataTableField` accepts either a qualified table field (`Catalog.X.Attribute.Y`) or a local field (`Date`) and translates standard aliases without validating the sibling table at this layer. Bypass service values matching `/^-\d+$/` unchanged.

- [ ] **Step 4: Extend schema and scalar/list conversion tests**

Assert Russian roots only, exact virtual aliases, array element conversion, and rejection of `Catalog.Товары` as YAML.

- [ ] **Step 5: Run focused tests and type-check**

Run: `pnpm --filter @nkdk/runtime type-check && pnpm --filter @nkdk/rules exec vitest run packages/rules/metadata/commonObjects/metadataTargets packages/rules/metadata/ruleRuntime/property/metadataTargetString.test.ts`
Expected: PASS.

- [ ] **Step 6: Check duplicates and commit**

```bash
pnpm duplicates -- --base 64093876e
git add packages/runtime/metadata/ruleRuntime/metadataTarget packages/runtime/metadata/ruleRuntime/property/metadataTargetString.ts packages/rules/metadata/commonObjects/metadataTargets packages/rules/metadata/ruleRuntime/property/metadataTargetString.test.ts
git commit -m "feat: :sparkles: добавить цели таблиц метаданных"
```

### Task 2: Индекс таблиц и декларативный реестр

**Files:**
- Create: `packages/rules/metadata/validation/dataTables/contracts.ts`
- Create: `packages/rules/metadata/validation/dataTables/registry.ts`
- Create: `packages/rules/metadata/validation/dataTables/index.ts`
- Create: `packages/rules/metadata/validation/dataTables/index.test.ts`
- Modify: `packages/rules/metadata/validation/projectReferenceIndexRegistry.ts`
- Modify: `packages/rules/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/runtime/metadata/validation/projectReferenceIndex.ts`
- Modify: `packages/rules/metadata/validation/projectValidationTypes.ts`
- Modify: `packages/rules/metadata/projectState/binary/constraintCodec.ts`
- Modify: `packages/rules/metadata/projectState/binary/fragment.ts`
- Modify: `packages/rules/metadata/projectState/binary/typedReader.ts`
- Modify: `packages/rules/metadata/projectState/binary/readSession.test.ts`
- Modify: `packages/rules/metadata/composition/metadataRules.ts`

**Interfaces:**
- Produces: `DataTableDeclarationContributor`, receiving all `ValidationObjectRecord[]` and returning exact table entries with canonical XML name, Russian YAML name, owner and available fields.
- Produces: `ProjectDataTableIndexEntry` and `ProjectDataTableFieldIndexEntry`; the generic reference index resolves parsed table targets without knowledge of concrete roots.
- Consumes: `ValidationObjectRecord.ownerFacts.fieldIndex`, object/member entries and reference graph.

- [ ] **Step 1: Write failing index tests**

```ts
expect(index.resolve(tableReference("РегистрНакопления.Остатки.Остатки"))).toEqual({ ok: true })
expect(index.resolve(tableReference("РегистрНакопления.Обороты.Остатки"))).toMatchObject({ ok: false, reason: "notFound" })
expect(index.resolve(fieldReference("Дата", "Задача.Задачи"))).toEqual({ ok: true })
```

- [ ] **Step 2: Run the test and verify failure**

Run: `pnpm --filter @nkdk/rules exec vitest run packages/rules/metadata/validation/dataTables/index.test.ts`
Expected: FAIL because no table index exists.

- [ ] **Step 3: Implement registry contracts and index construction**

Keep concrete predicates in contributors under `packages/rules/metadata/appliedObjects/**`; `dataTables/index.ts` only merges exact entries, detects collisions and resolves `dataTable`/`dataTableField` references.

- [ ] **Step 4: Connect import and YAML validation contributions**

Build the table index after first-pass object records are combined. For `dataTableField`, locate the sibling table from `constraint.tableProperty` at the parent YAML path; qualified characteristic fields retain their own table prefix.

- [ ] **Step 5: Run index, project-state and type tests**

Run: `pnpm --filter @nkdk/rules exec vitest run packages/rules/metadata/validation/dataTables packages/rules/metadata/validation/projectReferenceIndex.test.ts packages/rules/metadata/validation/projectStateDependencyValidation.test.ts packages/rules/metadata/projectState/binary/readSession.test.ts && pnpm type-check`
Expected: PASS.

- [ ] **Step 6: Check duplicates and commit**

```bash
pnpm duplicates -- --base 64093876e
git add packages/runtime/metadata/validation/projectReferenceIndex.ts packages/rules/metadata/validation packages/rules/metadata/composition/metadataRules.ts
git commit -m "feat: :sparkles: добавить индекс таблиц данных"
```

### Task 3: Физические, вложенные и виртуальные таблицы

**Files:**
- Create: `packages/rules/metadata/appliedObjects/dataTableRules.ts`
- Create: `packages/rules/metadata/appliedObjects/dataTableRules.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataInformationRegister/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataAccumulationRegister/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataAccountingRegister/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataCalculationRegister/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataBusinessProcess/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataExternalDataSource/rules.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataExternalDataSourceCube/rules.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataExternalDataSourceTable/rules.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataExternalDataSourceDimensionTable/rules.ts`
- Modify: `packages/rules/metadata/composition/metadataRules.ts`

**Interfaces:**
- Produces: contributors for main physical tables, tabular sections, EDS cube/table/dimension table and every approved virtual table.
- Consumes: exact Russian YAML property names from owner records and cross-object references through the combined record set.

- [ ] **Step 1: Write a complete failing condition matrix**

Use `it.each` for all rows in the spec: periodic information registers; both accumulation-register kinds; accounting correspondence and subkonto; calculation base/schedule/action-period dependencies; business-process points; nested EDS objects.

- [ ] **Step 2: Run and verify failure**

Run: `pnpm --filter @nkdk/rules exec vitest run packages/rules/metadata/appliedObjects/dataTableRules.test.ts`
Expected: FAIL because no contributors are registered.

- [ ] **Step 3: Implement local table contributors**

```ts
const accumulationTables = (record: ValidationObjectRecord) =>
  record.ownerFacts.registerType === "Обороты"
    ? ["Turnovers"]
    : ["Balance", "Turnovers", "BalanceAndTurnovers"]
```

Implement information, accumulation, unconditional accounting and business-process cases as exact entries.

- [ ] **Step 4: Implement cross-object conditions**

Resolve accounting plan, calculation plan/base registers and graph information register only through `ValidationObjectRecord` data and canonical metadata references. Do not import applied objects from neutral validation modules.

- [ ] **Step 5: Add EDS nested physical tables and field publication**

Publish only declared `Cube`, `Table` and `DimensionTable`; never publish the external data source itself as a table.

- [ ] **Step 6: Run matrix, architecture boundary and type tests**

Run: `pnpm --filter @nkdk/rules exec vitest run packages/rules/metadata/appliedObjects/dataTableRules.test.ts packages/rules/metadata/importBoundaries.test.ts && pnpm type-check`
Expected: PASS.

- [ ] **Step 7: Check duplicates and commit**

```bash
pnpm duplicates -- --base 64093876e
git add packages/rules/metadata/appliedObjects/dataTableRules.ts packages/rules/metadata/appliedObjects/dataTableRules.test.ts packages/rules/metadata/composition/metadataRules.ts
git commit -m "feat: :sparkles: описать доступные таблицы 1С"
```

### Task 4: Динамический список; дополнительные индексы отложены

Часть исходного плана про `packages/rules/metadata/commonObjects/additionalIndex/**`, `dataTableField` в индексах и их проверки отменена. В рамках задачи остаётся только `ОсновнаяТаблица` динамического списка.

**Files:**
- Modify: `packages/rules/metadata/forms/commonObjects/dynamicList/rules.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/additionalIndex/rules.ts`
- Modify: `packages/rules/metadata/commonObjects/additionalIndex/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/additionalIndex/fromYAMLToXML.test.ts`
- Create: `packages/rules/metadata/commonObjects/additionalIndex/validation.ts`
- Create: `packages/rules/metadata/commonObjects/additionalIndex/validation.test.ts`

**Interfaces:**
- `mainTable.metadataTarget = { kind: "dataTable", roots: ["FilterCriterion", "ExchangePlan", "Constant", "Catalog", "Document", "DocumentJournal", "Enum", "ChartOfCharacteristicTypes", "ChartOfAccounts", "ChartOfCalculationTypes", "InformationRegister", "AccumulationRegister", "AccountingRegister", "CalculationRegister", "BusinessProcess", "Task", "ExternalDataSource"] }`.
- `table.metadataTarget = { kind: "dataTable", owner: "this" }`.
- Both index field lists use `{ kind: "dataTableField", tableProperty: "table" }`.

- [ ] **Step 1: Add failing round-trip tests for Russian tables and standard fields**

Assert `Task.X` → `Задача.X`, EDS nesting, all virtual aliases, and `Date` ↔ `Дата`, `Ref` ↔ `Ссылка` inside arrays.

- [ ] **Step 2: Add failing semantic tests for additional indexes**

Assert owner-only tables, field existence, no duplicate across lists, no binary/unlimited string fields and the computable 16-column limit.

- [ ] **Step 3: Run focused tests and verify failure**

Run: `pnpm --filter @nkdk/rules exec vitest run packages/rules/metadata/forms/commonObjects/dynamicList packages/rules/metadata/commonObjects/additionalIndex`
Expected: FAIL on untranslated values and missing diagnostics.

- [ ] **Step 4: Add only the declarative rules and dependent item validator**

Do not create field-specific XML/YAML converters. Preserve `!xml` empty `ДополнительныеПоля` through the existing `IndexField` transport handling.

- [ ] **Step 5: Run focused tests, type-check and duplicates**

Run: `pnpm --filter @nkdk/rules exec vitest run packages/rules/metadata/forms/commonObjects/dynamicList packages/rules/metadata/commonObjects/additionalIndex && pnpm type-check && pnpm duplicates -- --base 64093876e`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/rules/metadata/forms/commonObjects/dynamicList packages/rules/metadata/commonObjects/additionalIndex
git commit -m "feat: :sparkles: перевести таблицы и поля индексов"
```

### Task 5: Краткие ссылки, размещение и форма выбора

**Files:**
- Modify: `packages/rules/metadata/forms/commonObjects/formCommand/rules.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/formAttribute/rules.ts`
- Modify: `packages/rules/metadata/commonObjects/functionalOptionsProperty/*.test.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/toYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/*.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataFunctionalOption/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataFunctionalOption/fromXMLToYAML.test.ts`
- Create: `packages/rules/metadata/appliedObjects/metadataFunctionalOption/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataAttribute/fragments.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataConstant/rules.ts`
- Modify: `packages/rules/metadata/appliedObjects/metadataCommonAttribute/rules.ts`
- Create: `packages/rules/metadata/commonObjects/choiceForm/resolve.ts`
- Create: `packages/rules/metadata/commonObjects/choiceForm/resolve.test.ts`

**Interfaces:**
- Functional-option lists use object targets restricted to `FunctionalOption`, yielding short YAML names.
- Role map keys use the same object target restricted to `Role`.
- Functional-option location accepts exactly Constant, Catalog→Attribute and InformationRegister→Resource.
- Choice form uses a general member constraint with `owner: "type"` and `typeProperty: "type"`; it resolves the sole reference type and emits/restores only the form name. Composite type produces a diagnostic and does not accept the property.

- [ ] **Step 1: Add failing conversion tests for lists and map keys**

```ts
expect(toYaml(["FunctionalOption.Булево"])).toEqual(["Булево"])
expect(toYaml({ "Role.Администратор": false })).toEqual({ Администратор: "Ложь" })
```

- [ ] **Step 2: Add failing placement and choice-form tests**

Cover all three location paths, rejection of nested catalog attributes/resources, one reference type and composite type.

- [ ] **Step 3: Run focused tests and verify failure**

Run: `pnpm --filter @nkdk/rules exec vitest run packages/rules/metadata/commonObjects/functionalOptionsProperty packages/rules/metadata/commonObjects/userVisible packages/rules/metadata/appliedObjects/metadataFunctionalOption packages/rules/metadata/commonObjects/choiceForm`
Expected: FAIL.

- [ ] **Step 4: Apply declarative targets and the shared choice-form resolver**

Extend `MemberTargetConstraint` with the declarative pair `owner: "type"` and `typeProperty: string`. Resolve it from the parent YAML passed to atomic `fromYAML`; use the existing type-description parser/index and do not add special cases to neutral runtime based on `itemType`.

- [ ] **Step 5: Run focused tests, type-check and duplicates**

Run: `pnpm --filter @nkdk/rules exec vitest run packages/rules/metadata/commonObjects/functionalOptionsProperty packages/rules/metadata/commonObjects/userVisible packages/rules/metadata/appliedObjects/metadataFunctionalOption packages/rules/metadata/commonObjects/choiceForm && pnpm type-check && pnpm duplicates -- --base 64093876e`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/rules/metadata/forms/commonObjects/formCommand/rules.ts packages/rules/metadata/forms/commonObjects/formAttribute/rules.ts packages/rules/metadata/commonObjects/functionalOptionsProperty packages/rules/metadata/commonObjects/userVisible packages/rules/metadata/appliedObjects/metadataFunctionalOption packages/rules/metadata/commonObjects/metadataAttribute/fragments.ts packages/rules/metadata/commonObjects/standardAttributeDescription/rules.ts packages/rules/metadata/appliedObjects/metadataConstant/rules.ts packages/rules/metadata/appliedObjects/metadataCommonAttribute/rules.ts packages/rules/metadata/commonObjects/choiceForm
git commit -m "feat: :sparkles: перевести краткие ссылки метаданных"
```

### Task 6: Блок `Характеристики`

**Files:**
- Modify: `packages/rules/metadata/commonObjects/characteristicsDescription/rules.ts`
- Modify: `packages/rules/metadata/commonObjects/characteristicsDescription/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/characteristicsDescription/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/characteristicsDescription/__fixtures__/data.ts`

**Interfaces:**
- Table properties use `dataTable` with `validation: "translateOnly"`.
- Qualified fields use `dataTableField` with `validation: "translateOnly"`; `-1`, `-8` and other negative service values remain byte-for-byte unchanged.

- [ ] **Step 1: Add failing translation tests**

Assert full Russian table and member paths in YAML, restoration of canonical XML, and unchanged negative service values.

- [ ] **Step 2: Run and verify failure**

Run: `pnpm --filter @nkdk/rules exec vitest run packages/rules/metadata/commonObjects/characteristicsDescription`
Expected: FAIL on English roots/member kinds.

- [ ] **Step 3: Add metadataTarget declarations without semantic restrictions**

Use `tableProperty: "characteristicTypes"` for type-side fields and `tableProperty: "characteristicValues"` for value-side fields. Set `validation: "translateOnly"`: target-resolution diagnostics are skipped while structural reference collection remains active for rename/find-references.

- [ ] **Step 4: Run tests, type-check and duplicates**

Run: `pnpm --filter @nkdk/rules exec vitest run packages/rules/metadata/commonObjects/characteristicsDescription && pnpm type-check && pnpm duplicates -- --base 64093876e`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/rules/metadata/commonObjects/characteristicsDescription
git commit -m "feat: :sparkles: перевести описание характеристик"
```

### Task 7: Сквозной round-trip, ссылки и переименование

**Files:**
- Create: `packages/rules/metadata/importFromXml/russianMetadataReferences.integration.test.ts`
- Modify: `packages/rules/metadata/operations/references.test.ts`
- Modify: `packages/rules/metadata/operations/renameItem.integration.test.ts`
- Modify: `packages/rules/metadata/operations/findMetadataReferences.test.ts`
- Modify: `e2e/fixtures/nkdk/**` YAML expectations only through the fixture update command; do not edit XML sources

**Interfaces:**
- Consumes all target types and table declarations from Tasks 1–6.
- Produces observable XML → YAML → XML, find-references and rename coverage.

- [ ] **Step 1: Add failing integration cases**

Cover one representative of each agreed field group plus base-register rename inside `База<Имя>` and table-field references.

- [ ] **Step 2: Run focused integration tests and verify failure**

Run: `pnpm --filter @nkdk/rules exec vitest run --project integration packages/rules/metadata/importFromXml packages/rules/metadata/operations`
Expected: FAIL until all contributions are wired through worker/runtime composition.

- [ ] **Step 3: Verify worker/runtime serialization support**

Run `packages/rules/metadata/projectState/binary/readSession.test.ts` and worker integration tests with the new kinds. If a derived table index is absent after decoding, rebuild it deterministically from `ValidationObjectRecord[]`; do not persist applied-object predicates in the binary state.

- [ ] **Step 4: Regenerate only NKDK YAML expectations**

Run: `pnpm fixtures:e2e:nkdk`
Review: only agreed English metadata references change to Russian; XML files remain untouched.

- [ ] **Step 5: Run round-trip and e2e tests**

Run: `pnpm --filter @nkdk/rules test && pnpm test:e2e`
Expected: PASS.

- [ ] **Step 6: Check duplicates and commit**

```bash
pnpm duplicates -- --base 64093876e
git add packages/rules/metadata e2e/fixtures/nkdk
git commit -m "test: :white_check_mark: закрепить русские ссылки метаданных"
```

### Task 8: Полная проверка

**Files:**
- No planned source changes; a failure returns execution to the task that owns the failing contract.

- [ ] **Step 1: Run all required checks**

```bash
pnpm type-check
pnpm test
pnpm duplicates -- --base 64093876e
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: all commands exit 0.

- [ ] **Step 2: Review scope and dirty worktree**

Run: `git diff --stat 64093876e...HEAD && git status --short`
Verify that user-owned XML changes remain unstaged/uncommitted and no existing XML fixture was changed by implementation.

- [ ] **Step 3: Confirm commit boundaries**

Run: `git log --oneline 64093876e..HEAD`
Expected: each implementation layer has its own commit and no uncommitted implementation files remain.
