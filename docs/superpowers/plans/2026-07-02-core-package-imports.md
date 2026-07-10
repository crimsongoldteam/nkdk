# Core Package Imports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать runtime-зависимость от alias `~` и оставить `@nakidka/core` единственной внешней точкой входа core API.

**Architecture:** Внешние пакеты продолжают импортировать core только через публичный `@nakidka/core`. Внутри `packages/core` все `~/*` импорты заменяются на относительные пути, а tsconfig/vitest alias удаляются после зелёных проверок. Защита от возврата alias живёт в тестах core и отдельном прямом `tsx` smoke-тесте worker-а.

**Tech Stack:** TypeScript ESM, Node worker_threads, tsx, Vitest, pnpm workspace.

---

## File Structure

- Modify: `packages/core/metadata/importBoundaries.test.ts`
  - Убрать тестовые строки с `~/...`.
  - Добавить workspace-гвард, который запрещает `~/...` в `packages/core`, `packages/cli`, `packages/mcp`, tsconfig и vitest config.
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`
  - Добавить smoke-тест прямого запуска через `node --import tsx -e`, который стартует validation worker без Vite alias.
- Modify: `packages/core/**/*.ts`
  - Заменить `~/*` на относительные импорты.
- Modify: `packages/core/tsconfig.json`
  - Удалить `compilerOptions.paths`.
- Modify: `packages/cli/tsconfig.json`
  - Удалить `~/*`, оставить `@nakidka/core`.
- Modify: `packages/mcp/tsconfig.json`
  - Удалить `compilerOptions.paths`, так как пакет не должен видеть внутренности core.
- Modify: `packages/core/vitest.config.ts`, `packages/cli/vitest.config.ts`, `packages/mcp/vitest.config.ts`
  - Удалить `test.alias["~"]`; в core оставить `resolve` для `setupFiles`, в cli/mcp удалить импорт `resolve`.
- Create temporarily outside repo: `/private/tmp/nkdk-rewrite-core-tilde-imports.mjs`
  - Одноразовый преобразователь `~/*` в относительные импорты внутри `packages/core`.

## Task 1: Add Failing Alias Guards

**Files:**
- Modify: `packages/core/metadata/importBoundaries.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

- [ ] **Step 1: Add workspace alias guard**

In `packages/core/metadata/importBoundaries.test.ts`, replace the forbidden import constants at the top so they no longer contain `~`:

```ts
const FORBIDDEN_COMMON_OBJECT_IMPORTS = ["../forms/elements/"] as const
const FORBIDDEN_ORCHESTRATION_APPLIED_OBJECT_IMPORTS = ["../../appliedObjects/configuration/"] as const
const FORBIDDEN_FORM_ELEMENT_FACTORY_IMPORTS = ["../formElement/factory", "./formElement/factory"] as const
const FORBIDDEN_FORM_ELEMENT_LOCAL_FACTORY_IMPORTS = ["./factory"] as const
const FORBIDDEN_ORCHESTRATION_FORM_MODEL_IMPORTS = ["../forms/elements/baseElement/types"] as const
const FORBIDDEN_PROJECT_CONCRETE_METADATA_IMPORTS = [
  "../appliedObjects/",
  "../commonObjects/",
  "../forms/",
] as const
const BROAD_METADATA_REGISTRATION_IMPORTS = [
  "../appliedObjects",
  "../commonObjects",
  "../forms",
] as const
```

Still in `packages/core/metadata/importBoundaries.test.ts`, add these constants after `PROJECT_DIR`:

```ts
const WORKSPACE_ROOT = join(process.cwd(), "..", "..")
const PACKAGES_FOR_ALIAS_SCAN = ["packages/core", "packages/cli", "packages/mcp"] as const
const CONFIG_FILES_FOR_ALIAS_SCAN = [
  "packages/core/tsconfig.json",
  "packages/cli/tsconfig.json",
  "packages/mcp/tsconfig.json",
  "packages/core/vitest.config.ts",
  "packages/cli/vitest.config.ts",
  "packages/mcp/vitest.config.ts",
] as const
```

Add this test as the first test inside `describe("metadata import boundaries", () => {`:

```ts
  it("workspace TypeScript and test configs do not use legacy ~ alias", () => {
    const importOffenders = PACKAGES_FOR_ALIAS_SCAN.flatMap((packagePath) =>
      listTypeScriptFiles(join(WORKSPACE_ROOT, packagePath), { includeTests: true })
        .map((filePath) => ({
          filePath: relative(WORKSPACE_ROOT, filePath),
          specifiers: extractModuleSpecifiers(readFileSync(filePath, "utf-8")).filter(
            (specifier) => specifier === "~" || specifier.startsWith("~/")
          ),
        }))
        .filter(({ specifiers }) => specifiers.length > 0)
    )

    const configOffenders = CONFIG_FILES_FOR_ALIAS_SCAN.map((filePath) => {
      const source = readFileSync(join(WORKSPACE_ROOT, filePath), "utf-8")
      return {
        filePath,
        hasAlias: /["']~(?:\/\*)?["']/.test(source),
      }
    }).filter(({ hasAlias }) => hasAlias)

    expect({ importOffenders, configOffenders }).toEqual({
      importOffenders: [],
      configOffenders: [],
    })
  })
```

- [ ] **Step 2: Update boundary helper examples**

In the existing test `старые boundary-правила поддерживают prefix imports, а broad-регистрации остаются exact`, replace the two example imports:

```ts
    expect(
      findForbiddenImports('import { Button } from "../forms/elements/button"', ["../forms/elements/"])
    ).toEqual(["../forms/elements/"])

    expect(
      findForbiddenModuleSpecifiers('import { Button } from "../forms/elements/button"', ["../forms"])
    ).toEqual([])
```

- [ ] **Step 3: Add direct tsx worker smoke test**

In `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`, replace the file with:

```ts
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"
import { createProjectValidationWorkerPool } from "./projectValidationWorkerPool"

const execFileAsync = promisify(execFile)

describe("ProjectValidationWorkerPool", () => {
  it("starts and stops worker threads", async () => {
    const pool = createProjectValidationWorkerPool({ concurrency: 2 })

    await pool.start()
    await pool.close()

    expect(pool.size()).toBe(2)
  })

  it("starts from plain tsx without legacy path aliases", async () => {
    const script = [
      'const { createProjectValidationWorkerPool } = await import("./metadata/validation/projectValidationWorkerPool.ts")',
      "const pool = createProjectValidationWorkerPool({ concurrency: 1 })",
      "await pool.start()",
      "console.log(`worker-size=${pool.size()}`)",
      "await pool.close()",
    ].join(";")

    const { stdout } = await execFileAsync(process.execPath, ["--import", "tsx", "-e", script], {
      cwd: process.cwd(),
      env: { ...process.env, NODE_OPTIONS: "" },
    })

    expect(stdout.trim()).toBe("worker-size=1")
  })
})
```

- [ ] **Step 4: Run focused tests and confirm they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: FAIL. `workspace TypeScript and test configs do not use legacy ~ alias` must report existing `~` imports/configs, or the plain `tsx` worker smoke test must fail while `~` still exists.

## Task 2: Rewrite Core `~/*` Imports to Relative Imports

**Files:**
- Create temporarily: `/private/tmp/nkdk-rewrite-core-tilde-imports.mjs`
- Modify: many `packages/core/**/*.ts`

- [ ] **Step 1: Create the one-off rewrite script**

Create `/private/tmp/nkdk-rewrite-core-tilde-imports.mjs` with:

```js
import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join, relative, sep } from "node:path"

