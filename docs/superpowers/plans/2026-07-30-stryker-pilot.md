# Stryker Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить ручной пилот mutation testing для `targetResolver.ts` и получить первый отчёт Stryker.

**Architecture:** Stryker запускается из корня монорепозитория через официальный Vitest runner и использует существующую конфигурацию `packages/core/vitest.config.ts`. Список изменяемых файлов ограничен одним модулем, отчёт остаётся локальным, CI и обязательные пороги не меняются.

**Tech Stack:** pnpm, TypeScript, Vitest 4, StrykerJS 9.

## Global Constraints

- Не изменять существующие XML-фикстуры.
- Не включать пилот в CI.
- Не задавать обязательный порог mutation score.
- Не изменять тесты и production-код пилотного модуля.
- Сохранить все посторонние изменения в исходном рабочем дереве.
- Спецификация: `docs/superpowers/specs/2026-07-30-stryker-pilot-design.md`.

---

### Task 1: Подключить и запустить пилот Stryker

**Files:**
- Create: `stryker.config.mjs`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `packages/core/vitest.config.ts`, `packages/core/scripts/fixture-wizard/targetResolver.ts`, `packages/core/scripts/fixture-wizard/targetResolver.test.ts`.
- Produces: корневая команда `pnpm test:mutation:pilot` и локальный отчёт `reports/stryker/pilot.html`.

- [x] **Step 1: Проверить исходный целевой тест**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/fixture-wizard/targetResolver.test.ts
```

Expected: 1 test file и 5 тестов завершаются со статусом PASS.

- [x] **Step 2: Зафиксировать отсутствие команды пилота**

Run:

```bash
pnpm test:mutation:pilot
```

Expected: FAIL с сообщением об отсутствии script `test:mutation:pilot`.

- [x] **Step 3: Установить официальный StrykerJS и Vitest runner**

Run:

```bash
pnpm add -Dw @stryker-mutator/core@^9.6.1 @stryker-mutator/vitest-runner@^9.6.1
```

Expected: зависимости добавлены в корневые `package.json` и `pnpm-lock.yaml`, конфликтов peer dependencies с Vitest 4 нет.

- [x] **Step 4: Добавить ручную команду**

В корневой `package.json` добавить:

```json
"test:mutation:pilot": "stryker run"
```

- [x] **Step 5: Создать ограниченную конфигурацию**

Создать `stryker.config.mjs`:

```js
/** @type {import("@stryker-mutator/api/core").PartialStrykerOptions} */
export default {
  mutate: ["packages/core/scripts/fixture-wizard/targetResolver.ts"],
  tsconfigFile: "tsconfig.stryker-unused.json",
  disableTypeChecks: false,
  testRunner: "vitest",
  plugins: ["@stryker-mutator/vitest-runner"],
  vitest: {
    configFile: "packages/core/vitest.config.ts",
    related: true,
  },
  reporters: ["clear-text", "progress", "html"],
  htmlReporter: {
    fileName: "reports/stryker/pilot.html",
  },
}
```

- [x] **Step 6: Исключить локальный отчёт из git**

Добавить в `.gitignore`:

```gitignore
# Локальные отчёты mutation testing
reports/stryker/
```

- [x] **Step 7: Проверить пилот**

Run:

```bash
pnpm test:mutation:pilot
```

Expected: Stryker изменяет только `targetResolver.ts`, печатает mutation score и создаёт `reports/stryker/pilot.html`.

- [x] **Step 8: Проверить проект**

Run:

```bash
pnpm test
```

Expected: все пакеты и проверки длительности завершаются со статусом PASS.

- [x] **Step 9: Проверить состав изменений**

Run:

```bash
git diff --check
git status --short
```

Expected: нет ошибок форматирования; локальный HTML-отчёт не отображается.
