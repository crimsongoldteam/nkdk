# Fast Sync State Hash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `nkdk init-sync-state <yaml-dir> <xml-dir>` build `.nkdk-sync.yaml` directly from the existing YAML project using fast `xxh3-64` file fingerprints.

**Architecture:** Keep the sync-state boundary in `packages/core/metadata/appliedObjects/configuration/syncState.ts`. `initializeXmlSyncState` becomes a small state writer over `yamlDir`; `hashProjectFiles` remains shared by initialization and incremental XML sync, but switches from `sha256` to `xxh3-64`. CLI and MCP already pass `yamlDir`, so they should mostly need test alignment.

**Tech Stack:** TypeScript, Vitest, Node fs APIs, `yaml`, `@node-rs/xxhash`, pnpm workspaces.

---

## File Structure

- Modify `packages/core/package.json`: add `@node-rs/xxhash` dependency.
- Modify `packages/core/metadata/appliedObjects/configuration/syncState.ts`: remove hidden XML import, add `yamlDir` to params, switch file hashes to `xxh3-64`.
- Modify `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`: update tests for direct YAML indexing and new hash format.
- Modify `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`: replace stale `sha256:` fixture values with valid `xxh3-64:` values.
- Review `packages/cli/src/commands/initSyncState.ts` and `packages/cli/src/commands/initSyncState.test.ts`: ensure CLI still forwards `yamlDir` and `xmlDir`.
- Review `packages/mcp/src/coreApi.ts`, `packages/mcp/src/services/initSyncState.ts`, and `packages/mcp/src/services/initSyncState.test.ts`: ensure MCP contract still matches core.
- Update `pnpm-lock.yaml` through `pnpm install` after adding the dependency.

## Task 1: Add Failing Core Tests For The New Contract

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`

- [ ] **Step 1: Update imports in `syncState.test.ts`**

Remove the unused `ConfigurationContextFromXML` type import after the old import-based test is replaced:

```ts
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import {
  diffSyncState,
  hashProjectFiles,
  initializeXmlSyncState,
  readXmlSyncState,
  SYNC_STATE_FILE,
  writeXmlSyncState,
} from "./syncState"
```

- [ ] **Step 2: Replace the state read/write test with `xxh3-64` expectations**

Replace `it("writes and reads flat sha256 state", ...)` with:

```ts
  it("writes and reads flat xxh3-64 state", async () => {
    const xmlDir = tempDir()

    await writeXmlSyncState(xmlDir, {
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000aaa",
        "Справочник/Товары/Модуль.bsl": "xxh3-64:0000000000000bbb",
      },
    })

    expect(readFileSync(join(xmlDir, SYNC_STATE_FILE), "utf-8")).toContain("version: 1")
    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000aaa",
        "Справочник/Товары/Модуль.bsl": "xxh3-64:0000000000000bbb",
      },
    })
  })
```

- [ ] **Step 3: Add a test that rejects old `sha256` state**

Add after the read/write test:

```ts
  it("rejects old sha256 state", async () => {
    const xmlDir = tempDir()
    writeFileSync(
      join(xmlDir, SYNC_STATE_FILE),
      "version: 1\nfiles:\n  a.yaml: sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n",
      "utf-8",
    )

    await expect(readXmlSyncState(xmlDir)).rejects.toThrow(`Некорректный ${SYNC_STATE_FILE}`)
  })
```

- [ ] **Step 4: Update raw-byte hashing expectations**

In `it("hashes raw file bytes and ignores directories", ...)`, replace the two expectations:

```ts
    expect(hashes["Справочник/Товары/Свойства.yaml"]).toMatch(/^xxh3-64:[0-9a-f]{16}$/)
    expect(hashes["Справочник/Товары/Модуль.bsl"]).toMatch(/^xxh3-64:[0-9a-f]{16}$/)
```

- [ ] **Step 5: Update diff test values to the new prefix**

Replace the `diffSyncState` inputs with:

```ts
        {
          "a.yaml": "xxh3-64:0000000000000001",
          "deleted.yaml": "xxh3-64:0000000000000002",
          "same.yaml": "xxh3-64:0000000000000003",
        },
        {
          "a.yaml": "xxh3-64:0000000000000004",
          "added.yaml": "xxh3-64:0000000000000005",
          "same.yaml": "xxh3-64:0000000000000003",
        },
