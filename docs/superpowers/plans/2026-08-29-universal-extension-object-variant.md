# Единый вариант объектов расширения — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Научить XML-import и XML-export различать собственные (`full`) и заимствованные (`adopted`) объекты расширения единым рекурсивным механизмом, чтобы собственные объекты расширения обрабатывались как объекты обычной конфигурации.

**Architecture:** XML → YAML получает вариант текущего metadata item через предварительный метод зарегистрированного дополнения и передаёт его вложенным правилам неизменяемым локальным контекстом. YAML → XML продолжает использовать `xmlDefaultVariantByLogicalAddress`; состояния расширения и специальные пустые значения включаются только для `adopted`. Вид компонента остаётся отдельным признаком для действительно компонентных различий.

**Tech Stack:** TypeScript, Vitest, `@nkdk/runtime`, `@nkdk/rules`, LMDB-интеграционные проверки, XML/YAML round-trip.

**Spec:** `docs/superpowers/specs/2026-08-29-universal-extension-object-variant-design.md`

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не добавлять новые `!xml`.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры построителей правил.
- Не добавлять частные условия по `дкз_ОбменТипы`, `ExchangePlanContent` или конкретному `itemType` для определения варианта.
- Нейтральный runtime не знает про `ObjectBelonging` и расширения.
- `full` запрещает служебные состояния заимствованной формы; `adopted` сохраняет существующую строгую проверку обязательных состояний.
- Изменение `.agents/architecture.md` явно согласовано пользователем.
- Все изменения поведения выполняются по TDD: тест должен сначала упасть по ожидаемой причине.

---

### Task 1: Рекурсивный вариант XML-import в нейтральном runtime

**Files:**
- Modify: `packages/runtime/metadata/context/types.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/metadataItem/augmenterRegistry.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fn.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/propertyRuleRegistrySet.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/propertyRuleExecutor.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/metadataItem/fromXMLToYAML.ts`
- Test: `packages/rules/metadata/ruleRuntime/metadataItem/fromXMLToYAML.test.ts`
- Test: `packages/rules/metadata/ruleRuntime/metadataItem/augmenterRegistry.test.ts`

**Interfaces:**
- Produces: `FromXMLConfigurationContext.currentXMLDefaultVariant?: "full" | "adopted"`.
- Produces: optional `MetadataItemXmlImportAugmenter.resolveCurrentXMLDefaultVariant(params): "full" | "adopted" | undefined`.
- Produces: registry/execution method `resolveMetadataItemXMLDefaultVariant(params)` with the same result.
- Consumes: existing `MetadataItemXmlImportAugmenter.augment(params)` after property import.

- [ ] **Step 1: Write failing tests for call order and local context**

Add a test augmenter that records the variant visible in a custom property importer. Exercise a parent, a nested metadata item and two siblings. Assert literal observations:

```ts
expect(observed).toEqual([
  ["Parent", "full"],
  ["InheritedChild", "full"],
  ["AdoptedChild", "adopted"],
  ["Sibling", "full"],
])
```

The resolver returns `adopted` only for `AdoptedChild`, returns `undefined` for inherited values and returns `full` for the parent. The property importer must observe the value before `augment` runs.

- [ ] **Step 2: Run the focused runtime tests and verify RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/ruleRuntime/metadataItem/fromXMLToYAML.test.ts metadata/ruleRuntime/metadataItem/augmenterRegistry.test.ts
```

Expected: type/runtime failure because the preliminary resolver and `currentXMLDefaultVariant` do not exist.

- [ ] **Step 3: Add the neutral interfaces and registry forwarding**

Add the optional field and method with exact contracts:

```ts
export interface FromXMLConfigurationContext {
  forReference: boolean
  propertyStateCompatibilityMode?: string
  currentXMLDefaultVariant?: "full" | "adopted"
}

