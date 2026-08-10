# Оптимизация длительности тестов core — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Обеспечить устойчивое прохождение исходных бюджетов `@nkdk/core`: не более 3 с суммарного setup и не более 1 с на test file без изменения лимитов и потери договоров.

**Architecture:** Сначала отменить неустойчивую выборочную регистрацию и доказать, что проекты Vitest дают отдельные окружения изменяемых реестров при одном запуске и общем кэше преобразования TypeScript. Затем распределить тесты по слоям с минимальными setup-модулями; production-композицию не менять. Если изоляция или бюджет не подтверждаются, остановить этот план и спроектировать повторяемую production-регистрацию отдельно.

**Tech Stack:** TypeScript, Node.js, pnpm, Vitest 4, lifecycle reporter.

## Global Constraints

- Не менять `TEST_PACKAGE_SETUP_LIMIT_MS = 3_000` и `TEST_FILE_LIMIT_MS = 1_000`.
- Не добавлять коэффициент macOS и не использовать `CI=true` в итоговой проверке.
- Не изменять XML-фикстуры и не уменьшать смысловое покрытие.
- Не переносить дорогой импорт из setup в test file, `beforeAll` или `globalSetup` ради изменения отчёта.
- Не изменять production-регистрацию без отдельного дизайна и согласования.
- Не принимать разделение проектов, если их изменяемые реестры фактически общие.
- После каждого законченного слоя запускать `pnpm duplicates -- --base 0d550245a`.

---

### Task 1: Отменить неустойчивый эксперимент

**Files:**

- Restore through revert: `packages/core/vitest.config.ts`
- Restore through revert: `packages/core/metadata/importBoundaries.test.ts`
- Restore through revert: семь test files с выборочным импортом `tests/registerCoreMetadata.ts`
- Delete through revert: `docs/superpowers/results/2026-08-10-test-duration-optimization.md`

**Interfaces:**

- Consumes: commits `74b3745cd` and `ab81294da`.
- Produces: исходный детерминированный setup полной композиции и отсутствие неподтверждённого отчёта.

- [ ] **Step 1: Зафиксировать состояние перед откатом**

Run:

```bash
git status --short
git show --stat --oneline 74b3745cd
git show --stat --oneline ab81294da
```

Expected: worktree чистый; первый коммит содержит только неподтверждённый отчёт, второй — удаление setup и выборочные импорты.

- [ ] **Step 2: Отменить неподтверждённый отчёт**

Run:

```bash
git revert --no-commit 74b3745cd
git commit -m "revert: :rewind: удалить неподтверждённый отчёт" -m "Результат был записан до проверки случайного порядка тестов и оказался недостоверным.

Reverts 74b3745cd"
```

Expected: создан revert-коммит, файл результата удалён.

- [ ] **Step 3: Отменить выборочные импорты**

Run:

```bash
git revert --no-commit ab81294da
git commit -m "revert: :rewind: отменить выборочную регистрацию metadata" -m "Выборочные импорты зависят от порядка файлов при общем изменяемом реестре.

Reverts ab81294da"
```

Expected: `tests/registerCoreMetadata.ts` снова присутствует в setup проекта `core-metadata`, выборочные импорты удалены, архитектурная проверка возвращена в исходное состояние.

- [ ] **Step 4: Проверить восстановленный договор**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/composition/coreMetadata.test.ts metadata/importBoundaries.test.ts
pnpm duplicates -- --base 0d550245a
```

Expected: функциональный PASS; проверка дублей PASS. Превышение общего временного бюджета на этом шаге допустимо и остаётся RED оптимизации.

---

### Task 2: Доказать изоляцию проектов Vitest

**Files:**

- Create: `packages/core/tests/projectIsolation/mutation.test.ts`
- Create: `packages/core/tests/projectIsolation/observation.test.ts`
- Modify: `packages/core/vitest.config.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`

**Interfaces:**

- Consumes: `globalThis` каждого окружения Vitest и `sequence.groupOrder`.
- Produces: исполняемый договор, что состояние проекта `isolation-mutation` недоступно проекту `isolation-observation`.

- [ ] **Step 1: Добавить тесты-маркеры**

Create `mutation.test.ts`:

```ts
import { expect, it } from "vitest"

const marker = "__nkdkVitestProjectIsolation__"

it("оставляет маркер только в окружении первого проекта", () => {
  Object.assign(globalThis, { [marker]: true })
  expect((globalThis as Record<string, unknown>)[marker]).toBe(true)
})
```

Create `observation.test.ts`:

```ts
import { expect, it } from "vitest"

