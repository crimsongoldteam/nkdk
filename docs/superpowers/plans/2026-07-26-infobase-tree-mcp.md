# Infobase Tree MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в `@nkdk/platform` получение объединённого дерева информационных баз и опубликовать его через read-only MCP-инструмент `nkdk.list_infobases`.

**Architecture:** Парсер, поиск источников и построение дерева остаются независимыми модулями `@nkdk/platform`; MCP только добавляет схему и оборачивает результат в общий успешный payload. Все файловые сценарии тестируются через модельный `PlatformRuntime` из первого плана.

**Tech Stack:** TypeScript 6, Node.js 26, Vitest 4, Zod 4, MCP SDK, pnpm workspace.

## Global Constraints

- Этот план выполняется после `2026-07-26-platform-installation-discovery.md`.
- Поддерживаются Windows, Linux и macOS.
- Читаются личный `ibases.v8i`, `CommonInfoBases` и `CommonCfgLocation`; `WebCommonInfoBases` игнорируется.
- HTTP-запросы, запуск процессов и запись файлов запрещены.
- Недоступный или повреждённый источник даёт частичный результат с предупреждением.
- Пустые и неявные папки сохраняются; дерево сортируется по `OrderInTree`, затем по порядку появления.
- Дубли между источниками удаляются по `ID` или нормализованному `Connect`; внутри одного `.v8i` одинаковые подключения сохраняются.
- Через MCP неизвестные поля `.v8i` не публикуются.
- Все тесты используют модельную файловую систему; временные каталоги и файлы запрещены.
- Перед завершением выполняется `pnpm test` из корня.

---

## File Structure

- `packages/platform/src/infobases/types.ts` — публичные типы дерева, источников и предупреждений.
- `packages/platform/src/infobases/parseConnection.ts` — разбор `Connect` с кавычками.
- `packages/platform/src/infobases/parseV8i.ts` — разделы, поля, папки и базы одного файла.
- `packages/platform/src/infobases/sources.ts` — личный список и `CommonInfoBases`.
- `packages/platform/src/infobases/tree.ts` — межфайловое устранение дублей и дерево.
- `packages/platform/src/infobases/listInfobases.ts` — оркестрация и рабочая публичная функция.
- `packages/platform/index.ts` — экспорт `listInfobases` и публичных типов.
- `packages/mcp/src/contracts/listInfobases.ts` — Zod-схема результата.
- `packages/mcp/src/services/listInfobases.ts` — тонкая MCP-служба.
- `packages/mcp/src/tools/registerTools.ts` — регистрация инструмента.
- `packages/mcp/src/tools/registerTools.test.ts` — фиксация набора инструментов и описания.
- `packages/mcp/package.json`, `pnpm-lock.yaml`, `tsconfig.build.json` — workspace-зависимость и сборка.

### Task 1: Connection and `.v8i` parsing

**Files:**
- Create: `packages/platform/src/infobases/types.ts`
- Create: `packages/platform/src/infobases/parseConnection.ts`
- Create: `packages/platform/src/infobases/parseConnection.test.ts`
- Create: `packages/platform/src/infobases/parseV8i.ts`
- Create: `packages/platform/src/infobases/parseV8i.test.ts`

**Interfaces:**
- Produces:

