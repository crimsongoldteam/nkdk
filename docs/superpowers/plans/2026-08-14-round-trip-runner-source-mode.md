# Round-trip Runner Source Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Починить исходный запуск MCP worker-ов и определять XML-конфигурации по корневому `Configuration.xml`.

**Architecture:** Общий shell-helper получает устойчивый файловый признак конфигурации. Манифест MCP выбирает публичные TypeScript worker entrypoints только для source URL и сохраняет соседние JavaScript worker-файлы для production-сборки.

**Tech Stack:** Bash, Node.js test runner, TypeScript, Vitest, pnpm.

## Global Constraints

- Не изменять XML-фикстуры и правила XML/YAML.
- Source-режим должен работать без предварительной сборки MCP.
- Имена и расположение worker-файлов production-сборки не меняются.
- Каждый production-договор сначала закрепляется падающим тестом.

---

### Task 1: Определение XML-конфигурации

**Files:**
- Modify: `.agents/skills/round-trip-yaml/round-trip.test.mjs`
- Modify: `.agents/skills/_shared/round-trip-config-dirs.sh`

**Interfaces:**
- Consumes: `round_trip_collect_run_dirs(root: string)` в Bash.
- Produces: каталог попадает в результат только при наличии обычного файла `<catalog>/Configuration.xml`.

- [ ] **Step 1: Написать падающий поведенческий тест helper-а**

Добавить в `round-trip.test.mjs` временный корень с двумя дочерними каталогами: первый содержит только `Configuration.xml`, второй — только `Catalogs/`. Запустить реальный helper через `bash`, проверить, что выбран только первый каталог.

- [ ] **Step 2: Убедиться в правильном RED**

Run: `node --test .agents/skills/round-trip-yaml/round-trip.test.mjs`

Expected: FAIL — каталог с одним `Configuration.xml` не выбран, а каталог с одним `Catalogs/` ошибочно выбран.

- [ ] **Step 3: Реализовать минимальное исправление**

Удалить `ROUND_TRIP_KNOWN_XML_DIRS`; реализовать `round_trip_is_config_dir` через `[ -f "${candidate}/Configuration.xml" ]`.

- [ ] **Step 4: Получить GREEN**

Run: `node --test .agents/skills/round-trip-yaml/round-trip.test.mjs`

Expected: PASS.

- [ ] **Step 5: Проверить новые дубли слоя**

Run: `pnpm duplicates -- --base 37a608af2`

Expected: PASS.

### Task 2: Worker URL для source и compiled MCP

**Files:**
- Create: `packages/mcp/src/metadataWorkerManifest.test.ts`
- Modify: `packages/mcp/src/metadataWorkerManifest.ts`

**Interfaces:**
- Consumes: `createMetadataWorkerManifest(baseUrl: string | URL)`.
- Produces: TypeScript entrypoints `@nkdk/rules/workers/{prepared-yaml,import,sync,generic}` для source URL; соседние `*.js` URL для compiled URL.

- [ ] **Step 1: Написать падающие тесты двух режимов**

Проверить литеральные окончания четырёх URL для `file:///workspace/packages/mcp/src/metadataRuntimeHandle.ts` и `file:///workspace/packages/mcp/dist/bin/nkdk-mcp`.

- [ ] **Step 2: Убедиться в правильном RED**

Run: `pnpm --filter @nkdk/mcp exec vitest run src/metadataWorkerManifest.test.ts`

Expected: FAIL только для source-режима: текущий код возвращает несуществующие соседние JavaScript URL.

- [ ] **Step 3: Реализовать минимальное ветвление манифеста**

Если pathname базового URL оканчивается на `.ts`, разрешить четыре публичных экспорта через `import.meta.resolve`; иначе сохранить существующее построение соседних JavaScript URL.

- [ ] **Step 4: Получить GREEN и проверить соседние тесты**

Run: `pnpm --filter @nkdk/mcp exec vitest run src/metadataWorkerManifest.test.ts src/metadataRuntimeHandle.test.ts src/callScript.test.ts`

Expected: PASS.

- [ ] **Step 5: Проверить типы и новые дубли слоя**

Run: `pnpm --filter @nkdk/mcp exec tsc --noEmit`

Run: `pnpm duplicates -- --base 37a608af2`

Expected: обе команды PASS.

### Task 3: Интеграционная проверка runner-а

**Files:**
- No changes expected.

**Interfaces:**
- Consumes: исправленные helper и source worker manifest.
- Produces: успешный запуск `round-trip-yaml` для минимальной конфигурации или предметный XML diff.

- [ ] **Step 1: Запустить round-trip для `clean` вне песочницы**

Run: `env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/clean ./.agents/skills/round-trip-yaml/round-trip.sh`

Expected: runner распознаёт каталог, запускает import и sync; результатом является чистый цикл либо XML diff, но не ошибка поиска конфигурации/worker-а.

- [ ] **Step 2: Выполнить обязательные проверки репозитория**

Run: `pnpm type-check`

Run: `pnpm test`

Run: `pnpm test:architecture:rules`

Run: `pnpm test:architecture`

Run: `pnpm duplicates -- --base 37a608af2`

Expected: все команды PASS. LMDB-зависимые проверки выполняются вне песочницы.

- [ ] **Step 3: Зафиксировать реализацию**

Сформировать один `fix: :bug:` commit с описанием причин двух дефектов и выполненных проверок.
