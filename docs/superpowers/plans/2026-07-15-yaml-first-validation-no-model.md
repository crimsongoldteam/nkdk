# YAML-first validation without model import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать построение metadata-модели из worker-валидации и оставить в worker только проверку схемы, проход по разобранному YAML через rules.ts, сбор индексов метаданных и зависимостей, а также YAML-first проверки DataPath форм.

**Architecture:** `Подготовка YAML-проекта` читает и разбирает YAML в worker и сохраняет `Worker данные YAML` внутри worker. `Валидация` использует эти данные без передачи распарсенных YAML в главный поток и без `importPropertiesModel` / `importClientApplicationFormFromYAML`; все проверки первой и второй фаз строятся на YAML-фактах, `ValidationRulesSnapshot`, `ProjectReferenceIndex` и `ValidationPendingCheck`. Построение модели остаётся допустимым только за пределами общего worker-пути для переходных операций синхронизации, переименования и поиска ссылок.

**Tech Stack:** TypeScript, Vitest, Piscina worker pool, js-yaml parser, TypeBox JSON Schema, existing metadata `rules.ts`.

## Global Constraints

- Ответы пользователю на русском языке.
- Не изменять существующие XML-фикстуры.
- Не добавлять новые `fromXML`/`toXML`/`fromYAML`/`toYAML` правила без явного запроса; использовать существующие `rules.ts`.
- Общие слои `packages/core/metadata/orchestration`, `packages/core/metadata/validation` и `packages/core/metadata/project` не должны знать конкретные `itemType`, имена XML-корней и папки вроде `Формы`/`Макеты`.
- Worker-валидация не должна строить metadata-модель и не должна импортировать `importPropertiesModel` или `importClientApplicationFormFromYAML`.
- Перед завершением обязательно выполнить `pnpm test` из корня worktree.

---

## File Structure

- Modify: `.agents/architecture.md` - убрать `Построение модели` из операции `Валидация`, уточнить, что валидация работает через YAML-факты.
- Modify: `docs/superpowers/specs/2026-07-14-yaml-common-mechanism-design.md` - привести порядок валидации к решению “без модели в worker”.
- Modify: `packages/core/metadata/importBoundaries.test.ts` - добавить ограничитель, запрещающий модельные импорты в worker-пути validation.
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts` - всегда передавать `ValidationRulesSnapshot` в первую фазу validation; убрать профильные поля `Построение модели` и `Импорт формы`.
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts` - удалить модельный fallback из worker validation, заменить форму на YAML-first `extractValidationYamlFacts`.
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts` - сделать YAML-first факты форм полноценным источником `pendingChecks`, diagnostics и индексов без `ClientApplicationForm`.
- Create: `packages/core/metadata/validation/yamlFactExtractor.form.test.ts` - покрыть YAML-first DataPath формы и отсутствие зависимости от импорта формы.
- Modify: `packages/core/metadata/validation/yamlFactExtractor.test.ts` - покрыть обязательный `rulesSnapshot` для `Свойства.yaml`.
- Modify: `packages/core/metadata/validation/profileReport.test.ts` или ближайший существующий тест отчёта профиля - убедиться, что профиль больше не выводит `Построение модели` и `Импорт формы`.
- Modify: `.agents/skills/validation-profile/validation-profile.mjs` only if labels are hard-coded there; otherwise leave untouched.

## Task 1: Зафиксировать архитектурное ограничение тестами и документами

**Files:**
- Modify: `.agents/architecture.md`
- Modify: `docs/superpowers/specs/2026-07-14-yaml-common-mechanism-design.md`
- Modify: `packages/core/metadata/importBoundaries.test.ts`

**Interfaces:**
- Consumes: current worker validation entry point `packages/core/metadata/project/preparedYamlProjectWorker.ts`.
- Produces: regression test that fails while worker validation can import model-building paths.

- [ ] **Step 1: Add failing boundary test**

Add this test to `packages/core/metadata/importBoundaries.test.ts` near existing validation boundary tests:

```ts
it("worker validation не строит metadata-модель", () => {
  const files = [
    "metadata/project/preparedYamlProjectWorker.ts",
    "metadata/validation/projectValidationPasses.ts",
  ]

  for (const file of files) {
    const source = readFileSync(join(METADATA_DIR, file), "utf-8")
    expect(source).not.toContain("importPropertiesModel")
    expect(source).not.toContain("importClientApplicationFormFromYAML")
    expect(source).not.toContain("getRegisteredFormValidationPasses")
  }
})
```

- [ ] **Step 2: Run boundary test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- importBoundaries.test.ts
```