it("не видит состояние другого проекта", () => {
  expect((globalThis as Record<string, unknown>)["__nkdkVitestProjectIsolation__"]).toBeUndefined()
})
```

- [ ] **Step 2: Добавить RED структурного договора конфигурации**

В `metadata/importBoundaries.test.ts` добавить проверку, что `vitest.config.ts` содержит проекты `isolation-mutation` и `isolation-observation`, а их `groupOrder` равны 0 и 1. До изменения конфигурации проверка должна падать.

- [ ] **Step 3: Запустить RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importBoundaries.test.ts
```

Expected: FAIL, потому что два проекта изоляции ещё не объявлены.

- [ ] **Step 4: Объявить два служебных проекта**

В `vitest.config.ts` добавить перед обычными проектами:

```ts
{
  test: {
    name: "isolation-mutation",
    include: ["tests/projectIsolation/mutation.test.ts"],
    sequence: { groupOrder: 0 },
    setupFiles: [forbiddenPiscinaSetup, lightweightSetup],
  },
},
{
  test: {
    name: "isolation-observation",
    include: ["tests/projectIsolation/observation.test.ts"],
    sequence: { groupOrder: 1 },
    setupFiles: [forbiddenPiscinaSetup, lightweightSetup],
  },
},
```

Исключить эти два файла из проекта `unit`, чтобы каждый выполнялся ровно один раз.

- [ ] **Step 5: Проверить изоляцию с `--no-isolate`**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate --project isolation-mutation --project isolation-observation
```

Expected: 2 tests PASS. Если второй тест видит маркер, остановить план: вариант (А) опровергнут, изменения Task 2 не коммитить, вернуться к дизайну явной production-регистрации.

- [ ] **Step 6: Проверить дубли и закоммитить доказанный договор**

Run:

```bash
pnpm duplicates -- --base 0d550245a
git add packages/core/vitest.config.ts packages/core/metadata/importBoundaries.test.ts packages/core/tests/projectIsolation
git commit -m "test: :white_check_mark: проверить изоляцию проектов Vitest"
```

Expected: проверки PASS; создан один test-коммит.

---

### Task 3: Разделить metadata-тесты по слоям

**Files:**

- Create: `packages/core/tests/registerCommonObjects.ts`
- Create: `packages/core/tests/registerForms.ts`
- Create: `packages/core/tests/registerAppliedObjects.ts`
- Modify: `packages/core/vitest.config.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`

**Interfaces:**

- Produces: setup-модули `registerCommonObjects.ts`, `registerForms.ts`, `registerAppliedObjects.ts` без новых production API.
- Produces: проекты `common-objects`, `forms`, `applied-objects`, `validation`, `integration` с непересекающимися `include`.
- Consumes: существующий `tests/registerCoreMetadata.ts` только в `validation` и `integration` на первом измерении.

- [ ] **Step 1: Добавить RED структуры проектов**

Расширить архитектурный тест точным списком metadata-проектов:

```ts
for (const projectName of ["common-objects", "forms", "applied-objects", "validation", "integration"]) {
  expect(vitestConfigSource).toContain(`name: "${projectName}"`)
}
```

Также проверить, что `core-metadata` больше не объявлен.

- [ ] **Step 2: Запустить RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importBoundaries.test.ts
```

Expected: FAIL по отсутствующим пяти проектам.

- [ ] **Step 3: Создать setup common objects**

Create `tests/registerCommonObjects.ts`:

```ts
import "../metadata/systemEnumerations"
import "../metadata/commonObjects"
```

- [ ] **Step 4: Создать setup forms**

Create `tests/registerForms.ts`:

```ts
import "./registerCommonObjects"
import "../metadata/forms"
```

- [ ] **Step 5: Создать setup applied objects**

Create `tests/registerAppliedObjects.ts`:

```ts
import "./registerCommonObjects"
import "../metadata/appliedObjects"
```

- [ ] **Step 6: Распределить каталоги по проектам**

В `vitest.config.ts` заменить `core-metadata` следующими непересекающимися группами:

```ts
const commonObjectTests = [
  "metadata/commonObjects/**/*.test.ts",
  "metadata/components/**/*.test.ts",
]
const formTests = [
  "metadata/forms/**/*.test.ts",
  "metadata/ruleRuntime/formElement/**/*.test.ts",
]
const appliedObjectTests = ["metadata/appliedObjects/**/*.test.ts"]
const validationTests = ["metadata/validation/**/*.test.ts"]
const integrationTests = [
  "metadata/fullSyncToXml/**/*.test.ts",
  "metadata/importFromXml/**/*.test.ts",
  "metadata/operations/**/*.test.ts",
  "metadata/project/**/*.test.ts",
  "metadata/projectDefinition/**/*.test.ts",
  "metadata/projectState/**/*.test.ts",
  "metadata/ruleRuntime/appliedObject/**/*.test.ts",
  "metadata/ruleRuntime/metadataItem/**/*.test.ts",
]
```

Проекту `common-objects` назначить `tests/registerCommonObjects.ts`, проекту `forms` — `tests/registerForms.ts`, проекту `applied-objects` — `tests/registerAppliedObjects.ts`. Для `validation` и `integration` временно использовать `tests/registerCoreMetadata.ts`. Все массивы добавить в исключения `unit`.

- [ ] **Step 7: Проверить каждый проект отдельно**

Run последовательно:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate --project common-objects
pnpm --filter @nkdk/core exec vitest run --no-isolate --project forms
pnpm --filter @nkdk/core exec vitest run --no-isolate --project applied-objects
pnpm --filter @nkdk/core exec vitest run --no-isolate --project validation
pnpm --filter @nkdk/core exec vitest run --no-isolate --project integration
```

Expected: каждый проект функционально PASS. При падении сначала установить конкретную недостающую регистрацию и добавить минимальный слой только соответствующему проекту. Не добавлять `registerCoreMetadata.ts` первым трём проектам без отдельного измерения причины.

- [ ] **Step 8: Проверить отсутствие пропущенных и повторных тестов**

Запустить каждый проект с JSON reporter, затем совместный запуск. Сумма `numTotalTests` и множество имён test files отдельных отчётов должны совпасть с совместным отчётом; пересечение множеств файлов отдельных проектов должно быть пустым.

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate --reporter=json --outputFile=/private/tmp/nkdk-projects-all.json
```

Expected: совместный запуск функционально PASS; ни один test file не выполнен дважды и не потерян относительно восстановленного baseline Task 1.

- [ ] **Step 9: Измерить три фиксированных seed**

Run:

```bash
node packages/core/scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260730
node packages/core/scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260731
node packages/core/scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260810
```

Expected во всех трёх запусках: функциональный PASS, setup не более 3 000 мс. Если setup превышен либо исходы зависят от seed, остановить план и не коммитить Task 3: измерительный прототип не подтвердил вариант (А).

- [ ] **Step 10: Проверить архитектуру, дубли и закоммитить**

Run:

```bash
pnpm test:architecture
pnpm duplicates -- --base 0d550245a
git add packages/core/vitest.config.ts packages/core/metadata/importBoundaries.test.ts packages/core/tests/registerCommonObjects.ts packages/core/tests/registerForms.ts packages/core/tests/registerAppliedObjects.ts
git commit -m "perf: :zap: изолировать setup metadata-тестов"
```

Expected: все проверки PASS; создан один performance-коммит.

---

### Task 4: Ускорить только подтверждённые медленные файлы

**Files:**

- Modify only when confirmed by Step 1: `packages/core/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts`
- Modify only when confirmed by Step 1: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts`
- Modify only when confirmed by Step 1: `packages/core/metadata/validation/schemaRegistry.test.ts`
- Modify only when confirmed by Step 1: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify only when confirmed by Step 1: `packages/core/metadata/validation/projectFileSchema.test.ts`

**Interfaces:**

- Consumes: три lifecycle-отчёта Task 3.
- Produces: прежние наблюдаемые договоры, каждый test file не более 1 000 мс.

- [ ] **Step 1: Составить список устойчивых нарушителей**

Включить файл в работу только если он превышает 1 000 мс минимум в двух из трёх запусков Task 3. Для каждого включённого файла записать отдельно `setupDuration`, `collectDuration`, hook time и test time.

- [ ] **Step 2: Сузить DynamicList schema при подтверждённом превышении**

Заменить построение полной DynamicList schema в `beforeAll` на проверку ближайшего экспортёра `exportPropertyToJSONSchema` для `DynamicListRules.properties.keyFields`. Сохранить проверки `string`, `array` и `items: string`; XML → YAML → XML тесты не менять.

- [ ] **Step 3: Лениво строить validation schema при подтверждённом превышении**

В `schemaRegistry.test.ts` и `projectFileSchema.test.ts` удалить безусловный прогрев всех schema. Оставить по одному полному сквозному графу, а остальные schema строить ленивыми функциями с локальным `Map`-кэшем файла. Не переносить полный граф в другой файл только ради лимита.

- [ ] **Step 4: Разделить договоры worker при подтверждённом превышении**

Если `worker.test.ts` устойчиво превышает лимит из-за собственных test/hook time, выделить общий `createImportWorkerTestContext()` и разнести самостоятельные договоры первого прохода, второго прохода и `ПутьКДанным`. Число проверок должно сохраниться, а суммарное время новых файлов не должно вырасти более чем на 10%.

- [ ] **Step 5: Ускорить импорт расширения при подтверждённом превышении**

С профилем `DEBUG=1` определить долю подготовки каталогов, worker-проходов, публикации и чтения snapshot. Переиспользовать один `xmlImportWorkerPoolHandle` и один `projectState` на файл; не подменять публичный `importConfigurationFromXml` предметным результатом.

- [ ] **Step 6: Проверить каждый изменённый файл трижды**

Run для каждого файла, изменённого в Steps 2–5:

```bash
for nkdk_test_file in \
  metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts \
  metadata/importFromXml/importConfigurationExtension.test.ts \
  metadata/validation/schemaRegistry.test.ts \
  metadata/importFromXml/worker.test.ts \
  metadata/validation/projectFileSchema.test.ts
