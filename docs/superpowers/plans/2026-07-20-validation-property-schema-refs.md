# Reusable validation property schemas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Проверять каждый YAML-файл одним AJV-валидатором и вынести в `$ref` только повторно используемые validation-схемы свойств, оставив индивидуальные свойства inline.

**Architecture:** Экспорт свойства сначала строит его окончательную validation-схему со всеми общими преобразованиями, затем opt-in регистрация типа решает, заменить ли её `$ref`. Регистрация живёт рядом с реализацией типа; она возвращает читаемый ключ, а нейтральный реестр хранит схему под `nkdk://schema/validation/<version>/<language>/<key>`. Граф validation забирает эти схемы как обычные достижимые refs; публичные `schema --inline`, `schema --json-schema` и MCP не включают новый режим.

**Tech Stack:** TypeScript, TypeBox, AJV 2020, Vitest, pnpm.

## Global Constraints

- Изменение касается только validation; публичные режимы CLI и MCP не меняют состав inline/ref схем.
- `DataPath`, `Events`, metadata-target-свойства и `TypeDescription` с `allowedTypes` остаются inline.
- Внешний `$ref` — явный opt-in рядом с регистрацией property type; отсутствие opt-in означает inline.
- Идентификатор включает только параметры, меняющие принятие JSON Schema, а не данные второго прохода validation и не описания.
- Для `boolean` и `SystemEnumeration` ключ учитывает исключённое `implicitValueYAML`.
- Не добавлять знания о конкретных property type в `metadata/validation`, `metadata/project` или `metadata/orchestration`.
- Не изменять XML-фикстуры.
- Пока пользователь не отменит ограничение, не создавать коммиты; рабочая ветка: `codex/validation-ref-identities`.

---

## File structure

| Файл | Ответственность |
| --- | --- |
| `packages/core/metadata/context/types.ts` | Внутренний флаг экспортного контекста, включающий validation property refs. |
| `packages/core/metadata/orchestration/jsonSchemaRefs.ts` | Нейтральная регистрация opt-in identity, временное хранение схем и выдача `$ref`. |
| `packages/core/metadata/orchestration/property/fn.ts` | Тип операции `validationSchemaRef`. |
| `packages/core/metadata/orchestration/property/typeRuleRegistry.ts` | Хранение и чтение операции `validationSchemaRef`. |
| `packages/core/metadata/orchestration/property/toJSONSchema.ts` | Построение полной схемы свойства до замены на `$ref`. |
| `packages/core/metadata/project/schemaRegistry.ts` | Передача флага в graph export и разрешение зарегистрированных validation refs. |
| `packages/core/metadata/validation/projectValidationPasses.ts` | Экспорт property graph в validation-режиме и удаление отдельной проверки формы. |
| `packages/core/metadata/validation/projectValidationStandaloneSchemas.ts` | Тот же graph для generated standalone-модуля, включая form-корень для реальных `Форма.yaml`. |
| `packages/core/metadata/validation/projectValidationStandaloneTypes.ts` | Сохранение `form` в standalone-договоре как корня для реальных `Форма.yaml`; refs берутся из общего validation graph. |
| `packages/core/metadata/validation/projectValidationStandaloneLoader.ts` | Загрузка только валидаторов по project dir. |
| `packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts` | Генерация только валидаторов по project dir. |
| `packages/core/metadata/commonObjects/boolean/toJSONSchema.ts` | Opt-in и читаемый ключ boolean. |
| `packages/core/metadata/systemEnumerations/toJSONSchema.ts` | Opt-in и читаемый ключ системного перечисления. |
| `packages/core/metadata/forms/schemaRegister.ts` | Явная фиксация сохранённых внешних refs составных форм. |
| `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts` | Контракт opt-in, ключей и изоляции публичного экспорта. |
| `packages/core/metadata/validation/projectValidationPasses.test.ts` | Один валидатор общей формы и путь диагностики. |
| `packages/core/metadata/validation/projectValidationStandalone*.test.ts` | Сокращённый формат standalone-модуля. |

