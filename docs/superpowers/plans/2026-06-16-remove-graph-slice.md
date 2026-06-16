# Remove Graph Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Полностью удалить graph-срез: пакет `packages/graph`, CLI-команды `update-graph`/`watch` и graph-слой из `packages/core`.

**Architecture:** Удаление идёт от внешнего API к внутренним слоям: сначала CLI перестаёт ссылаться на graph-команды, затем `core` теряет graph API и регистрации, затем workspace очищается от пакета и зависимостей. Предметные файлы с `graphicalSchemaField` и `geographicalSchemaField` не относятся к удаляемому срезу и остаются.

**Tech Stack:** TypeScript, pnpm workspaces, Vitest, Commander, `@nakidka/core`, `@nakidka/cli`.

---

## File Structure

- `packages/cli/src/cli.ts` — убрать импорт и регистрацию команд `update-graph` и `watch`.
- `packages/cli/src/cli.test.ts` — сохранить проверку общего обработчика асинхронных ошибок через существующую команду `schema`.
- `packages/cli/src/commands/updateGraph.ts`, `packages/cli/src/commands/updateGraph.test.ts`, `packages/cli/src/commands/watch.ts`, `packages/cli/src/commands/watch.test.ts` — удалить.
- `packages/cli/src/graph/**` — удалить, потому что каталог обслуживает только удаляемые graph-команды.
- `packages/cli/package.json` — убрать зависимости `@nakidka/graph` и `chokidar`.
- `packages/cli/tsconfig.json` — убрать path alias `@nakidka/graph`.
- `packages/core/index.ts` — убрать публичные graph-экспорты.
- `packages/core/package.json` — убрать зависимость `@nakidka/graph`.
- `packages/core/metadata/context/types.ts` — убрать `GraphBuilder` и поле `graph`.
- `packages/core/metadata/commonObjects/index.ts`, `packages/core/metadata/forms/commonObjects/index.ts`, `packages/core/metadata/forms/elements/index.ts` — убрать импорты `graphFromModel`.
- `packages/core/metadata/**/graphFromModel.ts` и `packages/core/metadata/**/graphFromModel.test.ts` — удалить только graph-связанные модули; не трогать `graphicalSchemaField` и `geographicalSchemaField`.
- `packages/core/metadata/graphImport/**`, `packages/core/metadata/orchestration/buildGraph/**`, `packages/core/metadata/orchestration/graphImport/**`, `packages/core/metadata/orchestration/importMetadataFileWithGraph*`, `packages/core/metadata/orchestration/buildGraphFromModel*` — удалить.
- `packages/core/metadata/orchestration/index.ts` — убрать экспорт `./buildGraph`.
- `packages/core/metadata/importBoundaries.test.ts` — убрать исключение для удаляемого graph-теста.
- `packages/graph/**` — удалить пакет целиком.
- `pnpm-lock.yaml` — обновить через `pnpm install --lockfile-only`.

### Task 1: Убрать graph-команды из CLI

**Files:**
- Modify: `packages/cli/src/cli.ts`
- Modify: `packages/cli/src/cli.test.ts`
- Delete: `packages/cli/src/commands/updateGraph.ts`
- Delete: `packages/cli/src/commands/updateGraph.test.ts`
- Delete: `packages/cli/src/commands/watch.ts`
- Delete: `packages/cli/src/commands/watch.test.ts`
- Delete: `packages/cli/src/graph/fileStats.ts`
- Delete: `packages/cli/src/graph/fileStats.test.ts`
- Delete: `packages/cli/src/graph/projectFiles.ts`
- Delete: `packages/cli/src/graph/projectFiles.test.ts`
- Delete: `packages/cli/src/graph/projectGraphName.ts`
- Delete: `packages/cli/src/graph/projectGraphName.test.ts`
- Delete: `packages/cli/src/graph/projectSources.ts`
- Delete: `packages/cli/src/graph/projectSources.test.ts`
- Delete: `packages/cli/src/graph/watchQueue.ts`
- Delete: `packages/cli/src/graph/watchQueue.test.ts`
- Modify: `packages/cli/package.json`
- Modify: `packages/cli/tsconfig.json`

- [ ] **Step 1: Зафиксировать ожидаемое поведение CLI без `watch`**

Replace the second test in `packages/cli/src/cli.test.ts` with this test before deleting `watch`:

```ts
  it("exits after unhandled async command errors in real CLI mode", async () => {
    const stderr = captureStderr()
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never)

    runCli(["node", "nkdk", "schema", "MetadataCatalog", "--inline"])
    await waitForAsyncCatch()

    expect(writtenText(stderr)).toContain("--inline можно использовать только вместе с --json-schema")
    expect(exit).toHaveBeenCalledWith(1)
  })
```