do
  node packages/core/scripts/run-test-duration-check.mjs -- "$nkdk_test_file"
  node packages/core/scripts/run-test-duration-check.mjs -- "$nkdk_test_file"
  node packages/core/scripts/run-test-duration-check.mjs -- "$nkdk_test_file"
done
```

Из списка команды удалить неизменённые файлы. Expected: функциональный PASS и test file не более 1 000 мс во всех трёх запусках.

- [ ] **Step 7: Проверить дубли и закоммитить законченные оптимизации отдельно**

После каждого независимо проверяемого файла или семейства запустить `pnpm duplicates -- --base 0d550245a`, затем использовать одну из точных пар команд:

```bash
git add packages/core/metadata/forms/commonObjects/dynamicList/fromXMLToYAML.test.ts
git commit -m "test: :white_check_mark: ускорить проверку DynamicList schema"

git add packages/core/metadata/validation/schemaRegistry.test.ts packages/core/metadata/validation/projectFileSchema.test.ts
git commit -m "test: :white_check_mark: ускорить построение validation schema"

git add packages/core/metadata/importFromXml/worker.test.ts packages/core/metadata/importFromXml/workerFirstPass.test.ts packages/core/metadata/importFromXml/workerSecondPass.test.ts packages/core/metadata/importFromXml/workerDataPath.test.ts packages/core/metadata/importFromXml/tests/workerTestContext.ts
git commit -m "test: :white_check_mark: разделить договоры import worker"

git add packages/core/metadata/importFromXml/importConfigurationExtension.test.ts
git commit -m "test: :white_check_mark: ускорить импорт расширения"
```

Expected: каждый коммит сохраняет договор и самостоятельно проходит целевые тесты.

---

### Task 5: Подтвердить общий бюджет и записать результат

**Files:**

- Create: `docs/superpowers/results/2026-08-10-test-duration-optimization.md`

**Interfaces:**

- Produces: воспроизводимый отчёт трёх core-прогонов и полного `pnpm test`.

- [ ] **Step 1: Выполнить три package-прогона**

Run:

```bash
node packages/core/scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260730
node packages/core/scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260731
node packages/core/scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260810
```

Expected: все tests PASS; setup не более 3 000 мс; каждый test file не более 1 000 мс во всех трёх запусках.

- [ ] **Step 2: Выполнить обязательные проверки проекта**

Run:

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 0d550245a
```

Expected: каждая команда завершается кодом 0 без коэффициента macOS и без `CI=true`.

- [ ] **Step 3: Записать отчёт**

В документе указать для каждого seed: число файлов и тестов, setup, общую длительность, максимальный test file. Отдельно перечислить изменённые, разделённые и удалённые тесты; для каждого нового теста назвать уникальный договор, для удаления — оставшуюся защиту.

- [ ] **Step 4: Проверить отчёт и закоммитить**

Run:

```bash
git diff --check
git add docs/superpowers/results/2026-08-10-test-duration-optimization.md
git commit -m "docs: :memo: подтвердить бюджет тестов core"
```

Expected: отчёт содержит только фактически полученные числа и не заявляет прохождение команды, завершившейся с ошибкой.
