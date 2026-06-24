# Graph Package Interface Migration Finish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Довести миграцию `@nakidka/core` с `MetadataGraph/graphology` на `GraphBuilder` и `@nakidka/graph.updateGraph` до зелёного `pnpm test`.

**Architecture:** Рабочая копия уже содержит основной перенос: `buildGraph` и `importMetadataFileWithGraph` работают через `GraphBuilder`, старый `metadata/relations/` удалён, CLI `update-graph` вызывает `buildGraph(...)` и `@nakidka/graph.updateGraph(...)`. Оставшийся риск — тестовая гонка в `syncConfigurationToXML` и финальная сверка, что старые публичные API/зависимости не протекли обратно.

**Tech Stack:** TypeScript, Vitest, pnpm workspaces, `@nakidka/core`, `@nakidka/graph`.

---

## Файловая структура

**Модифицируем:**
- `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts` — развести временную папку YAML→XML теста с XML→YAML тестом, который использует `syncConfiguration/out`.
- `docs/superpowers/plans/2026-04-28-graph-package-interface-migration.md` — по желанию отметить фактически выполненные фазы и оставить ссылку на этот короткий план добивки.

**Только проверяем:**
- `packages/core/index.ts` — не экспортирует `MetadataGraph`, `walk`, `validateReferenceScope`.
- `packages/core/package.json`, `pnpm-lock.yaml`, `packages/core/vitest.config.ts` — не содержат `graphology`.
- `packages/core/metadata/relations/` — удалён.
- `packages/extension/src/extension/main.ts` — не регистрирует удалённые graphology provider'ы.
- `packages/cli/src/commands/updateGraph.ts` — не импортирует `MetadataGraph`, использует `buildGraph` и `@nakidka/graph.updateGraph`.

---

### Task 1: Устранить гонку `syncConfiguration/out` в полном `pnpm test`

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Зафиксировать падающий полный прогон**

Run:

```bash
pnpm test
```

Expected: FAIL только в `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`:

```text
Error: ENOENT: no such file or directory, open '.../syncConfiguration/out/Catalogs/Контрагенты.xml'
```

Причина: `convertFromXML.test.ts` тоже использует `syncConfiguration/out` и может удалить папку параллельно.

- [ ] **Step 2: Переименовать outputDir в тесте YAML→XML**

В `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts` заменить:

```ts
const outputDir = getXMLFixturePath("sync/syncConfiguration/out")
```

на:

```ts
const outputDir = getXMLFixturePath("sync/syncConfiguration/out-to-xml")
```

- [ ] **Step 3: Обновить чтение результата Catalog XML**

В том же файле заменить:

```ts
const resultMetadataXML = readXMLFileAsString(join("sync/syncConfiguration/out/Catalogs", `${catalogName}.xml`))
```

на:

```ts
const resultMetadataXML = readXMLFileAsString(join("sync/syncConfiguration/out-to-xml/Catalogs", `${catalogName}.xml`))
```

- [ ] **Step 4: Обновить чтение результата Form XML**

Заменить:

```ts
join("sync/syncConfiguration/out", "Catalogs", catalogName, "Forms", "ФормаЭлемента", "Ext", "Form.xml")
```

на:

```ts
join("sync/syncConfiguration/out-to-xml", "Catalogs", catalogName, "Forms", "ФормаЭлемента", "Ext", "Form.xml")
```

- [ ] **Step 5: Обновить чтение результата Form metadata XML**

Заменить:

```ts
join("sync/syncConfiguration/out", "Catalogs", catalogName, "Forms", "ФормаЭлемента.xml")
```

на:

```ts
join("sync/syncConfiguration/out-to-xml", "Catalogs", catalogName, "Forms", "ФормаЭлемента.xml")
```

- [ ] **Step 6: Прогнать узкий тест**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS, 2 tests passed.

- [ ] **Step 7: Коммит**

```bash
git add packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "test: :white_check_mark: развести output-папки syncConfiguration"
```

### Task 2: Финальная сверка удаления graphology-слоя

**Files:**
- Check: `packages/core`
- Check: `packages/cli`
- Check: `packages/extension`
- Check: `pnpm-lock.yaml`

- [ ] **Step 1: Проверить старые импорты и зависимости**

Run:

```bash
rg -n "metadata/relations|MetadataGraph|graphology|validateReferenceScope|\\bwalk\\b" packages/core packages/cli packages/extension pnpm-lock.yaml --glob '*.ts' --glob '*.json' --glob '*.yaml'
```

Expected: нет совпадений, кроме допустимого `@nodelib/fs.walk` в `pnpm-lock.yaml`, если команда ищет слово `walk`.

- [ ] **Step 2: Проверить, что папки relations нет**

Run:

```bash
test ! -e packages/core/metadata/relations
```

Expected: exit code 0.

- [ ] **Step 3: Проверить CLI-команду update-graph**

Run:

```bash
sed -n '1,140p' packages/cli/src/commands/updateGraph.ts
```

Expected: файл начинается так:

```ts
import { updateGraph as writeGraph } from "@nakidka/graph"
import { buildGraph } from "@nakidka/core"
```

и не содержит `MetadataGraph`, `connect`, `query`, `ensureIndex`.

- [ ] **Step 4: Коммит, если есть правки после сверки**

```bash
git add packages/core packages/cli packages/extension pnpm-lock.yaml
git commit -m "refactor: :fire: удалить graphology-слой metadata/relations"
```

### Task 3: Финальная проверка типов и тестов

**Files:** —

- [ ] **Step 1: Type-check core**

Run:

```bash
pnpm --filter @nakidka/core run type-check
```

Expected: PASS.

- [ ] **Step 2: Build CLI**

Run:

```bash
pnpm --filter @nakidka/cli run build
```

Expected: PASS.

- [ ] **Step 3: Type-check extension**

Run:

```bash
pnpm --filter nkdk exec tsc -b tsconfig.json --pretty false
```

Expected: PASS.

- [ ] **Step 4: Full test**

Run:

```bash
pnpm test
```

Expected: PASS across workspace packages.

- [ ] **Step 5: Final status**

Run:

```bash
git status --short
```

Expected: only intended migration files are modified/deleted; no generated `out-to-xml`, `_tmp_xml`, `_tmp_yaml`, or `out-debug` directories remain.

If generated fixture output directories exist, remove only generated output directories:

```bash
rm -rf packages/core/tests/fixtures/sync/syncConfiguration/out-to-xml packages/core/tests/fixtures/sync/syncConfiguration/out-debug
```

- [ ] **Step 6: Финальный коммит**

```bash
git add packages/core packages/cli packages/extension pnpm-lock.yaml docs/superpowers/plans/2026-04-29-graph-package-interface-migration-finish.md
git commit -m "refactor: :recycle: завершить миграцию graph package interface"
```

---

## Self-Review

**Spec coverage:** план закрывает хвост нулевого этапа: `graphology` удалён из core, старый `metadata/relations` удалён, CLI пишет через `@nakidka/graph.updateGraph`, extension provider'ы удалены, тесты включены обратно.

**Placeholder scan:** в задачах нет `TODO/TBD`; каждый шаг содержит точный файл, команду или заменяемый фрагмент.

**Type consistency:** используются текущие имена `GraphBuilder`, `buildGraph`, `updateGraph as writeGraph`, `FileGraphData`, `ReferenceScope`.