```ts
export type InfobaseConnection =
  | { type: "file"; path: string }
  | { type: "server"; server: string; reference: string }
  | { type: "web"; url: string }
  | { type: "unknown"; raw: string }

export type InfobaseWarningCode =
  | "source-not-found"
  | "source-unreadable"
  | "invalid-config"
  | "invalid-section"
  | "implicit-folder"

export type InfobaseWarning = {
  code: InfobaseWarningCode
  source: string
  message: string
}

export type ParsedInfobaseRecord = {
  kind: "infobase"
  name: string
  id?: string
  folder: string
  orderInTree?: number
  connection: InfobaseConnection
  rawConnection: string
  version?: string
  defaultVersion?: string
  app?: string
  fields: Readonly<Record<string, string>>
  source: string
  sourceOrder: number
  recordOrder: number
}

export type ParsedFolderRecord = {
  kind: "folder"
  name: string
  folder: string
  orderInTree?: number
  fields: Readonly<Record<string, string>>
  source: string
  sourceOrder: number
  recordOrder: number
}

export type ParsedV8i = {
  records: Array<ParsedInfobaseRecord | ParsedFolderRecord>
  warnings: InfobaseWarning[]
}

export function parseConnection(raw: string): InfobaseConnection
export function parseV8i(text: string, source: string, sourceOrder: number): ParsedV8i
```

- [ ] **Step 1: Write failing connection parser tests**

Use exact cases:

```ts
expect(parseConnection('File="C:\\Data;Main=1";')).toEqual({
  type: "file",
  path: "C:\\Data;Main=1",
})
expect(parseConnection('Srvr="server:1541";Ref="ERP";')).toEqual({
  type: "server",
  server: "server:1541",
  reference: "ERP",
})
expect(parseConnection('ws="https://example.test/erp?a=1;b=2";')).toEqual({
  type: "web",
  url: "https://example.test/erp?a=1;b=2",
})
expect(parseConnection('Custom="value";')).toEqual({
  type: "unknown",
  raw: 'Custom="value";',
})
```

- [ ] **Step 2: Run the connection test and verify it fails**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/infobases/parseConnection.test.ts
```

Expected: FAIL because `parseConnection` is missing.

- [ ] **Step 3: Implement a quote-aware tokenizer**

Scan the string once, splitting on `;` and `=` only outside double quotes. Preserve unknown syntax as `unknown`; do not use the regular expressions from `parserV8i.os`.

- [ ] **Step 4: Write failing `.v8i` parser tests**

Use inline strings, never files:

```ts
const text = [
  "\uFEFF[FinData]",
  "ID=folder-id",
  "Folder=/",
  "OrderInTree=49152",
  "",
  "[Мои=учебные]",
  "ID=nested-folder",
  "Folder=/FinData",
  "OrderInTree=16384",
  "",
  "[ERP]",
  'Connect=Srvr="server";Ref="erp";',
  "ID=base-id",
  "Folder=/FinData/Мои=учебные",
  "OrderInTree=32768",
  "DefaultVersion=8.3.27.2074",
].join("\n")
```

Assert folder/base discrimination, BOM removal, split at the first `=`, numeric order, typed connection, raw connection and preservation of unknown fields. Add a malformed section followed by a valid section and assert one `invalid-section` warning plus the valid record.

- [ ] **Step 5: Run the parser test and verify it fails**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/infobases/parseV8i.test.ts
```

Expected: FAIL because `parseV8i` is missing.

- [ ] **Step 6: Implement section parsing**

Normalize CRLF/LF, remove one leading BOM, parse each section independently and default missing `Folder` to `/`. A section with non-empty `Connect` is a base; otherwise it is a folder. Store internal unknown fields, but keep them out of later MCP schemas.

- [ ] **Step 7: Run focused tests and type-check**

```bash
pnpm --filter @nkdk/platform exec vitest run src/infobases/parseConnection.test.ts src/infobases/parseV8i.test.ts
pnpm --filter @nkdk/platform type-check
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/platform/src/infobases
git commit -m "feat: :sparkles: разбирать списки баз 1С"
```

### Task 2: Infobase source discovery

**Files:**
- Create: `packages/platform/src/infobases/sources.ts`
- Create: `packages/platform/src/infobases/sources.test.ts`
- Modify: `packages/platform/src/startupConfig.ts`
- Modify: `packages/platform/src/startupConfig.test.ts`

**Interfaces:**
- Consumes: `PlatformRuntime`, `readStartupConfiguration`.
- Produces:

```ts
export type InfobaseSource = {
  path: string
  kind: "personal" | "common"
}

export type InfobaseSourceCandidate = InfobaseSource

export type InfobaseSourcesResult = {
  candidates: InfobaseSourceCandidate[]
  warnings: InfobaseWarning[]
}

export async function discoverInfobaseSources(
  runtime: PlatformRuntime,
): Promise<InfobaseSourcesResult>
```

- [ ] **Step 1: Write failing source discovery tests**

Model all paths in memory and assert:

- Windows personal path `%APPDATA%/1C/1CEStart/ibases.v8i`;
- Linux/macOS personal path `$HOME/.1C/1cestart/ibases.v8i`;
- repeated `CommonInfoBases` in user, all-users and common configs;
- a relative common-list path resolved from its declaring config;
- canonical duplicate `.v8i` read once;
- `WebCommonInfoBases` ignored;
- missing local configuration represented by `invalid-config` only when the
  path was explicitly declared through `CommonCfgLocation`;
- deterministic order: personal, user config commons, all-users config commons, common config commons.

Representative assertion:

```ts
expect(result.candidates).toEqual([
  { path: "/home/test/.1C/1cestart/ibases.v8i", kind: "personal" },
  { path: "/home/test/.1C/shared/team.v8i", kind: "common" },
])
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
pnpm --filter @nkdk/platform exec vitest run src/infobases/sources.test.ts
```

Expected: FAIL because `discoverInfobaseSources` is missing.

- [ ] **Step 3: Extend startup configuration provenance**

Ensure every config entry exposes its declaring `source` path and config kind. Preserve repeated `CommonInfoBases` in declaration order. Keep `InstalledLocation` priority unchanged for the first plan.

- [ ] **Step 4: Implement source discovery**

Construct the personal path first. Convert `CommonInfoBases` entries to paths relative to their declaring config, expand only current-OS environment syntax and remove lexically normalized duplicates. Do not read `.v8i` here: this function returns ordered candidates, and `listInfobasesWithRuntime` performs the single content read, canonical deduplication and warning conversion.

- [ ] **Step 5: Run focused verification**

```bash
pnpm --filter @nkdk/platform exec vitest run src/startupConfig.test.ts src/infobases/sources.test.ts
pnpm --filter @nkdk/platform type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/platform/src/startupConfig.ts packages/platform/src/startupConfig.test.ts packages/platform/src/infobases
git commit -m "feat: :sparkles: находить источники списка баз"
```

### Task 3: Cross-source merge and tree construction

**Files:**
- Create: `packages/platform/src/infobases/tree.ts`
- Create: `packages/platform/src/infobases/tree.test.ts`

**Interfaces:**
- Consumes: arrays of `ParsedInfobaseRecord | ParsedFolderRecord`.
- Produces:

```ts
export type InfobaseFolderNode = {
  kind: "folder"
  name: string
  children: InfobaseTreeNode[]
  source: string
}

export type InfobaseNode = {
  kind: "infobase"
  name: string
  id?: string
  connection: InfobaseConnection
  rawConnection: string
  version?: string
  defaultVersion?: string
  app?: string
  source: string
}

export type InfobaseTreeNode = InfobaseFolderNode | InfobaseNode

export type BuildInfobaseTreeResult = {
  tree: InfobaseTreeNode[]
  warnings: InfobaseWarning[]
}

export function buildInfobaseTree(
  recordsBySource: ReadonlyArray<ReadonlyArray<ParsedInfobaseRecord | ParsedFolderRecord>>,
  options: { os: PlatformOs },
): BuildInfobaseTreeResult
```

- [ ] **Step 1: Write failing tree tests**

Test these independent cases with record objects:

- nested explicit folders and an explicit empty folder;
- missing intermediate `/Department/ERP` folder created with `implicit-folder`;
- sibling ordering by `OrderInTree`, then `sourceOrder`, then `recordOrder`;
- same `ID` in personal and common source keeps personal;
- same normalized server `Connect` in different sources keeps first;
- same `Connect` twice in one source preserves both nodes;
- same folder path from multiple sources merges children and keeps first source.

