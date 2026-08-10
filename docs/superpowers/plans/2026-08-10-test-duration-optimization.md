# Однократная динамическая загрузка core — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранить полную детерминированную регистрацию metadata и обеспечить setup `@nkdk/core` не более 3 секунд за счёт однократного динамического импорта в обычном Vitest setup.

**Architecture:** Проекты `unit` и `core-metadata` остаются без изменения состава. `tests/registerCoreMetadata.ts` хранит в `globalThis` один Promise модуля и только при первом setup динамически импортирует composition root; последующие test files ожидают готовый Promise и вызывают идемпотентную регистрацию. Production-композиция и реестры не меняются.

**Tech Stack:** TypeScript, Node.js, pnpm, Vitest 4, lifecycle reporter.

## Global Constraints

- Не менять `TEST_PACKAGE_SETUP_LIMIT_MS = 3_000` и `TEST_FILE_LIMIT_MS = 1_000`.
- Не добавлять коэффициент macOS и не использовать `CI=true` в итоговой проверке.
- Не изменять production-регистрацию и XML-фикстуры.
- Не переносить загрузку metadata в `globalSetup`, test case, `beforeAll` или другой lifecycle-этап.
- Не добавлять выборочные импорты `registerCoreMetadata()` в test files.
- Не уменьшать число и смысл проверяемых договоров.
- После каждого законченного слоя запускать `pnpm duplicates -- --base 0d550245a`.

---

### Task 1: Удалить исследовательские проекты изоляции

**Files:**

- Restore through revert: `packages/core/vitest.config.ts`
- Restore through revert: `packages/core/metadata/importBoundaries.test.ts`
- Delete through revert: `packages/core/tests/projectIsolation/mutation.test.ts`
- Delete through revert: `packages/core/tests/projectIsolation/observation.test.ts`

**Interfaces:**

- Consumes: исследовательский commit `253c76ecd`.
- Produces: исходные проекты `unit` и `core-metadata` без двух служебных tests.

- [ ] **Step 1: Проверить содержимое исследовательского commit**

Run:

```bash
git status --short
git show --stat --oneline 253c76ecd
```

Expected: worktree чистый; commit меняет только Vitest config, архитектурный тест и два файла `projectIsolation`.

- [ ] **Step 2: Отменить исследовательский договор**

Run:

```bash
git revert --no-commit 253c76ecd
git commit -m "revert: :rewind: удалить исследовательские проекты Vitest" -m "Изоляция проектов подтверждена, но повторяет setup в каждом окружении и не входит в итоговое решение.

Reverts 253c76ecd"
```

Expected: созданы только проекты `unit` и `core-metadata`; каталог `tests/projectIsolation` удалён.

- [ ] **Step 3: Проверить восстановленную конфигурацию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importBoundaries.test.ts metadata/composition/coreMetadata.test.ts
pnpm duplicates -- --base 0d550245a
```

Expected: 34 tests PASS; новых дублей нет.

---

### Task 2: Зафиксировать RED однократной загрузки

**Files:**

- Create: `packages/core/tests/coreMetadataSetup.test.ts`
- Create in Task 3: `packages/core/tests/coreMetadataSetup.ts`

**Interfaces:**

- Consumes: будущую функцию `ensureCoreMetadataRegistered(params?): Promise<void>`.
- Produces: поведенческий договор «повторные и параллельные setup-вызовы загружают metadata один раз и запрашивают регистрацию при каждом вызове; отклонённый Promise загрузки переиспользуется».

- [ ] **Step 1: Добавить падающий архитектурный тест**

Создать `tests/coreMetadataSetup.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { ensureCoreMetadataRegistered, type CoreMetadataSetupState } from "./coreMetadataSetup"

describe("core metadata test setup", () => {
  it("загружает metadata один раз и восстанавливает регистрацию при каждом setup-вызове", async () => {
    const state: CoreMetadataSetupState = {}
    let loads = 0
    let registrations = 0
    const load = async () => {
      loads += 1
      return {
        registerCoreMetadata() {
          registrations += 1
        },
      }
    }

    await Promise.all([
      ensureCoreMetadataRegistered({ state, load }),
      ensureCoreMetadataRegistered({ state, load }),
    ])
    await ensureCoreMetadataRegistered({ state, load })

    expect({ loads, registrations }).toEqual({ loads: 1, registrations: 3 })
  })

  it("сохраняет первую ошибку загрузки без повторной регистрации", async () => {
    const state: CoreMetadataSetupState = {}
    const failure = new Error("metadata load failed")
    let loads = 0
    const load = async () => {
      loads += 1
      throw failure
    }

    await expect(ensureCoreMetadataRegistered({ state, load })).rejects.toBe(failure)
    await expect(ensureCoreMetadataRegistered({ state, load })).rejects.toBe(failure)
    expect(loads).toBe(1)
  })
})
```

- [ ] **Step 2: Запустить RED**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run tests/coreMetadataSetup.test.ts
```

Expected: FAIL с ошибкой разрешения `./coreMetadataSetup`, потому что test-only модуль ещё не создан.

---

### Task 3: Загружать core metadata один раз и сохранять договор setup

**Files:**

- Create: `packages/core/tests/coreMetadataSetup.ts`
- Modify: `packages/core/tests/registerCoreMetadata.ts`
- Test: `packages/core/tests/coreMetadataSetup.test.ts`
- Test: `packages/core/metadata/composition/coreMetadata.test.ts`