```

- [ ] **Step 6: Replace the hidden-import initialization test**

Replace `it("initializes state from XML by importing to a temporary YAML directory", ...)` with:

```ts
  it("initializes state from an existing YAML directory", async () => {
    const xmlDir = tempDir()
    const yamlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "Наименование: Товары\n", "utf-8")

    await initializeXmlSyncState({ yamlDir, xmlDir })

    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": expect.stringMatching(/^xxh3-64:[0-9a-f]{16}$/),
      },
    })
  })
```

- [ ] **Step 7: Run the focused core test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/appliedObjects/configuration/syncState.test.ts
```

Expected: FAIL. Acceptable failures include `sha256` still being produced, `initializeXmlSyncState` requiring old XML/import params, or missing `@node-rs/xxhash`.

## Task 2: Implement Direct YAML State Initialization And XXH3

**Files:**
- Modify: `packages/core/package.json`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.ts`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Add dependency**

Run:

```bash
pnpm install
```

Before running it, add the dependency to `packages/core/package.json` under `dependencies`:

```json
"@node-rs/xxhash": "^1.7.6"
```

Expected: `pnpm-lock.yaml` updates and `packages/core/package.json` remains valid JSON.

- [ ] **Step 2: Replace sync-state imports**

In `syncState.ts`, replace:

```ts
import { createHash } from "crypto"
import fs from "fs"
import { mkdtemp } from "fs/promises"
import { tmpdir } from "os"
import { join, relative, resolve, sep } from "path"
import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import YAML from "yaml"
import { syncConfigurationFromXML } from "./convertFromXML"
```

with:

```ts
import fs from "fs"
import { join, relative, resolve, sep } from "path"
import { xxh3 } from "@node-rs/xxhash"
import YAML from "yaml"
```

- [ ] **Step 3: Simplify `InitializeXmlSyncStateParams`**

Replace the interface with:

```ts
export interface InitializeXmlSyncStateParams {
  yamlDir: string
  xmlDir: string
}
```

- [ ] **Step 4: Rewrite initialization to use `yamlDir` directly**

Replace `initializeXmlSyncState` with:

```ts
export async function initializeXmlSyncState(params: InitializeXmlSyncStateParams): Promise<XmlSyncState> {
  const files = await hashProjectFiles(params.yamlDir)
  const state: XmlSyncState = { version: 1, files }
  await writeXmlSyncState(params.xmlDir, state)
  return state
}
```

- [ ] **Step 5: Switch file hashing to XXH3-64**

In `collectProjectFileHashes`, replace:

```ts
    result[relPath] = `sha256:${createHash("sha256").update(await fs.promises.readFile(absPath)).digest("hex")}`
```

with:

```ts
    const hash = xxh3.xxh64(await fs.promises.readFile(absPath))
    result[relPath] = `xxh3-64:${hash.toString(16).padStart(16, "0")}`
```

- [ ] **Step 6: Tighten state validation to XXH3-64**

Replace:

```ts
  return Object.values(record.files).every((hash) => typeof hash === "string" && /^sha256:[0-9a-f]+$/.test(hash))
```

with:

```ts
  return Object.values(record.files).every((hash) => typeof hash === "string" && /^xxh3-64:[0-9a-f]{16}$/.test(hash))
```

- [ ] **Step 7: Run the focused core test**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/appliedObjects/configuration/syncState.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit core sync-state implementation**

Run:

```bash
git add packages/core/package.json pnpm-lock.yaml packages/core/metadata/appliedObjects/configuration/syncState.ts packages/core/metadata/appliedObjects/configuration/syncState.test.ts
git commit -m "perf: :zap: ускорить построение sync state"
```

Expected: commit succeeds.

## Task 3: Update Incremental Sync Tests For The New State Format

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`

- [ ] **Step 1: Replace stale manual state values**

In `incrementalSyncToXML.test.ts`, replace any manual `sha256:` test values with valid `xxh3-64:` strings. For the currently known block, use:

```ts
    await writeXmlSyncState(xmlDir, {
      version: 1,
      files: {
        "Справочник/Товары/МодульОбъекта.bsl": "xxh3-64:0000000000000000",
      },
    })
```

- [ ] **Step 2: Search for remaining production-test `sha256:` references**

Run:

```bash
rg "sha256:" packages/core packages/cli packages/mcp
```

Expected: no output, except if a test intentionally asserts that old `sha256:` is rejected in `syncState.test.ts`.