Also remove unused imports from the top of `packages/cli/src/cli.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest"
import { createProgram, runCli } from "./cli"
```

- [ ] **Step 2: Run the CLI test to verify the replacement still passes**

Run:

```bash
pnpm --filter @nakidka/cli exec vitest run src/cli.test.ts
```

Expected: PASS, with both tests in `src/cli.test.ts` green.

- [ ] **Step 3: Remove CLI graph imports and command registrations**

In `packages/cli/src/cli.ts`, delete these imports:

```ts
import { updateGraph, updateGraphFile } from "./commands/updateGraph"
import { watch } from "./commands/watch"
```

Delete the whole `.command("update-graph")` chain and the whole `.command("watch")` chain. The remaining command after `short-round-trip-test` should be `.command("schema")`.

- [ ] **Step 4: Delete CLI graph files**

Run:

```bash
git rm packages/cli/src/commands/updateGraph.ts packages/cli/src/commands/updateGraph.test.ts packages/cli/src/commands/watch.ts packages/cli/src/commands/watch.test.ts
git rm -r packages/cli/src/graph
```

Expected: Git stages deletion of the two commands and the entire `packages/cli/src/graph` directory.

- [ ] **Step 5: Remove CLI graph dependencies**

Edit `packages/cli/package.json` dependencies to remove only these entries:

```json
"@nakidka/graph": "workspace:*",
"chokidar": "3.6.0",
```

Edit `packages/cli/tsconfig.json` and remove only this path alias:

```json
"@nakidka/graph": ["../graph/src/index.ts"],
```

- [ ] **Step 6: Verify no CLI graph references remain**

Run:

```bash
rg -n "@nakidka/graph|update-graph|commands/updateGraph|commands/watch|src/graph|chokidar" packages/cli
```

Expected: no matches except `watch: false` in Vitest configuration if the search includes `packages/cli/vitest.config.ts`.

- [ ] **Step 7: Run CLI tests**

Run:

```bash
pnpm --filter @nakidka/cli test
```

Expected: PASS.

- [ ] **Step 8: Commit CLI removal**

Run:

```bash
git add packages/cli
git commit -m "refactor!: :recycle: удалить graph-команды CLI" -m "BREAKING CHANGE: команды nkdk update-graph и nkdk watch удалены без замены."
```

### Task 2: Удалить публичный graph API и graph-контекст из core

**Files:**
- Modify: `packages/core/index.ts`
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/orchestration/index.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`
- Modify: `packages/core/package.json`

- [ ] **Step 1: Remove graph exports from `packages/core/index.ts`**

Delete these export blocks from `packages/core/index.ts`:

```ts
export {
  importMetadataFileWithGraph,
  type ImportMetadataFileResult,
} from "./metadata/orchestration/importMetadataFileWithGraph"
export { buildGraph, buildGraphForChangedFile } from "./metadata/graphImport/buildGraph"
export {
  discoverProjectGraphFiles,
  isSupportedProjectGraphFile,
} from "./metadata/graphImport/projectFiles"
export type {
  BuildGraphForChangedFileParams,
  FileGraphData,
  FileStats,
  ImportContext,
  ProjectGraphInput,
  ProjectGraphSource,
} from "./metadata/orchestration/buildGraph"
```

- [ ] **Step 2: Remove graph from metadata context**

In `packages/core/metadata/context/types.ts`, delete this import:

```ts
import { GraphBuilder } from "../orchestration/buildGraph/internal/GraphBuilder"
```

Delete this field from `ConfigurationContext`:

```ts
  /** Экземпляр графа, передаётся снаружи (из extension/CLI). Не синглтон. */
  graph?: GraphBuilder
```

- [ ] **Step 3: Remove orchestration graph export**

In `packages/core/metadata/orchestration/index.ts`, delete:

```ts
export * from "./buildGraph"
```

- [ ] **Step 4: Remove deleted test exception from import boundary test**

In `packages/core/metadata/importBoundaries.test.ts`, remove this string from the exceptions list:

```ts
"metadata/commonObjects/metadataField/graphFromModel.unit.test.ts",
```

- [ ] **Step 5: Remove core dependency on `@nakidka/graph`**

Edit `packages/core/package.json` dependencies and remove only:

```json
"@nakidka/graph": "workspace:*",
```

- [ ] **Step 6: Run TypeScript to expose remaining public graph references**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: FAIL at this point is acceptable if it lists references to graph modules that Task 3 deletes. There must be no new errors outside graph-related paths.

Do not commit yet; Task 3 removes the referenced files.

### Task 3: Удалить graph-регистрации и graph-слой core

**Files:**
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/forms/commonObjects/index.ts`
- Modify: `packages/core/metadata/forms/elements/index.ts`
- Delete: graph-only files under `packages/core/metadata/commonObjects/**/graphFromModel*`
- Delete: graph-only files under `packages/core/metadata/forms/**/graphFromModel*`
- Delete: `packages/core/metadata/graphImport/**`
- Delete: `packages/core/metadata/orchestration/buildGraph/**`
- Delete: `packages/core/metadata/orchestration/graphImport/**`
- Delete: `packages/core/metadata/orchestration/importMetadataFileWithGraph.ts`
- Delete: `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`
- Delete: `packages/core/metadata/orchestration/buildGraphFromModel.ts`
- Delete: `packages/core/metadata/orchestration/buildGraphFromModel.test.ts`