const workspaceRoot = process.cwd()
const coreRoot = join(workspaceRoot, "packages", "core")

function listCoreFilesWithTildeImports() {
  const output = execFileSync(
    "rg",
    ["-l", '["\\']~/', "packages/core", "--glob", "*.ts"],
    { cwd: workspaceRoot, encoding: "utf-8" }
  ).trim()

  return output === "" ? [] : output.split("\n").map((filePath) => join(workspaceRoot, filePath))
}

function toPosixPath(path) {
  return path.split(sep).join("/")
}

function resolveCoreAlias(fromFile, specifier) {
  if (!specifier.startsWith("~/")) return specifier

  const target = join(coreRoot, specifier.slice(2))
  let nextSpecifier = toPosixPath(relative(dirname(fromFile), target))
  if (!nextSpecifier.startsWith(".")) nextSpecifier = `./${nextSpecifier}`
  return nextSpecifier
}

function rewriteSource(filePath, source) {
  return source.replace(/(["'])~\/([^"']+)\1/g, (match, quote, rest) => {
    const nextSpecifier = resolveCoreAlias(filePath, `~/${rest}`)
    return `${quote}${nextSpecifier}${quote}`
  })
}

for (const filePath of listCoreFilesWithTildeImports()) {
  const before = readFileSync(filePath, "utf-8")
  const after = rewriteSource(filePath, before)
  if (after !== before) writeFileSync(filePath, after)
}
```

- [ ] **Step 2: Run the rewrite**

Run:

```bash
node /private/tmp/nkdk-rewrite-core-tilde-imports.mjs
```

Expected: command exits with code 0.

- [ ] **Step 3: Format changed TypeScript files**

Run:

```bash
pnpm exec prettier --write "packages/core/**/*.ts"
```

Expected: command exits with code 0.

- [ ] **Step 4: Verify no core import specifier still uses `~`**

Run:

```bash
rg -n 'from "~/|export .* from "~/|import\("~/|import "~/' packages/core -g '*.ts'
```

Expected: no matches.

- [ ] **Step 5: Run focused core checks**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: FAIL only because tsconfig/vitest configs still contain `~`, or PASS if config removal has already happened in the same working tree.

## Task 3: Remove `~` From TypeScript and Vitest Configuration

**Files:**
- Modify: `packages/core/tsconfig.json`
- Modify: `packages/cli/tsconfig.json`
- Modify: `packages/mcp/tsconfig.json`
- Modify: `packages/core/vitest.config.ts`
- Modify: `packages/cli/vitest.config.ts`
- Modify: `packages/mcp/vitest.config.ts`

- [ ] **Step 1: Update core tsconfig**

In `packages/core/tsconfig.json`, remove the `paths` property and keep:

```json
    "strictNullChecks": true,
    "plugins": []
```

- [ ] **Step 2: Update CLI tsconfig**

In `packages/cli/tsconfig.json`, replace `compilerOptions.paths` with:

```json
    "paths": {
      "@nakidka/core": ["../core/index.ts"]
    },
```

- [ ] **Step 3: Update MCP tsconfig**

In `packages/mcp/tsconfig.json`, remove the whole `paths` property. The surrounding block should contain:

```json
    "sourceMap": true,
    "typeRoots": ["./node_modules/@types", "../node_modules/@types"],
    "allowImportingTsExtensions": true,
```

- [ ] **Step 4: Update core Vitest config**

In `packages/core/vitest.config.ts`, keep the existing path import and delete only the `alias` block:

```ts
import { dirname, resolve } from "path"
```

The `test` block must end as:

```ts
  test: {
    environment: "node",
    globals: true,
    watch: false,
    setupFiles: [resolve(__dirname, "./tests/setupTests")],
  },
```

- [ ] **Step 5: Update CLI Vitest config**

Replace `packages/cli/vitest.config.ts` with:

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  esbuild: {
    target: "es2020",
  },
  test: {
    environment: "node",
    globals: true,
    watch: false,
  },
})
```

- [ ] **Step 6: Update MCP Vitest config**

Replace `packages/mcp/vitest.config.ts` with:

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  esbuild: {
    target: "es2020",
  },
  test: {
    environment: "node",
    globals: true,
    testTimeout: 10_000,
    watch: false,
  },
})
```

- [ ] **Step 7: Run alias guard**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts
```