### Task 1: Ввести opt-in договор validation property refs

**Files:**

- Modify: `packages/core/metadata/context/types.ts:22-33`
- Modify: `packages/core/metadata/orchestration/property/fn.ts:80-85,298-361`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts:1-105`
- Modify: `packages/core/metadata/orchestration/jsonSchemaRefs.ts:1-170`
- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts:86-137`
- Test: `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts`

**Interfaces:**

- Produces `ValidationSchemaRefFn`: `(params: { context: ConfigurationContext; rule: PropertyRule; schema: TSchema }) => string | undefined`.
- Produces `registerValidationSchemaRef(name, schema)` and `exportValidationPropertyRefSchema(...)` in `jsonSchemaRefs.ts`.
- Consumes `context.exportToJSONSchema.validationPropertyRefs === true`; without it the function returns `undefined` and leaves the schema inline.

- [ ] **Step 1: Write failing tests for opt-in and final-schema timing**

  In `jsonSchemaRefs.test.ts` add a test type `TestValidationBoolean` whose `exportToJSONSchema` returns `Type.Union([Type.Literal("Истина"), Type.Literal("Ложь")])` and whose `validationSchemaRef` returns `"boolean/without-true"`. Export it with an external validation context and `implicitValueYAML: true`; expect a `$ref` named `nkdk://schema/validation/2.20/ru/boolean/without-true`, expect that ref in `x-nkdk-schemaRefs`, and expect the registered schema to reject `"Истина"`.

  Add the companion public-export assertion with the same rule but without `validationPropertyRefs`: it must remain inline and must not create a validation ref.

- [ ] **Step 2: Run the focused test and confirm the new contract is absent**

  Run: `pnpm --filter @nkdk/core test -- jsonSchemaRefs.test.ts`

  Expected: FAIL because `validationSchemaRef` is not a known operation and the validation `$ref` is not exported.

- [ ] **Step 3: Add the typed operation and context flag**

  Add this type to `property/fn.ts` next to `ExportToJSONSchemaFn`:

  ```ts
  export type ValidationSchemaRefFn = (params: {
    context: ConfigurationContext
    rule: PropertyRule
    schema: TSchema
  }) => string | undefined
  ```

  Add `validationSchemaRef?: ValidationSchemaRefFn` to `TypeRules`, add `"validationSchemaRef"` to `TypeRulesOperations`, and extend both the union and conditional return type in `typeRuleRegistry.ts`. Add `validationPropertyRefs?: true` to `JSONSchemaExportContext`.

  In `jsonSchemaRefs.ts`, add a neutral map `validationSchemas: Map<string, TSchema>`. Its public helpers must create names with:

  ```ts
  function validationSchemaRefName(context: ConfigurationContext, key: string): string {
    return createSchemaRef(`validation/${context.version}/${context.defaultLanguage}/${key}`)
  }
  ```

  `exportValidationPropertyRefSchema` must return `undefined` unless `validationPropertyRefs === true`, obtain the type operation with `getTypeRule(rule.type, "validationSchemaRef")`, store the final `schema` under the generated name, collect the ref, and return `schemaRef(name)`.

- [ ] **Step 4: Apply common transformations before ref replacement**

  In `exportPropertyToJSONSchema`, preserve the override early return. For normal type exports, build `schemaWithDefaults`, then apply `applyExcludedEqualNameYAMLToJSONSchema`, then call `exportValidationPropertyRefSchema({ context, rule, schema })`. Return that `$ref` only when it is defined; otherwise return the completed inline schema.

  Keep the existing `exportPropertyExternalRefSchema` before type export for the current named schemas, so existing public schema output is unchanged.

- [ ] **Step 5: Run focused tests**

  Run: `pnpm --filter @nkdk/core test -- jsonSchemaRefs.test.ts toJSONSchemaImplicitValue.test.ts`

  Expected: PASS; the new test proves that the schema saved under the validation ref already excludes the implicit YAML value.

### Task 2: Перевести boolean и SystemEnumeration на читаемые validation refs

**Files:**