Use a compact expected tree:

```ts
expect(result.tree).toEqual([
  {
    kind: "folder",
    name: "Department",
    source: "personal.v8i",
    children: [
      expect.objectContaining({ kind: "infobase", name: "ERP" }),
      expect.objectContaining({ kind: "folder", name: "Empty", children: [] }),
    ],
  },
])
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
pnpm --filter @nkdk/platform exec vitest run src/infobases/tree.test.ts
```

Expected: FAIL because `buildInfobaseTree` is missing.

- [ ] **Step 3: Implement cross-source deduplication**

Накапливайте встреченные `ID` и нормализованные подключения только после
завершения очередного источника. Сравнивайте Windows-пути без учёта регистра,
но сохраняйте регистр путей Linux/macOS и содержимого URL на всех ОС. Имена
ключей подключения нормализуются при разборе. Не удаляйте повторные записи с
одинаковым `sourceOrder`.

- [ ] **Step 4: Implement folder graph and stable sorting**

Normalize `/`-separated folder paths, create missing ancestors, merge explicit folder records into implicit nodes, then sort each `children` array using:

```ts
const key = [
  record.orderInTree ?? Number.POSITIVE_INFINITY,
  record.sourceOrder,
  record.recordOrder,
]
```

Emit one `implicit-folder` warning per created path.

- [ ] **Step 5: Run focused verification**

```bash
pnpm --filter @nkdk/platform exec vitest run src/infobases/tree.test.ts
pnpm --filter @nkdk/platform type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/platform/src/infobases/tree.ts packages/platform/src/infobases/tree.test.ts
git commit -m "feat: :sparkles: строить дерево информационных баз"
```

### Task 4: Public `listInfobases` orchestration

**Files:**
- Create: `packages/platform/src/infobases/listInfobases.ts`
- Create: `packages/platform/src/infobases/listInfobases.test.ts`
- Modify: `packages/platform/index.ts`

**Interfaces:**
- Consumes: `discoverInfobaseSources`, `parseV8i`, `buildInfobaseTree`, `nodePlatformRuntime`.
- Produces:

```ts
export type InfobaseTreeResult = {
  tree: InfobaseTreeNode[]
  sources: InfobaseSource[]
  warnings: InfobaseWarning[]
}

export async function listInfobases(): Promise<InfobaseTreeResult>

// Internal test seam:
export async function listInfobasesWithRuntime(
  runtime: PlatformRuntime,
): Promise<InfobaseTreeResult>
```

- [ ] **Step 1: Write failing orchestration tests**

Create a memory runtime containing personal and common `.v8i` text. Assert the combined tree, successful source order and warnings from source discovery, parsing and implicit folders. Add a case where every source fails:

```ts
expect(await listInfobasesWithRuntime(runtimeWithNoSources())).toEqual({
  tree: [],
  sources: [],
  warnings: expect.arrayContaining([
    expect.objectContaining({ code: "source-not-found" }),
  ]),
})
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
pnpm --filter @nkdk/platform exec vitest run src/infobases/listInfobases.test.ts
```

Expected: FAIL because orchestration is missing.

- [ ] **Step 3: Implement orchestration**

For each candidate, resolve `realpath`, skip a canonical duplicate, read text exactly once, call `parseV8i(text, source.path, sourceOrder)`, and collect records and warnings. Convert `ENOENT` to `source-not-found` and other expected read failures to `source-unreadable`. Pass `{ os: runtime.environment.os }` to `buildInfobaseTree`. Preserve only successfully read sources in the result; do not catch programming-contract errors.

- [ ] **Step 4: Export the public API**

Add to `packages/platform/index.ts`:

```ts
export {
  listInfobases,
  type InfobaseConnection,
  type InfobaseFolderNode,
  type InfobaseNode,
  type InfobaseSource,
  type InfobaseTreeNode,
  type InfobaseTreeResult,
  type InfobaseWarning,
  type InfobaseWarningCode,
} from "./src/infobases/listInfobases"
```

Re-export types from `listInfobases.ts` so consumers use one stable module boundary.

- [ ] **Step 5: Run all platform tests**

```bash
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/platform type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/platform
git commit -m "feat: :sparkles: возвращать дерево баз 1С"
```

### Task 5: MCP contract and service

**Files:**
- Create: `packages/mcp/src/contracts/listInfobases.ts`
- Create: `packages/mcp/src/contracts/listInfobases.test.ts`
- Create: `packages/mcp/src/services/listInfobases.ts`
- Create: `packages/mcp/src/services/listInfobases.test.ts`
- Modify: `packages/mcp/package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `listInfobases(): Promise<InfobaseTreeResult>` from `@nkdk/platform`.
- Produces:

```ts
export type ListInfobasesSuccess = InfobaseTreeResult & Record<string, unknown>
export type ListInfobasesPayload = ToolSuccess<ListInfobasesSuccess>

export async function listInfobasesService(deps?: {
  listInfobases: () => Promise<InfobaseTreeResult>
}): Promise<ListInfobasesPayload | ToolFailure>
```

- [ ] **Step 1: Write the failing recursive contract test**

Define recursive Zod schemas for folder/base nodes and a no-fields input shape:

```ts
export const listInfobasesInputShape = {}

export const listInfobasesOutputShape = z.union([
  z.object({
    ok: z.literal(true),
    tree: z.array(infobaseTreeNodeSchema),
    sources: z.array(infobaseSourceSchema),
    warnings: z.array(infobaseWarningSchema),
  }),
  z.object(toolErrorOutputShape),
])
```

Test file, server and unknown connections, a nested folder, structured warnings and rejection of an extra internal `fields` property using strict object schemas.

- [ ] **Step 2: Run the contract test and verify it fails**

```bash
pnpm --filter @nkdk/mcp exec vitest run src/contracts/listInfobases.test.ts
```

Expected: FAIL because the contract is missing.

- [ ] **Step 3: Implement the Zod contract**

Use `z.lazy` for `children`. Keep the public warning codes as an exact `z.enum`. Do not include internal parser fields or order fields.

- [ ] **Step 4: Write the failing service test**

Inject a `vi.fn()` result and assert `toolSuccess`:

```ts
const platformResult = {
  tree: [],
  sources: [{ path: "/home/test/.1C/1cestart/ibases.v8i", kind: "personal" as const }],
  warnings: [],
}
const listInfobases = vi.fn(async () => platformResult)

await expect(listInfobasesService({ listInfobases })).resolves.toEqual({
  ok: true,
  ...platformResult,
})
```

Also assert an unexpected package error becomes `{ ok: false, code: "core_error", message }` to stay compatible with the existing MCP error vocabulary.

- [ ] **Step 5: Run the service test and verify it fails**

```bash
pnpm --filter @nkdk/mcp exec vitest run src/services/listInfobases.test.ts
```

Expected: FAIL because the service is missing.

- [ ] **Step 6: Implement the thin service**

Import the package function as an alias:

```ts
import { listInfobases as listPlatformInfobases } from "@nkdk/platform"