- [ ] **Step 3: Run incremental sync tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit test alignment**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
git commit -m "test: :white_check_mark: обновить формат sync state"
```

Expected: commit succeeds.

## Task 4: Verify CLI And MCP Boundaries

**Files:**
- Review: `packages/cli/src/commands/initSyncState.ts`
- Review: `packages/cli/src/commands/initSyncState.test.ts`
- Review: `packages/mcp/src/coreApi.ts`
- Review: `packages/mcp/src/services/initSyncState.ts`
- Review: `packages/mcp/src/services/initSyncState.test.ts`

- [ ] **Step 1: Confirm CLI passes direct paths**

`packages/cli/src/commands/initSyncState.ts` should still call core like this:

```ts
  await initializeXmlSyncState({
    yamlDir,
    xmlDir,
    context: {
      defaultLanguage: "ru",
      version: "2.20",
      exportToYAML: { toTyped: false },
      fromXML: { forReference: false },
    },
  })
```

If TypeScript complains because `context` was removed from `InitializeXmlSyncStateParams`, change it to:

```ts
  await initializeXmlSyncState({ yamlDir, xmlDir })
```

Keep the success output:

```ts
  process.stdout.write("Файл .nkdk-sync.yaml обновлён\n")
```

- [ ] **Step 2: Confirm MCP service matches core**

If TypeScript complains in `packages/mcp/src/services/initSyncState.ts`, simplify the dependency interface to:

```ts
interface InitSyncStateDeps {
  initializeXmlSyncState: (params: { yamlDir: string; xmlDir: string }) => Promise<void>
}
```

and simplify the call to:

```ts
    await core.initializeXmlSyncState({
      yamlDir: input.yamlDir,
      xmlDir: input.xmlDir,
    })
```

- [ ] **Step 3: Confirm MCP core API matches core**

If TypeScript complains in `packages/mcp/src/coreApi.ts`, simplify the signature to:

```ts
  initializeXmlSyncState(params: {
    yamlDir: string
    xmlDir: string
  }): Promise<void>
```

- [ ] **Step 4: Run CLI and MCP focused tests**

Run:

```bash
pnpm --filter @nakidka/cli test -- initSyncState.test.ts
pnpm --filter @nakidka/mcp test -- initSyncState.test.ts
```

Expected: both PASS.

- [ ] **Step 5: Commit boundary cleanup if files changed**

If CLI or MCP files changed, run:

```bash
git add packages/cli/src/commands/initSyncState.ts packages/cli/src/commands/initSyncState.test.ts packages/mcp/src/coreApi.ts packages/mcp/src/services/initSyncState.ts packages/mcp/src/services/initSyncState.test.ts
git commit -m "refactor: :recycle: упростить договор sync state"
```

Expected: commit succeeds if there are changes. If there are no changes, skip the commit.

## Task 5: End-To-End Verification And ERP Timing Check

**Files:**
- No code changes expected.
- External output: `/Users/nikita/git/round-trip/erp/.nkdk-sync.yaml`

- [ ] **Step 1: Run type checks for touched packages**

Run:

```bash
pnpm --filter @nakidka/core type-check
pnpm --filter @nakidka/cli build
pnpm --filter @nakidka/mcp type-check
```

Expected: all commands PASS.

- [ ] **Step 2: Run focused package tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/appliedObjects/configuration/syncState.test.ts metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
pnpm --filter @nakidka/cli test -- initSyncState.test.ts
pnpm --filter @nakidka/mcp test -- initSyncState.test.ts
```

Expected: all commands PASS.

- [ ] **Step 3: Rebuild the ERP sync state with timing**

Run:

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli dev -- init-sync-state /Users/nikita/git/nkdk-yaml /Users/nikita/git/round-trip/erp
```

Expected:

```text
Файл .nkdk-sync.yaml обновлён
real <number>
user <number>
sys <number>
```

- [ ] **Step 4: Verify the generated state format**

Run:

```bash
sed -n '1,8p' /Users/nikita/git/round-trip/erp/.nkdk-sync.yaml
rg "sha256:" /Users/nikita/git/round-trip/erp/.nkdk-sync.yaml
rg "xxh3-64:" /Users/nikita/git/round-trip/erp/.nkdk-sync.yaml | head
```

Expected: first command shows `version: 1` and `files:`; second command has no output; third command shows `xxh3-64:` entries.

- [ ] **Step 5: Run full project tests before closing**

Run from repo root:

```bash
pnpm test
```

Expected: PASS across packages.

- [ ] **Step 6: Report final result**

Include:

- commits created;
- measured ERP `init-sync-state` timing;
- confirmation that `.nkdk-sync.yaml` uses `xxh3-64:`;
- whether `pnpm test` passed.