Expected: FAIL because `projectValidationPasses.ts` still contains `importPropertiesModel` and `getRegisteredFormValidationPasses`.

- [ ] **Step 3: Update architecture document**

In `.agents/architecture.md`:

- In the operations table, change row `Валидация` so `Построение модели` is empty.
- In the `Построение модели` step description, state that validation worker does not use this step.
- In the `Проверка зависимостей` step description, state that it consumes YAML-first indexes and `ValidationPendingCheck`, not `Metadata-модель`.

Required wording:

```md
Валидация не выполняет `Построение модели` в worker: проверки строятся по `Worker данные YAML`, YAML-фактам, `Глобальный индекс метаданных` и `Worker индекс зависимостей`.
```

- [ ] **Step 4: Update design spec**

In `docs/superpowers/specs/2026-07-14-yaml-common-mechanism-design.md`:

- Remove `Построение модели` from the validation command list.
- Replace validation step `Те же worker выполняют Построение модели...` with:

```md
Те же worker выполняют YAML-first проход по `Worker данные YAML`: проверяют JSON Schema, извлекают YAML-факты, строят worker-индексы и формируют отложенные проверки зависимостей. Metadata-модель в этом пути не создаётся.
```

- Keep transition notes for sync/rename/findReferences, because those operations may still build model outside validation worker.

- [ ] **Step 5: Commit task**

Do not commit yet unless the user explicitly asks. Stage-ready files should be limited to the three files above.

## Task 2: Сделать `ValidationRulesSnapshot` обязательным для worker validation

**Files:**
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.test.ts`

**Interfaces:**
- Consumes: `requireValidationRulesSnapshot(): ValidationRulesSnapshot`.
- Produces: every call to `validateProjectFileFirstPass` in worker passes `rulesSnapshot`.

- [ ] **Step 1: Add test for YAML-first properties path**

In `packages/core/metadata/validation/yamlFactExtractor.test.ts`, add a test that calls `extractValidationYamlFacts` for a properties file with `createValidationRulesSnapshot(context)` and asserts at least one object index entry is produced for a known `Свойства.yaml` fixture.

Use the existing fixture helpers already present in this test file. The assertion shape should be:

```ts
expect(result.objectIndexEntries).toEqual(
  expect.arrayContaining([
    expect.objectContaining({
      canonical: expect.stringContaining("."),
    }),
  ])
)
```

- [ ] **Step 2: Always pass rules snapshot from worker**

Change `packages/core/metadata/project/preparedYamlProjectWorker.ts` inside `runValidationFirstPass` from:

```ts
...(file.kind === "form" ? { rulesSnapshot: requireValidationRulesSnapshot() } : {}),
```

to:

```ts
rulesSnapshot: requireValidationRulesSnapshot(),
```

- [ ] **Step 3: Make missing rules snapshot a programmer error**

In `packages/core/metadata/validation/projectValidationPasses.ts`, keep the public parameter optional only if needed by other callers, but inside the worker-first-pass paths call a local helper:

```ts
function requireRulesSnapshot(
  rulesSnapshot: import("./rulesSnapshot").ValidationRulesSnapshot | undefined
): import("./rulesSnapshot").ValidationRulesSnapshot {
  if (rulesSnapshot === undefined) {
    throw new Error("Worker validation requires ValidationRulesSnapshot")
  }
  return rulesSnapshot
}
```

Use it in both `validateProjectFormFirstPass` and `validateProjectPropertiesFirstPass` before `extractValidationYamlFacts`.

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- yamlFactExtractor.test.ts importBoundaries.test.ts
```

Expected: new YAML facts test PASS; boundary test still FAIL until Task 4 removes model paths.

## Task 3: Довести YAML-first факты форм до основного источника проверок

**Files:**
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Create: `packages/core/metadata/validation/yamlFactExtractor.form.test.ts`

**Interfaces:**
- Consumes: `ValidationProjectFile`, `ParsedYaml`, `ClientApplicationFormRules`, `getElementRule`, `DataPathPropertyRule`.
- Produces: `ValidationYamlFacts.pendingChecks` for form `ПутьКДанным` and duplicate form attribute diagnostics without `ClientApplicationForm`.

- [ ] **Step 1: Add form YAML-first tests**

Create `packages/core/metadata/validation/yamlFactExtractor.form.test.ts` with tests for:

```ts
describe("extractValidationYamlFacts form", () => {
  it("строит DataPath checks по YAML формы без metadata-модели", () => {
    // Arrange a parsed form YAML with Реквизиты and Элементы.
    // Act: extractValidationYamlFacts({ file: formProjectFile, parsed, rulesSnapshot })
    // Assert: result.pendingChecks contains kind: "dataPath" and value from ПутьКДанным.
  })

  it("диагностирует дубли реквизитов формы по YAML", () => {
    // Arrange parsed form YAML where duplicate information is representable by parsed YAML object.
    // Act.
    // Assert: diagnostics contain source: "structure" and message about duplicate form attribute.
  })
})
```

Use `parseMetadataYaml` or `parseMetadataYamlData` from `packages/core/yaml/parseMetadataYaml` so diagnostics have the same `ParsedYaml` shape as production.

- [ ] **Step 2: Keep form extraction in `yamlFactExtractor.ts` model-free**

Verify `packages/core/metadata/validation/yamlFactExtractor.ts` contains no import from:

```ts
../forms/clientApplicationForm/fromYAML
../forms/clientApplicationForm/types
```

If a helper needs form-specific YAML knowledge, keep it in this file or a new validation-local file and operate on `Record<string, unknown>`.

- [ ] **Step 3: Ensure form facts include all current second-pass data**

`extractFormYamlFacts` must return:

```ts
{
  ...emptyFacts(),
  pendingChecks,
  diagnostics: index.duplicateDiagnostics,
}
```

Each `ValidationPendingCheck` must include:

```ts
{
  kind: "dataPath",
  filePath,
  parsed,
  yamlPath,
  owner,
  value,
  index,
  rule,
  elementType,
  policy: "formDataPath",
}
```

This is the data consumed later by `validatePendingChecks`.

- [ ] **Step 4: Run form facts tests**

Run:

```bash
pnpm --filter @nakidka/core test -- yamlFactExtractor.form.test.ts
```

Expected: PASS.

## Task 4: Remove model fallback from validation first pass

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`

**Interfaces:**
- Consumes: `extractValidationYamlFacts`.
- Produces: `ProjectValidationFirstPassResult` for properties and forms without `importPropertiesModel`, `getRegisteredFormValidationPasses`, or form import.

- [ ] **Step 1: Replace form first pass with YAML facts only**

In `validateProjectFormFirstPass`, remove:

```ts
const passes = getRegisteredFormValidationPasses()
const first = passes.firstPass(...)
```

Use only:

```ts
const entry = params.cache.get(params.file.absolutePath)
const rulesSnapshot = requireRulesSnapshot(params.rulesSnapshot)
const measuredYamlFacts =
  "error" in entry
    ? undefined
    : measureValidationPhase(() =>
        extractValidationYamlFacts({ file: params.file, parsed: entry.parsed, rulesSnapshot })
      )