export interface MetadataItemXmlImportAugmenter {
  resolveCurrentXMLDefaultVariant?(params: {
    context: ConfigurationContextFromXML
    rule: MetadataItemRule
    source: Record<string, unknown>
  }): "full" | "adopted" | undefined
  augment(params: AugmentParams): void
}
```

Expose resolver forwarding both through the standalone registry and `PropertyRuleExecution`. If no augmenter is selected or it has no preliminary method, return `undefined`.

- [ ] **Step 4: Scope the variant in `importMetadataItemFromXMLToYAML`**

Build the compatibility source before importing properties. Resolve the variant, then create a new context without mutating the parent:

```ts
const currentXMLDefaultVariant = resolved ?? context.fromXML.currentXMLDefaultVariant ?? "full"
const itemContext = {
  ...context,
  fromXML: { ...context.fromXML, currentXMLDefaultVariant },
}
```

Pass `itemContext` to property import and post-import augmentation. Nested metadata items inherit it naturally; siblings continue from their unchanged parent context.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the command from Step 2. Expected: all selected tests pass.

- [ ] **Step 6: Run layer checks**

Run:

```bash
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 884185d95
```

Expected: all commands exit 0 and no new duplicates are reported.

- [ ] **Step 7: Commit the runtime contract**

```bash
git add packages/runtime/metadata/context/types.ts packages/runtime/metadata/ruleRuntime/metadataItem/augmenterRegistry.ts packages/runtime/metadata/ruleRuntime/property/fn.ts packages/runtime/metadata/ruleRuntime/property/propertyRuleRegistrySet.ts packages/runtime/metadata/ruleRuntime/property/propertyRuleExecutor.ts packages/runtime/metadata/ruleRuntime/metadataItem/fromXMLToYAML.ts packages/rules/metadata/ruleRuntime/metadataItem/fromXMLToYAML.test.ts packages/rules/metadata/ruleRuntime/metadataItem/augmenterRegistry.test.ts
git commit -m "feat: :sparkles: передавать вариант объекта при XML-import"
```

### Task 2: Универсальное определение принадлежности в дополнении расширения

**Files:**
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/collectionStates.ts`
- Test: `packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts`
- Test: `packages/rules/metadata/commonObjects/exchangePlanContent/fromXMLToYAML.integration.test.ts`
- Test: `packages/rules/metadata/commonObjects/predefinedItem/fromXMLToYAML.integration.test.ts`

**Interfaces:**
- Consumes: `MetadataItemXmlImportAugmenter.resolveCurrentXMLDefaultVariant` from Task 1.
- Consumes: `context.fromXML.currentXMLDefaultVariant` from Task 1.
- Produces: `configurationExtensionPropertyStatesAugmenter` resolves ownership from the declared `objectBelonging` rule and gates borrowed-only augmentation by the current variant.

- [ ] **Step 1: Write failing tests for own, adopted and inherited objects**

Extend existing tests with these observable contracts:

```ts
expect(resolve(ruleWithOwnership, { ObjectBelonging: "Adopted" }, "full")).toBe("adopted")
expect(resolve(ruleWithOwnership, {}, "adopted")).toBe("full")
expect(resolve(ruleWithoutOwnership, {}, "adopted")).toBeUndefined()
```

At integration level, import ordinary `ExchangePlanContent.Item` using an extension context whose current variant is `full`; assert it equals the ordinary configuration YAML and does not require `ExtensionProperty`. Keep the existing adopted fixture and assert its tagged result is unchanged.

Add a predefined-item case proving that a `full` owner does not receive an extension tag, while `adopted` still maps `AdoptedNotify` to `!проверять`.