**Interfaces:**

- Produces: `ensureCoreMetadataRegistered(params?): Promise<void>` и глобальное test-only поле `__nkdkCoreMetadataModule?: Promise<CoreMetadataModule>`.
- Consumes: `registerCoreMetadata(): void` из `metadata/composition/coreMetadata`.

- [ ] **Step 1: Реализовать владельца динамического Promise**

Создать `tests/coreMetadataSetup.ts`:

```ts
interface CoreMetadataModule {
  registerCoreMetadata(): void
}

export interface CoreMetadataSetupState {
  __nkdkCoreMetadataModule?: Promise<CoreMetadataModule>
}

type CoreMetadataLoader = () => Promise<CoreMetadataModule>

const globalRegistrationState = globalThis as typeof globalThis & CoreMetadataSetupState
const loadCoreMetadata: CoreMetadataLoader = () => import("../metadata/composition/coreMetadata")

export async function ensureCoreMetadataRegistered(params: {
  state?: CoreMetadataSetupState
  load?: CoreMetadataLoader
} = {}): Promise<void> {
  const state = params.state ?? globalRegistrationState
  const load = params.load ?? loadCoreMetadata

  state.__nkdkCoreMetadataModule ??= load()
  const { registerCoreMetadata } = await state.__nkdkCoreMetadataModule
  registerCoreMetadata()
}
```

- [ ] **Step 2: Заменить статические metadata-импорты лёгким setup-вызовом**

Полностью заменить содержимое `tests/registerCoreMetadata.ts`:

```ts
import { ensureCoreMetadataRegistered } from "./coreMetadataSetup"

await ensureCoreMetadataRegistered()
```

Не добавлять статические imports остальных metadata-barrels: composition root уже импортирует `commonObjects`, `forms`, `appliedObjects` и validation adapters.

- [ ] **Step 3: Запустить GREEN поведенческого и функционального договоров**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run tests/coreMetadataSetup.test.ts metadata/composition/coreMetadata.test.ts
```

Expected: все tests PASS; `getTypeRule("I8nText", "exportToXML")` и `getTypeRule("ClientApplicationForm", "yamlToXMLNestedRule")` остаются зарегистрированы.

- [ ] **Step 4: Проверить полный core на одном фиксированном seed**

Run:

```bash
pnpm --filter @nkdk/core exec node scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260730
```

Expected: функциональный PASS; setup не более 3 000 мс; каждый test file не более 1 000 мс.

Если функциональные tests падают, остановиться и проверить, входит ли отсутствующий side-effect import в граф `metadata/composition/coreMetadata`; не добавлять import в отдельный test file. Если нарушен только временной бюджет, сохранить lifecycle-числа и вернуться к `systematic-debugging` до изменения предметных тестов.

- [ ] **Step 5: Проверить ещё два порядка файлов**

Run:

```bash
pnpm --filter @nkdk/core exec node scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260731
pnpm --filter @nkdk/core exec node scripts/run-test-duration-check.mjs -- --no-isolate --sequence.shuffle --sequence.seed=20260810
```

Expected: оба запуска функционально PASS; setup не более 3 000 мс; каждый test file не более 1 000 мс. Число test files и tests совпадает во всех трёх запусках.

- [ ] **Step 6: Проверить архитектуру, дубли и закоммитить**

Run:

```bash
pnpm test:architecture
pnpm duplicates -- --base 0d550245a
git add packages/core/tests/coreMetadataSetup.ts packages/core/tests/coreMetadataSetup.test.ts packages/core/tests/registerCoreMetadata.ts
git commit -m "perf: :zap: загружать core metadata один раз в setup" -m "Vitest повторно обходил большой статический граф setup для каждого test file. Динамический Promise сохраняет полную регистрацию и выполняет загрузку один раз на общее окружение."
```

Expected: проверки PASS; создан один performance commit.

---

### Task 4: Подтвердить общий бюджет и записать результат

**Files:**

- Create: `docs/superpowers/results/2026-08-10-test-duration-optimization.md`

**Interfaces:**

- Produces: воспроизводимый отчёт трёх core-прогонов и обязательных проверок проекта.

- [ ] **Step 1: Выполнить полный набор проверок**

Run:

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 0d550245a
```

Expected: каждая команда завершается кодом 0 без `CI=true`, изменения лимитов и платформенных коэффициентов.

- [ ] **Step 2: Записать фактические измерения**

Создать `docs/superpowers/results/2026-08-10-test-duration-optimization.md` со следующими разделами:

```markdown
# Результат оптимизации setup тестов core

## Изменение

## Три core-прогона

## Полная проверка проекта

## Покрытие договоров
```

Для каждого seed записать число test files, число tests, setup, общую длительность и максимальную длительность test file. В «Покрытии договоров» указать, что предметные tests и XML-фикстуры не менялись, а два исследовательских tests изоляции удалены вместе с отвергнутым подходом.

- [ ] **Step 3: Проверить отчёт и закоммитить**

Run:

```bash
git diff --check
git add docs/superpowers/results/2026-08-10-test-duration-optimization.md
git commit -m "docs: :memo: подтвердить бюджет тестов core"
```

Expected: отчёт содержит только фактически полученные значения и не заявляет прохождение команды, завершившейся с ошибкой.