- [ ] **Step 1: Remove graph registration imports**

In `packages/core/metadata/commonObjects/index.ts`, delete only these graph registration imports:

```ts
import "./сhoiceParameterLinks/graphFromModel"
import "./сhoiceParameters/graphFromModel"
import "./metadataField/graphFromModel"
import "./metadataRef/graphFromModel"
import "./metadataValue/graphFromModel"
```

In `packages/core/metadata/forms/commonObjects/index.ts`, delete imports ending in `/graphFromModel`.

In `packages/core/metadata/forms/elements/index.ts`, delete only:

```ts
import "./graphFromModel"
import "../commonObjects/associatedTable/graphFromModel"
```

Do not remove imports for `geographicalSchemaField` or `graphicalSchemaField`.

- [ ] **Step 2: Delete graph-only core files**

Run:

```bash
git rm -r packages/core/metadata/graphImport
git rm -r packages/core/metadata/orchestration/buildGraph
git rm -r packages/core/metadata/orchestration/graphImport
git rm packages/core/metadata/orchestration/importMetadataFileWithGraph.ts packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts
git rm packages/core/metadata/orchestration/buildGraphFromModel.ts packages/core/metadata/orchestration/buildGraphFromModel.test.ts
```

Run:

```bash
git rm packages/core/metadata/commonObjects/metadataField/graphFromModel.ts packages/core/metadata/commonObjects/metadataField/graphFromModel.test.ts packages/core/metadata/commonObjects/metadataField/graphFromModel.unit.test.ts
git rm packages/core/metadata/commonObjects/metadataRef/graphFromModel.ts
git rm packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts packages/core/metadata/commonObjects/metadataValue/graphFromModel.test.ts
git rm packages/core/metadata/commonObjects/typeDescription/graphFromModel.ts packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts
git rm packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.ts packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts
git rm packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.ts packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts
```

Run:

```bash
git rm packages/core/metadata/forms/commonObjects/associatedTable/graphFromModel.ts packages/core/metadata/forms/commonObjects/associatedTable/graphFromModel.test.ts
git rm packages/core/metadata/forms/commonObjects/commandName/graphFromModel.ts packages/core/metadata/forms/commonObjects/commandName/graphFromModel.test.ts
git rm packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts
git rm packages/core/metadata/forms/commonObjects/formCommand/graphFromModel.ts
git rm packages/core/metadata/forms/commonObjects/formParameter/graphFromModel.ts
git rm packages/core/metadata/forms/elements/graphFromModel.ts packages/core/metadata/forms/elements/graphFromModel.test.ts
```

- [ ] **Step 3: Fix imports revealed by TypeScript**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: if TypeScript reports imports from deleted graph files, remove only those imports. Keep `graphicalSchemaField` and `geographicalSchemaField` untouched.

Known likely cleanup:

- `packages/core/metadata/forms/elements/button/parameter.ts` imports `extractTypeDescriptionGraph` from the deleted `typeDescription/graphFromModel`; remove that import and the code that registers graph behavior for button parameters.
- `packages/core/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts` may register `buildGraphFromModel`; remove only that graph registration block and related graph-only imports.

- [ ] **Step 4: Verify graph words left in core are either deleted or explicitly allowed**

Run:

```bash
rg -n "buildGraph|GraphBuilder|importMetadataFileWithGraph|buildGraphFromModel|graphFromModel|graphImport" packages/core/metadata packages/core/index.ts packages/core/package.json
```

Expected: no matches.

Run:

```bash
rg -n "graphicalSchemaField|geographicalSchemaField" packages/core/metadata/forms/elements
```

Expected: matches remain; these are subject-domain form elements and must not be deleted.

- [ ] **Step 5: Run core tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 6: Commit core graph removal**

Run:

```bash
git add packages/core
git commit -m "refactor!: :recycle: удалить graph-слой core" -m "BREAKING CHANGE: публичные API buildGraph, buildGraphForChangedFile и importMetadataFileWithGraph удалены."
```

### Task 4: Удалить пакет `packages/graph` и обновить workspace

**Files:**
- Delete: `packages/graph/**`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Delete graph package**

Run:

```bash
git rm -r packages/graph
```

Expected: package `@nakidka/graph`, its tests and FalkorDB integration files are staged for deletion.

- [ ] **Step 2: Refresh lockfile**

Run:

```bash
pnpm install --lockfile-only
```

Expected: `pnpm-lock.yaml` no longer contains importers or packages for `packages/graph`, `@nakidka/graph`, `falkordb` or `testcontainers`.

- [ ] **Step 3: Verify workspace no longer sees graph package**

Run:

```bash
pnpm -r list --depth -1
```

Expected: output lists root, `@nakidka/core`, and `@nakidka/cli`; it does not list `@nakidka/graph`.

- [ ] **Step 4: Search for dependency leftovers**

Run:

```bash
rg -n "@nakidka/graph|packages/graph|falkordb|testcontainers" package.json pnpm-lock.yaml packages pnpm-workspace.yaml --glob "!**/node_modules/**"
```

Expected: no matches.

- [ ] **Step 5: Run full project test**

Run:

```bash
pnpm test
```

Expected: PASS. Scope should show 2 workspace projects under `packages/*`: `@nakidka/core` and `@nakidka/cli`.

- [ ] **Step 6: Commit package removal**

Run:

```bash
git add pnpm-lock.yaml
git commit -m "refactor!: :recycle: удалить пакет graph" -m "BREAKING CHANGE: пакет @nakidka/graph удалён из workspace."
```

### Task 5: Финальная проверка и документация результата

**Files:**
- Modify if needed: `docs/superpowers/specs/2026-06-16-remove-graph-slice-design.md`
- Modify if needed: `.agents/architecture-orchestration.md`

- [ ] **Step 1: Check whether architecture docs need cleanup**

Run:

```bash
rg -n "Граф связей метаданных|buildGraph|GraphBuilder|graphImport|graphFromModel|FalkorDB" .agents/architecture-orchestration.md docs/superpowers/specs/2026-06-16-remove-graph-slice-design.md
```

Expected: `.agents/architecture-orchestration.md` still contains a graph section. Since the graph-slice is removed, delete the obsolete `## Граф связей метаданных` section and graph-specific deferred notes from that architecture document. Keep the spec as historical context.

- [ ] **Step 2: Verify architecture doc after cleanup**

Run:

```bash
rg -n "buildGraph|GraphBuilder|graphImport|graphFromModel|FalkorDB" .agents/architecture-orchestration.md
```

Expected: no matches.

- [ ] **Step 3: Final repository-wide search**

Run:

```bash
rg -n "@nakidka/graph|packages/graph|falkordb|testcontainers|buildGraph|GraphBuilder|importMetadataFileWithGraph|buildGraphFromModel|graphFromModel|graphImport|update-graph" . --glob "!**/node_modules/**" --glob "!docs/superpowers/specs/2026-06-16-remove-graph-slice-design.md" --glob "!docs/superpowers/plans/2026-06-16-remove-graph-slice.md"
```

Expected: no matches except old historical design/plan files under `docs/superpowers/**` if they are intentionally left untouched.

- [ ] **Step 4: Confirm allowed subject-domain graph names remain**

Run:

```bash
rg -n "graphicalSchemaField|geographicalSchemaField" packages/core/metadata/forms/elements
```

Expected: matches remain.

- [ ] **Step 5: Run final verification**

Run:

```bash
pnpm test
pnpm -r exec tsc --noEmit
```

Expected: both commands PASS.

- [ ] **Step 6: Commit docs cleanup if changed**

If `.agents/architecture-orchestration.md` changed, run:

```bash
git add .agents/architecture-orchestration.md
git commit -m "docs: :memo: убрать описание graph-среза"
```

If no docs changed, run:

```bash
git status --short
```

Expected: clean working tree.

## Self-Review

- Spec coverage: Task 1 removes CLI commands and helpers; Task 2 removes public `core` graph API and context; Task 3 removes internal graph model construction and registrations; Task 4 removes `packages/graph` and dependencies; Task 5 covers architecture docs and final searches.
- Placeholder scan: no `TBD`, `TODO`, "implement later", or vague "add tests" steps remain.
- Type consistency: graph API names are consistent across tasks: `buildGraph`, `buildGraphForChangedFile`, `GraphBuilder`, `importMetadataFileWithGraph`, `buildGraphFromModel`, `graphFromModel`, `graphImport`.