- [ ] **Step 2: Run focused extension import tests and verify RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/appliedObjects/configurationExtension/propertyStates.test.ts
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/commonObjects/exchangePlanContent/fromXMLToYAML.integration.test.ts metadata/commonObjects/predefinedItem/fromXMLToYAML.integration.test.ts
```

Expected: own exchange-plan content still enters borrowed joining and fails with the missing `ExtensionProperty` mode.

- [ ] **Step 3: Implement ownership resolution without `itemType` lists**

Implement the preliminary method on `configurationExtensionPropertyStatesAugmenter`. Use the rule's declared `objectBelonging` property and its `xml`/`xmlParents` path. Return:

```ts
serviceProperties.objectBelonging === "Adopted" ? "adopted" : "full"
```

Return `undefined` when the rule does not declare ownership so nested service objects inherit their owner.

- [ ] **Step 4: Gate imported states by the current variant**

For `full`, skip borrowed-only transformation of `PropertyState`, `ExtensionProperty` and predefined extension state. Before skipping, reject a present borrowed-only marker with a precise error naming the marker and item type. For `adopted`, preserve the existing strict conversion and required-mode errors.

Do not use `componentKind` or an `itemType` allowlist for this branch.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run both commands from Step 2. Expected: all selected tests pass.

- [ ] **Step 6: Run layer checks**

Run:

```bash
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 884185d95
```

- [ ] **Step 7: Commit import behavior**

```bash
git add packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.ts packages/rules/metadata/appliedObjects/configurationExtension/collectionStates.ts packages/rules/metadata/appliedObjects/configurationExtension/propertyStates.test.ts packages/rules/metadata/commonObjects/exchangePlanContent/fromXMLToYAML.integration.test.ts packages/rules/metadata/commonObjects/predefinedItem/fromXMLToYAML.integration.test.ts
git commit -m "fix: :bug: различать объекты расширения при XML-import"
```

### Task 3: Симметричный экспорт состояний и пустых значений

**Files:**
- Modify: `packages/rules/metadata/appliedObjects/configurationExtension/collectionStates.ts`
- Modify: `packages/rules/metadata/ruleRuntime/appliedObject/syncToXML.ts`
- Test: `packages/rules/metadata/commonObjects/exchangePlanContent/fromYAMLToXML.integration.test.ts`
- Test: `packages/rules/metadata/ruleRuntime/appliedObject/syncToXML.test.ts`
- Test: `packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts`

**Interfaces:**
- Consumes: existing `exportConfigurationExtensionCollectionState(..., borrowed)`.
- Consumes: `resolveXMLDefaultVariant(context)` from `@nkdk/runtime/rule-kit`.
- Produces: own exchange-plan content exports only `Item`; adopted content exports `Item` and `ExtensionProperty`.

- [ ] **Step 1: Write failing export tests**

Add a table covering `full` and `adopted` logical-address variants. For the same semantic exchange-plan content assert:

```ts
expect(full.xml).not.toHaveProperty("ExchangePlanContent.ExtensionProperty")
expect(full.xml).toHaveProperty("ExchangePlanContent.Item")
expect(adopted.xml).toHaveProperty("ExchangePlanContent.ExtensionProperty.Item")
```

Add a narrow `syncToXML` test showing that an empty semantic property is treated specially only when `resolveXMLDefaultVariant(context) === "adopted"`; a `full` extension address follows ordinary full-form export.

- [ ] **Step 2: Run focused export tests and verify RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit metadata/ruleRuntime/appliedObject/syncToXML.test.ts metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/commonObjects/exchangePlanContent/fromYAMLToXML.integration.test.ts
```

Expected: the `full` extension case still writes `ExtensionProperty`, and the empty semantic check still branches on component kind.

- [ ] **Step 3: Honor `borrowed` in collection export**

For `ExchangePlanContent`, split tagged YAML only for `borrowed`. For `full`, export ordinary items through the existing metadata-reference converter, preserve saved item order and remove any stale `ExtensionProperty` from every output.

- [ ] **Step 4: Resolve empty semantic behavior by logical-address variant**

Replace the component-only guard in `isEmptySemanticConfigurationExtensionProperty` with:

```ts
if (resolveXMLDefaultVariant(params.context) !== "adopted") return false
```