- Modify: `packages/core/metadata/commonObjects/boolean/toJSONSchema.ts`
- Modify: `packages/core/metadata/systemEnumerations/toJSONSchema.ts`
- Test: `packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts`
- Test: `packages/core/metadata/validation/schemaRegistry.test.ts`

**Interfaces:**

- Consumes `registerTypeRule(type, "validationSchemaRef", fn)` from Task 1.
- Produces keys `boolean/base`, `boolean/without-true`, `boolean/without-false` and `SystemEnumeration/<typeSE>[/without-<internal implicitValueYAML>]`.

- [ ] **Step 1: Write failing key and validation tests**

  Add tests that export a boolean with no implicit value, `true`, and `false`; assert the three distinct refs and that each referenced schema accepts exactly the intended explicit YAML values. Add a system-enumeration test using `ModalityUseMode` with two distinct `implicitValueYAML` values; assert distinct refs and rejection only of the excluded YAML literal.

- [ ] **Step 2: Run the focused tests**

  Run: `pnpm --filter @nkdk/core test -- toJSONSchemaImplicitValue.test.ts schemaRegistry.test.ts`

  Expected: FAIL because neither property type has a `validationSchemaRef` registration.

- [ ] **Step 3: Register the two identity functions next to their exporters**

  In `boolean/toJSONSchema.ts`, register a function that maps `undefined`, `true`, and `false` to `boolean/base`, `boolean/without-true`, and `boolean/without-false`. In `systemEnumerations/toJSONSchema.ts`, read `SystemEnumerationPropertyRule.typeSE`; append `without-<internal implicitValueYAML>` only when `implicitValueYAML` is a literal that the common exporter excludes.

  Do not include `defaultValueXML`, XML paths or any second-pass metadata-target constraints in either key.

- [ ] **Step 4: Run focused tests**

  Run: `pnpm --filter @nkdk/core test -- toJSONSchemaImplicitValue.test.ts schemaRegistry.test.ts`

  Expected: PASS; public external JSON Schema tests continue to observe their previous inline scalar shape.

### Task 3: Сделать сохранённые внешние и inline решения явными

**Files:**

- Modify: `packages/core/metadata/forms/schemaRegister.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.ts`
- Test: `packages/core/metadata/validation/schemaRegistry.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toJSONSchema.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts`

**Interfaces:**

- Produces explicit registrations for existing form, child-item and DCS external schemas.
- Preserves inline behavior for `DataPath`, `Events`, metadata-target property types and `TypeDescription`; no registration is added to their files.

- [ ] **Step 1: Write failing registry audit tests**

  Add one table-driven test with these expectations in validation mode:

  ```ts
  [
    ["DataPath", false],
    ["Events", false],
    ["TypeDescription", false],
    ["MetadataDcsMetadataValue", true],
    ["SettingsParameterValue", true],
    ["ClientApplicationForm", true],
  ]
  ```

  Each case exports a representative property and asserts whether its root node is a `$ref` to `nkdk://schema/validation/` or a normal inline schema. For the two pre-existing DCS refs, also assert their semantic names remain distinct for different `valueType`/`typeSE` combinations.

- [ ] **Step 2: Run the audit test**

  Run: `pnpm --filter @nkdk/core test -- schemaRegistry.test.ts dcsMetadataValue/toJSONSchema.test.ts parameterValue/toJSONSchema.test.ts`

  Expected: FAIL until the form/DCS registrations opt into the new validation-only mode or the test fixture is adjusted to distinguish legacy refs.

- [ ] **Step 3: Align existing factories with the opt-in contract**

  Keep existing public `registerProjectJSONSchemaPropertyRefFactory` registrations intact. Add `validationSchemaRef` registrations only where the existing name is stable under the validation context: form schemas and the two DCS types. Reuse `dcsMetadataValueSchemaName` and `settingsParameterValueSchemaKey`; prefix their validation keys with `dcs/` and `settings-parameter-value/` to avoid collision with public schema names.

  Do not add registrations to `metadataPath/toJSONSchema.ts`, `event/toJSONSchema.ts`, `typeDescription/toJSONSchema.ts`, or metadata-target property types. Their absence is the explicit inline decision.

