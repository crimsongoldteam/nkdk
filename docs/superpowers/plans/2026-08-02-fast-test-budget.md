# Fast Test Budget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ограничить каждый test case 50 мс, каждый test file 1 000 мс и устранить многоминутные project-state и JSON Schema тесты без потери наблюдаемых договоров.

**Architecture:** JSON-отчёт Vitest проверяется неизменяемым переходником после каждого неинтерактивного запуска. Writer handle тестируется через инъецируемый транспорт, настоящая SQLite остаётся только на минимальной интеграционной границе, а свойства JSON Schema проверяются ближайшими экспортёрами без полной рекурсивной схемы.

**Tech Stack:** TypeScript, Node.js 26, Vitest 4, `node:sqlite`, `worker_threads`, pnpm.

## Global Constraints

- Test case: цель `10` мс, жёсткий предел `50` мс.
- Test file вместе с импортом и hooks: жёсткий предел `1 000` мс.
- Лимиты нельзя повысить параметром или переменной окружения.
- Те же лимиты действуют для `test:integration`.
- Существующие XML-фикстуры не изменяются.
- Наблюдаемые договоры проверяются на ближайшем слое; предметный результат не заменяется mock-ответом.
- Mutation testing в этой реализации не запускается по прямому решению пользователя.

---

### Task 1: Включить обязательный бюджет Vitest

**Files:**

- Create: `packages/core/scripts/assert-test-durations.mjs`
- Create: `packages/core/scripts/assert-test-durations.test.ts`
- Modify: `packages/core/package.json`
- Modify: `packages/platform/package.json`
- Modify: `packages/mcp/package.json`

**Interfaces:**

- Produces: `TEST_DURATION_TARGET_MS = 10`, `TEST_DURATION_LIMIT_MS = 50`, `TEST_FILE_LIMIT_MS = 1_000`.
- Produces: `analyzeTestDurationReport(report)` с результатом `{ warnings, failures }`.
- Produces: CLI `node packages/core/scripts/assert-test-durations.mjs --report <path>`.

- [ ] **Step 1: Написать grouped RED для test case и test file**

  В `assert-test-durations.test.ts` создать искусственный JSON-отчёт и проверить:

  ```ts
  expect(analyzeTestDurationReport(report({ testMs: 10, fileMs: 1_000 }))).toEqual({
    warnings: [],
    failures: [],
  })
  expect(analyzeTestDurationReport(report({ testMs: 10.01, fileMs: 1_000 })).warnings).toHaveLength(1)
  expect(analyzeTestDurationReport(report({ testMs: 50.01, fileMs: 1_000 })).failures).toHaveLength(1)
  expect(analyzeTestDurationReport(report({ testMs: 10, fileMs: 1_000.01 })).failures).toHaveLength(1)
  expect(() => parseArguments(["--report", "result.json", "--max-ms", "100"])).toThrow()
  ```

- [ ] **Step 2: Убедиться в RED**

  Run: `pnpm --filter @nkdk/core exec vitest run scripts/assert-test-durations.test.ts`

  Expected: FAIL — модуль переходника отсутствует.

- [ ] **Step 3: Реализовать неизменяемый анализатор**

  Анализатор обязан отклонять повреждённый отчёт, сортировать warnings/failures по убыванию времени и вычислять длительность файла как `endTime - startTime`. Значение ровно на границе проходит.

- [ ] **Step 4: Подключить анализатор ко всем package scripts**

  Каждый `test` запускает Vitest с собственным JSON-путём и затем CLI-проверку. Для `packages/core` сохранить `--no-isolate --sequence.shuffle`; `test:ui` не менять.

- [ ] **Step 5: Проверить GREEN анализатора и RED текущих медленных файлов**

  Run:

  ```bash
  pnpm --filter @nkdk/core exec vitest run scripts/assert-test-durations.test.ts
  pnpm --filter @nkdk/core exec vitest run metadata/projectState/writerHandle.test.ts metadata/forms/elements/orchestration/toJSONSchema.test.ts --reporter=json --outputFile.json=/private/tmp/nkdk-slow-red.json
  node packages/core/scripts/assert-test-durations.mjs --report /private/tmp/nkdk-slow-red.json
  ```

  Expected: анализатор PASS; проверка текущих медленных файлов FAIL и перечисляет конкретные test cases/files.

- [ ] **Step 6: Commit**

  ```bash
  git add packages/core/scripts/assert-test-durations.mjs packages/core/scripts/assert-test-durations.test.ts packages/core/package.json packages/platform/package.json packages/mcp/package.json
  git commit -m "test: :stopwatch: ограничить длительность тестов"
  ```

---

### Task 2: Ускорить writer handle и SQLite persistence

**Files:**

- Modify: `packages/core/metadata/projectState/writerHandle.ts`
- Modify: `packages/core/metadata/projectState/writerHandle.test.ts`
- Create: `packages/core/metadata/projectState/tests/mockWriterTransport.ts`
- Create: `packages/core/metadata/projectState/tests/mockWriterTransport.test.ts`
- Modify: `packages/core/metadata/projectState/sqlite/persistence.ts`
- Modify: `packages/core/metadata/projectState/sqlite/persistence.test.ts`
- Modify: `packages/core/metadata/projectState/writerWorker.ts`

**Interfaces:**

- Produces: нейтральный `ProjectStateWriterTransport` с `postMessage`, `on`, `once`, `off`, `terminate`.
- `CreateProjectStateWriterHandleOptions` принимает `transportFactory?: () => ProjectStateWriterTransport`; production default создаёт настоящий `Worker`.
- Test helper записывает команды и позволяет синхронно или управляемым Promise вернуть `ProjectStateWriterResponse`, `error` и `exit`.