Keep the existing capability lookup and empty-array/object checks unchanged.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the commands from Step 2. Expected: all selected tests pass.

- [ ] **Step 6: Run layer checks**

Run:

```bash
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 884185d95
```

- [ ] **Step 7: Commit export behavior**

```bash
git add packages/rules/metadata/appliedObjects/configurationExtension/collectionStates.ts packages/rules/metadata/ruleRuntime/appliedObject/syncToXML.ts packages/rules/metadata/commonObjects/exchangePlanContent/fromYAMLToXML.integration.test.ts packages/rules/metadata/ruleRuntime/appliedObject/syncToXML.test.ts packages/rules/metadata/appliedObjects/configurationExtension/exportPropertyStates.test.ts
git commit -m "fix: :bug: экспортировать собственные объекты полной формой"
```

### Task 4: Сквозная матрица вариантов и регрессия `дкз_ОбменТипы`

**Files:**
- Modify: `packages/rules/metadata/appliedObjects/__tests__/directRoundTrip.integration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts`
- Create: `packages/rules/metadata/importFromXml/__fixtures__/ownExtensionExchangePlan/ExchangePlans/дкз_ОбменТипы.xml`
- Create: `packages/rules/metadata/importFromXml/__fixtures__/ownExtensionExchangePlan/ExchangePlans/дкз_ОбменТипы/Ext/Content.xml`

**Interfaces:**
- Consumes: scoped import variant from Task 1.
- Consumes: extension ownership resolver from Task 2.
- Consumes: variant-aware export from Task 3.
- Produces: operation-level proof for configuration, own extension and adopted extension.

- [ ] **Step 1: Add a failing operation-level regression**

Create a compact own exchange plan and its content as new fixtures; do not alter existing fixtures. The plan source must omit `ObjectBelonging=Adopted`; `Content.xml` must contain ordinary `Item` values and no `ExtensionProperty`. In `importExtension()`, copy these two new files into the temporary extension input before import. Assert:

```ts
expect(result.errors).toEqual([])
expect(readYaml("ПланОбмена/дкз_ОбменТипы/Свойства.yaml")).toContain("ПроектныеЗадачи")
```

Also retain one adopted object in the same operation-level matrix so a mistaken global `full` default fails the test.

- [ ] **Step 2: Run the operation-level tests and verify RED**

Run outside the sandbox because the integration path uses LMDB:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project native-lmdb-integration metadata/importFromXml/importConfigurationExtension.integration.test.ts
```

Expected: failure reproduces `Для элемента состава «Справочник.ПроектныеЗадачи» не задан режим ExtensionProperty`.

- [ ] **Step 3: Make only fixture/test-harness adjustments required by the general implementation**

Do not add production exceptions. Ensure the operation context selects the registered extension augmenter and that the full/adopted addresses reach the same production import/export paths used by workers.

- [ ] **Step 4: Run direct and operation-level round-trip tests and verify GREEN**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project integration metadata/appliedObjects/__tests__/directRoundTrip.integration.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project native-lmdb-integration metadata/importFromXml/importConfigurationExtension.integration.test.ts
```

- [ ] **Step 5: Run layer checks**

Run:

```bash
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base 884185d95
```

- [ ] **Step 6: Commit the regression matrix**

```bash
git add packages/rules/metadata/appliedObjects/__tests__/directRoundTrip.integration.test.ts packages/rules/metadata/importFromXml/importConfigurationExtension.integration.test.ts packages/rules/metadata/importFromXml/__fixtures__/ownExtensionExchangePlan
git commit -m "test: :white_check_mark: закрепить варианты объектов расширения"
```

### Task 5: Аудит компонентных развилок и архитектурная документация

**Files:**
- Modify: `.agents/architecture.md`

**Interfaces:**
- Consumes: import current variant and export reconstruction profile.
- Produces: documented separation of component kind from object variant.