Expected: PASS.

## Task 4: Verify External Packages Use Only Public Core API

**Files:**
- Inspect: `packages/core/index.ts`
- Inspect: `packages/cli/src/**/*.ts`
- Inspect: `packages/mcp/src/**/*.ts`

- [ ] **Step 1: Check external packages for legacy core alias**

Run:

```bash
rg -n 'from "~/|export .* from "~/|import\("~/|import "~/' packages/cli packages/mcp -g '*.ts'
```

Expected: no matches.

- [ ] **Step 2: Check external packages for deep core imports**

Run:

```bash
rg -n 'from "@nakidka/core/|import\("@nakidka/core/' packages/cli packages/mcp -g '*.ts'
```

Expected: no matches.

- [ ] **Step 3: Type-check CLI and MCP against public `@nakidka/core`**

Run:

```bash
pnpm --filter @nakidka/cli exec tsc --noEmit
pnpm --filter @nakidka/mcp exec tsc --noEmit
```

Expected: both commands PASS. If either command reports that a symbol is not exported from `@nakidka/core`, export that exact symbol from `packages/core/index.ts` using the same style as the neighbouring exports, then rerun both commands.

## Task 5: Run Full Verification

**Files:**
- Verify only unless a previous task revealed a concrete compile error.

- [ ] **Step 1: Run core type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Run final alias scan**

Run:

```bash
rg -n 'from "~/|export .* from "~/|import\("~/|import "~/|["'\\''"]~\/\*["'\\''"]|alias:\s*\{' packages -g '*.ts' -g '*.json'
```

Expected: no matches for working `~` aliases. If this finds documentation-like test strings, remove or rewrite those strings so the repository no longer contains TypeScript/config examples that depend on `~`.

- [ ] **Step 4: Inspect architecture boundary changes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/importBoundaries.test.ts
```

Expected: PASS. This confirms the relative import rewrite did not introduce forbidden dependencies in `metadata/orchestration`, `metadata/validation`, or `metadata/project`.

## Task 6: Commit the Migration

**Files:**
- All files changed by Tasks 1-5.

- [ ] **Step 1: Review changed files**

Run:

```bash
git status --short
git diff --stat
```

Expected: changed files are limited to import rewrites, config alias removal, guard tests, and possible `packages/core/index.ts` public exports.

- [ ] **Step 2: Commit**

Run:

```bash
git add packages/core packages/cli packages/mcp
git commit -m "refactor: :recycle: убрать alias ~ из импортов core"
```

Expected: commit succeeds.

- [ ] **Step 3: Confirm clean worktree**

Run:

```bash
git status --short --branch
```

Expected: no modified or untracked files.