- [ ] **Step 1: Написать grouped RED транспорта**

  Перевести проверки очереди, отмены, late cancel, неожиданного exit и close на mock transport. Перед изменением production эти тесты должны падать из-за отсутствующего `transportFactory`.

- [ ] **Step 2: Реализовать минимальный transport seam**

  `writerHandle.ts` знает только нейтральный транспорт. Создание `Worker(new URL("./writerWorker.ts", import.meta.url), ...)` остаётся private production factory и используется по умолчанию.

- [ ] **Step 3: Удалить повторные SQLite checkpoint/reopen из unit-тестов handle**

  Unit-тесты утверждают точные команды и результаты lifecycle. Реальная сохранность снимка остаётся в `sqlite/persistence.test.ts`; один raw worker protocol test допускается только при соблюдении 50/1 000 мс.

- [ ] **Step 4: Зафиксировать RED медленного persistence пути**

  Добавить тест минимального checkpoint + reopen с настоящей SQLite и запустить JSON budget checker. Он должен показать превышение, если используется медленный `sqliteBackup`.

- [ ] **Step 5: Устранить подтверждённый источник задержки**

  Если RED подтверждает `sqliteBackup`, checkpoint пишет `database.serialize()` через существующую атомарную публикацию, а load выполняет `database.deserialize(bytes)` с последующими `quick_check` и compatibility checks. Hooks ошибок write/verify/rename сохраняются; SQL не выходит из `sqlite/**`.

- [ ] **Step 6: Проверить GREEN project-state кластера и бюджет**

  Run:

  ```bash
  pnpm --filter @nkdk/core exec vitest run metadata/projectState/writerHandle.test.ts metadata/projectState/sqlite/persistence.test.ts metadata/projectState/tests/mockWriterTransport.test.ts --reporter=json --outputFile.json=/private/tmp/nkdk-project-state-fast.json
  node packages/core/scripts/assert-test-durations.mjs --report /private/tmp/nkdk-project-state-fast.json
  ```

  Expected: tests PASS; budget checker PASS; ни один test case не превышает 50 мс, ни один файл — 1 000 мс.

- [ ] **Step 7: Commit**

  ```bash
  git add packages/core/metadata/projectState
  git commit -m "test: :zap: ускорить проверки состояния проекта"
  ```

---

### Task 3: Ускорить проверки JSON Schema формы

**Files:**

- Modify: `packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts`
- Test: `packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts`

**Interfaces:**

- Consumes: `exportPropertyToJSONSchema({ context, rule, value })`.
- Produces: те же договоры `АвтоВводНовойСтроки` и `РастягиватьПоГоризонтали/Вертикали`, проверенные на ближайшем property-rule слое.

- [ ] **Step 1: Зафиксировать существующее покрытие ближайшего слоя**

  Найти или расширить `toJSONSchemaImplicitValue.test.ts` точной таблицей для `implicitValueYAML`, `noImplicitValueYAML` и допустимых boolean-значений. Новый тест должен падать, если ближайший слой ещё не выражает договор формы.

- [ ] **Step 2: Перенести три дорогих договора**

  В `forms/elements/orchestration/toJSONSchema.test.ts` оставить компактные проверки discriminator, aliases и child item sets. Boolean-договоры проверять прямым `exportPropertyToJSONSchema` на соответствующих правилах, не вызывая `exportElementRuleToJSONSchema` полной рекурсивной формы и `compileValidationSchema`.

- [ ] **Step 3: Проверить GREEN и бюджет JSON Schema**

  Run:

  ```bash
  pnpm --filter @nkdk/core exec vitest run metadata/forms/elements/orchestration/toJSONSchema.test.ts metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts --reporter=json --outputFile.json=/private/tmp/nkdk-form-schema-fast.json
  node packages/core/scripts/assert-test-durations.mjs --report /private/tmp/nkdk-form-schema-fast.json
  ```

  Expected: tests PASS; budget checker PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts packages/core/metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts
  git commit -m "test: :zap: сузить проверки схемы формы"
  ```

---

### Task 4: Подтвердить общий бюджет

**Files:**

- Create: `docs/superpowers/results/2026-08-02-fast-test-budget.md`

**Interfaces:**

- Produces: измерение полного времени до/после и список десяти самых медленных test cases/files.

- [ ] **Step 1: Выполнить обязательные проверки один раз**

  Run:

  ```bash
  pnpm check:duplicates -- --base e768ba6321fc99b2623e04f1fe72a06c77f07b38
  pnpm type-check
  pnpm build
  /usr/bin/time -p pnpm test
  ```

  Expected: все команды PASS; package test scripts сами подтверждают 50/1 000 мс.

- [ ] **Step 2: Записать результат**

  В отчёте указать исходные 10–15 минут, итоговое wall time, десять самых медленных tests/files и отсутствие превышений 50/1 000 мс. Mutation testing не запускать.

- [ ] **Step 3: Независимая рецензия**

  Проверяющий сверяет сохранность договоров writer lifecycle/SQLite persistence/JSON Schema и невозможность обойти бюджет параметром или переменной окружения.

- [ ] **Step 4: Commit**

  ```bash
  git add docs/superpowers/results/2026-08-02-fast-test-budget.md
  git commit -m "perf: :stopwatch: зафиксировать бюджет тестов"
  ```