- [ ] **Step 1: Classify every production branch on extension component kind**

Run:

```bash
rg -n "componentKind.*configurationExtension|configurationExtension.*componentKind" packages/runtime packages/rules -g '*.ts'
```

For each production branch, classify whether it is ownership-sensitive or genuinely component-wide. The known `syncToXML` ownership branch is already migrated in Task 3. Keep `standardAttributeDescription` unchanged: the real own extension source already confirms component-wide `FillValue xsi:nil`, so this branch must not be migrated on ownership alone. Record this conclusion in the architecture update.

- [ ] **Step 2: Confirm the audit has no unhandled ownership branch**

After Task 3, the expected production results are exactly:

- `syncToXML.ts` uses the current export variant;
- `standardAttributeDescription/rules.ts` remains on component kind;
- orchestration/profile branches use component kind because they select the component implementation, not object ownership.

If the search returns a different production branch, stop execution and return to specification review instead of guessing.

- [ ] **Step 3: Update `.agents/architecture.md`**

In the XML → YAML subprocess, add the preliminary item-variant step before rules processing. Explain:

- ownership-declaring metadata items resolve `full`/`adopted` from XML;
- nested service values inherit the owner's local context;
- export resolves the same distinction from `xmlDefaultVariantByLogicalAddress`;
- component kind is not a substitute for object ownership.

- [ ] **Step 4: Verify architecture and duplicates**

Run:

```bash
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 884185d95
```

- [ ] **Step 5: Commit documentation**

```bash
git add .agents/architecture.md
git commit -m "docs: :memo: описать вариант объекта при XML-преобразовании"
```

### Task 6: Реальная проверка `sed_xml`, полная верификация и передача на ревью

**Files:**
- No production files expected.
- Temporary output only: a fresh directory under `/private/tmp`.

**Interfaces:**
- Consumes: complete implementation from Tasks 1–5.
- Produces: evidence that real `cf` and `cfe/дкз` import and round-trip without changing `/Users/nikita/git/sed_nkdk`.

- [ ] **Step 1: Import the real XML catalog into a fresh temporary project**

Use the project import command/API against `/Users/nikita/git/sed_xml` and a newly created `/private/tmp/...` target. Do not write to `/Users/nikita/git/sed_nkdk`. Capture structured diagnostics for both `cf` and `cfe/дкз`.

- [ ] **Step 2: Verify the real regression and warning contract**

Assert from the structured result:

- `cf` succeeds;
- `cfe/дкз` succeeds;
- no error mentions `дкз_ОбменТипы` or missing `ExtensionProperty`;
- the known unresolved `ПутьКДанным` remains a warning and its YAML value is preserved.

- [ ] **Step 3: Run round-trip for both components**

Use the repository's normal round-trip/import-control-export path against the temporary project. Compare XML semantically with the source and triage any difference. Do not add `!xml` or fixture exceptions to hide a difference.

- [ ] **Step 4: Run complete project verification**

Run outside the sandbox where required:

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 884185d95
git diff --check
git status --short
```

Expected: all commands exit 0; `git status` contains no uncommitted implementation changes.

- [ ] **Step 5: Request a subagent review against spec and plan**

Only now dispatch one review subagent. Give it:

- spec path;
- plan path;
- base commit `884185d95`;
- instruction to inspect `git diff 884185d95...HEAD`, test evidence and architecture documentation;
- instruction to report spec/plan violations, missing tests and accidental component-wide behavior, ordered by severity.

- [ ] **Step 6: Address review findings with TDD**

For every accepted behavioral finding, add a failing test, verify RED, implement the smallest fix and verify GREEN. Re-run complete verification after changes. If the review is clean, make no review-only source changes.

- [ ] **Step 7: Invoke branch-finishing workflow**

Use `superpowers:finishing-a-development-branch`, present its integration options and wait for the user's choice. Do not merge, push or remove the worktree without that choice.