- [ ] **Step 4: Run the audit and targeted type tests**

  Run: `pnpm --filter @nkdk/core test -- schemaRegistry.test.ts dcsMetadataValue/toJSONSchema.test.ts parameterValue/toJSONSchema.test.ts`

  Expected: PASS; inline cases have no validation ref, external cases do.

### Task 4: Перевести project validation на единый schema graph

**Files:**

- Modify: `packages/core/metadata/project/schemaRegistry.ts:72-117`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts:35-210,790-840`
- Modify: `packages/core/metadata/appliedObjects/metadataCommonForm/rules.ts:14-23`
- Modify: `packages/core/metadata/orchestration/property/types.ts:410-430`
- Modify: `packages/core/metadata/project/projectSpecRegistry.ts:7-20`
- Modify: `packages/core/metadata/appliedObjects/configuration/register.ts:80-92`
- Test: `packages/core/metadata/validation/projectValidationPasses.test.ts`

**Interfaces:**

- `exportJSONSchemaGraph` accepts `validationPropertyRefs?: true` and creates its root/export contexts with that flag.
- `ValidationSchemaCache.properties(spec)` validates project `Свойства.yaml` through one graph. `ValidationSchemaCache.form()` remains only for real `Форма.yaml` files and is also compiled through validation graph refs.

- [ ] **Step 1: Rewrite the common-form tests for one validator**

  Remove `cache.form()` setup and assertions. Make the common-form schema test assert `compiled.Context()["nkdk://schema/validation/2.20/ru/ClientApplicationForm"]` is defined and that `compiled.Check({ Форма: { Элементы: {} } })` is true. Keep the invalid `Элементы: []` fixture assertion for `path: "/Форма/Элементы"` and its AJV-derived message.

- [ ] **Step 2: Run the test and confirm current split validation fails the new contract**

  Run: `pnpm --filter @nkdk/core test -- projectValidationPasses.test.ts`

  Expected: FAIL because the root properties schema replaces `Форма` with `Type.Unknown()` and has no validation `ClientApplicationForm` ref.

- [ ] **Step 3: Enable validation refs in graph export and remove the special path**

  Extend `exportJSONSchemaGraph` options and pass `validationPropertyRefs: true` only from `compileProjectPropertiesSchema`. Continue using `stripCollectedSchemaRefs` and `reachableSchemas`, then compile `(schemas, rootSchema, { inlineRefs: false })`.

  Delete `ExternalValidationProperty`, `validationSchemaMode`, `externalValidationProperties`, `replaceExternalValidationProperties`, `validateExternalValidationProperties`, `externalValidationSchema`, `jsonPointer`, and `prefixJsonPointer`. Remove the corresponding declaration from `MetadataCommonFormRules` and the forwarding fields in project registration. Keep `compileRegisteredFormSchema`, but compile it through validation graph refs.

- [ ] **Step 4: Run the focused validation tests**

  Run: `pnpm --filter @nkdk/core test -- projectValidationPasses.test.ts projectValidationStandaloneBuild.test.ts`

  Expected: PASS; a malformed common form is reported by the same properties validator with `/Форма/Элементы`.

### Task 5: Сократить standalone договор и генератор

**Files:**

- Modify: `packages/core/metadata/validation/projectValidationStandaloneSchemas.ts`
- Modify: `packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneTypes.ts`
- Modify: `packages/core/metadata/validation/projectValidationStandaloneLoader.ts`
- Test: `packages/core/metadata/validation/projectValidationStandaloneBuild.test.ts`
- Test: `packages/core/metadata/validation/projectValidationStandaloneLoader.test.ts`

**Interfaces:**

- `ProjectValidationStandaloneSchemaSet` has `{ context, form, refs, byProjectDir }`.
- `ProjectValidationStandaloneModule` keeps `{ format, context, refs, form, byProjectDir }`, but all refs are produced by the same validation graph.

- [ ] **Step 1: Write failing standalone contract tests**

  In build tests, assert that `schemaSet.byProjectDir["ОбщаяФорма"]` contains a validation ref to `ClientApplicationForm` and `schemaSet.refs` contains that schema. In loader tests assert `cache.properties(...)` and `cache.form()` keep working from the same `refs` context.

- [ ] **Step 2: Run standalone tests**

  Run: `pnpm --filter @nkdk/core test -- projectValidationStandaloneBuild.test.ts projectValidationStandaloneLoader.test.ts`

  Expected: FAIL because current schema set and module require `form`.

- [ ] **Step 3: Generate all roots through the validation graph**

  In `createProjectValidationStandaloneSchemaSet`, obtain every root and refs through one `exportJSONSchemaGraph` call with `validationPropertyRefs: true`; use `graph.roots` for `byProjectDir` and `form`, and `graph.schemas` for `refs`. Delete `stripExternalRefsForValidation`, `createStandalonePropertiesSchema`, `replaceExternalValidationProperties`, and `collectExternalRefSchemas`.

  In generator and loader preserve `module.form`/`cache.form()` for real form files, but make them consume the same `refs` context as project-dir validators. Preserve the format string `project-validation-ajv-standalone-v1`.

- [ ] **Step 4: Run standalone tests**

  Run: `pnpm --filter @nkdk/core test -- projectValidationStandaloneBuild.test.ts projectValidationStandaloneLoader.test.ts`

  Expected: PASS; generated validators compile their reachable refs and validate common forms through their owner schema.

### Task 6: Проверить регрессии и сравнить память

**Files:**

- Modify: `docs/superpowers/specs/2026-07-20-validation-external-property-schemas-design.md` only if the measured post-change result differs from the specified command or fixture.
- Test: `packages/core/metadata/validation/projectValidationPasses.test.ts`
- Test: `packages/core/metadata/orchestration/jsonSchemaRefs.test.ts`

**Interfaces:**

- Consumes the baseline from the design: peak RSS 707 MiB, run RSS 682/682/682/682/683 MiB, 4 worker, `project-with-form` fixture.
- Produces a recorded before/after comparison in the implementation handoff, without committing benchmark output.

- [ ] **Step 1: Run the focused regression suite**

  Run: `pnpm --filter @nkdk/core test -- jsonSchemaRefs.test.ts toJSONSchemaImplicitValue.test.ts schemaRegistry.test.ts projectValidationPasses.test.ts projectValidationStandaloneBuild.test.ts projectValidationStandaloneLoader.test.ts`

  Expected: PASS.

- [ ] **Step 2: Run the required full suite**

  Run: `pnpm test`

  Expected: PASS for every workspace package.

- [ ] **Step 3: Rebuild and measure compiled standalone memory**

  Run:

  ```bash
  pnpm --filter @nkdk/core build
  node .agents/skills/validation-profile/validation-profile.mjs \
    packages/core/metadata/validation/__fixtures__/project-with-form --runs 5 --timing
  ```

  Expected: diagnostics remain `0`; report cold/warm duration, peak RSS, every run RSS, JSON Schema worker RSS peak, and absolute/percentage difference from the baseline. Do not attribute total RSS exclusively to schemas.

- [ ] **Step 4: Review the diff and report without committing**

  Run: `git diff --check && git status --short`

  Expected: no whitespace errors; all modified files are limited to this plan's scope. Do not run `git add` or `git commit` until the user explicitly lifts the no-commit constraint.

## Self-review

- [x] Покрытие спецификации: Tasks 1–3 реализуют opt-in, читаемые identity и таблицу inline/ref; Tasks 4–5 удаляют специальный form-валидатор и сокращают standalone-договор; Task 6 проверяет диагностики, полный тест и память.
- [x] Проверка отсутствия placeholders: в задачах указаны пути, команды, ожидаемые результаты и конкретные договоры.
- [x] Согласованность типов: `validationSchemaRef` определяется в Task 1, используется регистрациями в Tasks 2–3, включается graph export в Task 4 и применяется standalone export в Task 5.