export async function listInfobasesService(
  deps = { listInfobases: listPlatformInfobases },
): Promise<ListInfobasesPayload | ToolFailure> {
  try {
    return toolSuccess(await deps.listInfobases())
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
```

- [ ] **Step 7: Add the build-only workspace dependency**

Add to `packages/mcp/package.json`:

```json
"devDependencies": {
  "@nkdk/core": "workspace:*",
  "@nkdk/platform": "workspace:*"
}
```

Run:

```bash
pnpm install
```

Expected: lockfile links `packages/mcp` to `packages/platform`.

- [ ] **Step 8: Run focused verification**

```bash
pnpm --filter @nkdk/mcp exec vitest run src/contracts/listInfobases.test.ts src/services/listInfobases.test.ts
pnpm --filter @nkdk/mcp type-check
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/mcp/src/contracts/listInfobases.ts packages/mcp/src/contracts/listInfobases.test.ts packages/mcp/src/services/listInfobases.ts packages/mcp/src/services/listInfobases.test.ts packages/mcp/package.json pnpm-lock.yaml
git commit -m "feat: :sparkles: добавить MCP-контракт списка баз"
```

### Task 6: MCP registration and protocol verification

**Files:**
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
- Modify: `packages/mcp/src/server.test.ts`

**Interfaces:**
- Consumes: `listInfobasesInputShape`, `listInfobasesService`.
- Produces: registered read-only tool `nkdk.list_infobases`.

- [ ] **Step 1: Extend the failing registration test**

Insert the tool in the expected list after base inspection tools:

```ts
expect(calls.tools).toEqual([
  "nkdk.get_schema",
  "nkdk.describe_project_structure",
  "nkdk.list_infobases",
  "nkdk.validate_project",
  "nkdk.import_from_xml",
  "nkdk.sync_to_xml",
  "nkdk.init_sync_state",
  "nkdk.rename_item",
  "nkdk.find_references",
])
```

Assert its description contains `личный и общие списки`, `дерево` and `не изменяет файлы`.

- [ ] **Step 2: Run the registration test and verify it fails**

```bash
pnpm --filter @nkdk/mcp exec vitest run src/tools/registerTools.test.ts
```

Expected: FAIL because the tool is not registered.

- [ ] **Step 3: Register the tool**

Add:

```ts
server.registerTool(
  "nkdk.list_infobases",
  {
    title: "List 1C infobases",
    description:
      "Возвращает дерево баз из личного и общих списков 1С вместе с источниками и предупреждениями. Не изменяет файлы.",
    inputSchema: listInfobasesInputShape,
  },
  async () => jsonToolResult(await listInfobasesService()),
)
```

- [ ] **Step 4: Add an MCP protocol test**

Mock `@nkdk/platform` before importing the server, call the new tool through `InMemoryTransport`, and assert:

```ts
const result = await client.callTool({
  name: "nkdk.list_infobases",
  arguments: {},
})

expect(result.isError).not.toBe(true)
expect(result.structuredContent).toEqual({
  ok: true,
  tree: [],
  sources: [],
  warnings: [],
})
```

Keep the existing protocol test unchanged.

- [ ] **Step 5: Run MCP tests**

```bash
pnpm --filter @nkdk/mcp test
pnpm --filter @nkdk/mcp type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/mcp/src/tools/registerTools.ts packages/mcp/src/tools/registerTools.test.ts packages/mcp/src/server.test.ts
git commit -m "feat: :sparkles: опубликовать список баз через MCP"
```

### Task 7: Full verification

**Files:**
- Modify only files required by failures directly caused by this plan.

**Interfaces:**
- Produces complete `listInfobases` package API and `nkdk.list_infobases` MCP tool.

- [ ] **Step 1: Run all package tests**

```bash
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/mcp test
```

Expected: PASS.

- [ ] **Step 2: Run the complete repository tests**

```bash
pnpm test
```

Expected: every package passes.

- [ ] **Step 3: Verify types and publish build**

```bash
pnpm type-check
pnpm --filter @nkdk/mcp build
pnpm --filter @nkdk/mcp smoke:packed
```

Expected: all commands PASS and the bundled MCP resolves `@nkdk/platform` without a runtime workspace dependency.

- [ ] **Step 4: Commit only necessary verification fixes**

If verification exposed an integration defect, stage only the correction and use:

```bash
git commit -m "fix: :bug: исправить сборку списка баз в MCP"
```

If no correction was needed, do not create an empty commit.