const yamlFacts = measuredYamlFacts?.value ?? emptyValidationYamlFacts()
```

If `entry` is an error, return `failedFirstPass` with schema diagnostics.

- [ ] **Step 2: Replace properties model fallback**

In `validateProjectPropertiesFirstPass`, remove the whole branch that calls:

```ts
const imported = importPropertiesModel(...)
```

The only success path after schema and required validators should be the current YAML-facts branch. Keep:

```ts
const measuredYamlFacts = measureValidationPhase(() =>
  extractValidationYamlFacts({ file: params.file, parsed, rulesSnapshot })
)
```

Do not call `collectMetadataTargetReferencesInModel`, `validateUniqueNameScopes`, or `buildObjectFieldIndex` from a metadata model in this worker path.

- [ ] **Step 3: Remove unused imports and profile fields**

Remove unused imports from `projectValidationPasses.ts`, including:

```ts
getRegisteredFormValidationPasses
collectMetadataTargetReferencesInModel
MetadataItem
```

Remove `importMs` and `formImportMs` from `ProjectValidationFirstPassProfile` if no remaining code writes non-zero values. If keeping fields temporarily causes less churn, they must not be recorded by `preparedYamlProjectWorker.ts`.

- [ ] **Step 4: Remove model labels from worker profile**

In `packages/core/metadata/project/preparedYamlProjectWorker.ts`, remove these records:

```ts
profiler.record("Первичная проверка YAML", "Построение модели", ...)
profiler.record("Первичная проверка YAML", "Импорт формы", ...)
```

Keep records for:

```ts
Проверка JSON Schema
Дополнительные валидаторы
Проверка equal-name
Извлечение YAML-фактов
Построение field index
Построение member index
Построение value index
```

- [ ] **Step 5: Run focused regression tests**

Run:

```bash
pnpm --filter @nakidka/core test -- importBoundaries.test.ts validateProject.test.ts yamlFactExtractor.test.ts yamlFactExtractor.form.test.ts
```

Expected: PASS. Boundary test must now pass because worker validation no longer references model imports.

## Task 5: Align profile report with YAML-first validation

**Files:**
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: profile report tests under `packages/core/metadata/validation` or the existing validation-profile skill test if present.
- Possibly Modify: `.agents/skills/validation-profile/validation-profile.mjs`

**Interfaces:**
- Consumes: validation profiler events.
- Produces: profile table where `Первичная проверка YAML` has no `Построение модели` and no `Импорт формы`.

- [ ] **Step 1: Locate profile report tests**

Run:

```bash
rg -n "Первичная проверка YAML|Построение модели|Импорт формы|validation-profile" packages .agents
```

Expected: find either core profile tests or only the skill script.

- [ ] **Step 2: Add or update profile assertion**

If there is a profile report test, add:

```ts
expect(report).toContain("Первичная проверка YAML")
expect(report).toContain("Извлечение YAML-фактов")
expect(report).not.toContain("Построение модели")
expect(report).not.toContain("Импорт формы")
```

If there is no report test, add a focused unit test at the closest existing profile test file that formats a synthetic profile event list.

- [ ] **Step 3: Run profile tests**

Run:

```bash
pnpm --filter @nakidka/core test -- profile
```

Expected: PASS, or if the test selector finds no files, run the exact test file found in Step 1.

## Task 6: Validate on real project and compare profile

**Files:**
- No source edits expected.

**Interfaces:**
- Consumes: `.agents/skills/validation-profile/validation-profile.mjs`.
- Produces: measured profile for `/Users/nikita/git/nkdk-yaml` proving model import is absent.

- [ ] **Step 1: Build if needed**

Run:

```bash
pnpm --filter @nakidka/core build
```

Expected: successful build.

- [ ] **Step 2: Run validation profile**

Run:

```bash
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 1 --timing
```

Expected:

- Table contains `Подготовка YAML-проекта`.
- Table contains `Первичная проверка YAML`.
- Nested rows contain `Проверка JSON Schema`, `Извлечение YAML-фактов`, `Построение field index`, `Построение member index`.
- Table does not contain `Построение модели`.
- Table does not contain `Импорт формы`.
- `Peak RSS` is reported for the whole validation process.

- [ ] **Step 3: Record before/after result in final response**

Use this format:

```md
Профиль `/Users/nikita/git/nkdk-yaml`:
| Шаг | Время | Worker max | Worker avg | Память max |
| --- | ---: | ---: | ---: | ---: |
| Подготовка YAML-проекта | ... | ... | ... | ... |
| - Разбор YAML | ... | ... | ... | ... |
| Первичная проверка YAML | ... | ... | ... | ... |
| - Проверка JSON Schema | ... | ... | ... | ... |
| - Извлечение YAML-фактов | ... | ... | ... | ... |
```

## Task 7: Full verification

**Files:**
- No source edits expected unless tests reveal regressions.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: green project test run.

- [ ] **Step 1: Run full test suite**

Run from `/Users/nikita/git/nkdk/.worktrees/yaml-common-mechanism-spec`:

```bash
pnpm test
```

Expected: all packages pass.

- [ ] **Step 2: Check git diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: only intended files changed.

- [ ] **Step 3: Prepare commit message, but do not commit unless requested**

Suggested commit:

```bash
git add .agents/architecture.md docs/superpowers/specs/2026-07-14-yaml-common-mechanism-design.md packages/core/metadata/importBoundaries.test.ts packages/core/metadata/project/preparedYamlProjectWorker.ts packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/yamlFactExtractor.ts packages/core/metadata/validation/yamlFactExtractor.form.test.ts packages/core/metadata/validation/yamlFactExtractor.test.ts
git commit -m "perf: :zap: убрать построение модели из worker validation"
```

Only run this after explicit user approval.

## Self-Review

- Spec coverage: plan removes model-building from validation worker, keeps parsed YAML inside workers, keeps sync/rename/findReferences model usage out of this task, and updates architecture/spec contradiction.
- Placeholder scan: no placeholder instructions remain.
- Type consistency: task names use existing `ValidationRulesSnapshot`, `ValidationYamlFacts`, `ValidationPendingCheck`, `ProjectValidationFirstPassProfile`, and profiler labels from current code.
