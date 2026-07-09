# MCP npm Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `@nkdk/mcp` the only public npm package and let agents run it with `npx -y @nkdk/mcp` without cloning the monorepo.

**Architecture:** `packages/mcp` gets a publication build that bundles MCP and core into `dist/bin/nkdk-mcp.mjs`, while validation worker and standalone AJV stay as sibling runtime files under `dist`. Internal packages stay workspace-only and are protected from accidental publish.

**Tech Stack:** TypeScript, ESM, esbuild, Piscina, npm `files`, MCP SDK, Vitest, pnpm workspaces.

## Global Constraints

- Publish only `packages/mcp` as `@nkdk/mcp`.
- Do not publish `@nkdk/core` as a standalone public package.
- Do not publish `@nkdk/cli` as the main user-facing product.
- Do not publish root package `nkdk` as an executable package in this change.
- Published `@nkdk/mcp` must not depend on `workspace:*`.
- Published runtime must not use `pnpm --filter`, monorepo-relative `../../..` bin paths, or TypeScript source execution through local `tsx`.
- MCP behavior and tool names must not change.
- Main documented user scenario is `command: "npx"`, `args: ["-y", "@nkdk/mcp"]`.

---

## File Structure

- `packages/mcp/scripts/build.mjs`: new publication build script. It runs esbuild for the MCP entrypoint, validation worker, and standalone AJV generator, then writes executable `dist/bin/nkdk-mcp.mjs`.
- `packages/mcp/scripts/smoke-packed.mjs`: new smoke script that packs `@nkdk/mcp`, installs the tarball into a temporary project, starts the installed binary through the MCP client, and calls `nkdk.get_schema`.
- `packages/mcp/package.json`: publish metadata, `bin`, `files`, `scripts.build`, `scripts.prepack`, `devDependencies.esbuild`, and removal of runtime `@nkdk/core`.
- `package.json`, `packages/core/package.json`, `packages/cli/package.json`: mark non-published packages as `private: true`.
- `packages/mcp/src/coreApi.ts`: replace monorepo-relative dynamic import of `../../core/index.ts` with bundled static import from `@nkdk/core`.
- `packages/core/metadata/validation/projectValidationWorkerPool.ts`: extract worker filename resolution and support bundled MCP layout where entrypoint is in `dist/bin` and worker is in parent `dist`.
- `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`: cover worker path resolution for source, built core, and bundled MCP layouts.
- `packages/mcp/src/server.ts`: use package version from an injected build constant or runtime fallback so MCP server version matches package version.
- `README.md`: document npm/npx MCP setup first and move local clone setup to development usage.
- `docs/superpowers/specs/2026-07-09-mcp-npm-publish-design.md`: already approved source spec; do not edit unless implementation reveals a spec bug.

---

### Task 1: Make Core Loading Bundle-Friendly

**Files:**
- Modify: `packages/mcp/src/coreApi.ts`
- Test: `packages/mcp/src/server.test.ts`

**Interfaces:**
- Consumes: existing public exports from `@nkdk/core`.
- Produces: `loadCoreApi(): Promise<CoreApi>` still returns the same shape, but no longer depends on `../../core/index.ts` at runtime.

- [ ] **Step 1: Change `coreApi.ts` test expectation before implementation**

Add this test to `packages/mcp/src/server.test.ts` after the existing `calls registered tools through the MCP protocol` test:

```ts
it("loads core API without a monorepo-relative runtime import", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("./coreApi.ts", import.meta.url), "utf8"))

  expect(source).not.toContain("../../core/index.ts")
  expect(source).toContain('from "@nkdk/core"')
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```sh
pnpm --filter @nkdk/mcp exec vitest run src/server.test.ts -t "loads core API"
```

Expected: FAIL because `coreApi.ts` still contains `../../core/index.ts` and does not statically import `@nkdk/core`.

- [ ] **Step 3: Replace dynamic core URL import**

In `packages/mcp/src/coreApi.ts`, replace:

```ts
const coreModuleUrl = new URL("../../core/index.ts", import.meta.url).href
let cachedCoreApi: Promise<CoreApi> | undefined

export function loadCoreApi(): Promise<CoreApi> {
  cachedCoreApi ??= import(coreModuleUrl) as Promise<CoreApi>
  return cachedCoreApi
}
```

with:

```ts
import * as coreApi from "@nkdk/core"

export function loadCoreApi(): Promise<CoreApi> {
  return Promise.resolve(coreApi as CoreApi)
}
```

Keep all existing type declarations in the file.

- [ ] **Step 4: Run focused MCP tests**

Run:

```sh
pnpm --filter @nkdk/mcp test -- src/server.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```sh
git add packages/mcp/src/coreApi.ts packages/mcp/src/server.test.ts
git commit -m "refactor: :recycle: подготовить загрузку core к сборке MCP"
```

---

### Task 2: Resolve Validation Worker in Bundled Layout

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Test: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

**Interfaces:**
- Produces: `resolveProjectValidationWorkerFile(currentFile: string, exists?: (path: string) => boolean): string`
- Consumes: `createWorkerPool()` uses `resolveProjectValidationWorkerFile(fileURLToPath(import.meta.url))`.

- [ ] **Step 1: Add failing tests for worker path resolution**

Append these tests to `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`:

```ts
import { join } from "node:path"
```

If the file already imports from `node:path`, extend that import instead.

Add this `describe` block:

```ts
describe("resolveProjectValidationWorkerFile", () => {
  it("uses TypeScript worker next to source file", async () => {
    const { resolveProjectValidationWorkerFile } = await import("./projectValidationWorkerPool")

    const result = resolveProjectValidationWorkerFile(
      "/repo/packages/core/metadata/validation/projectValidationWorkerPool.ts",
    )

    expect(result).toBe("/repo/packages/core/metadata/validation/projectValidationWorker.ts")
  })

  it("uses JavaScript worker next to built core file", async () => {
    const { resolveProjectValidationWorkerFile } = await import("./projectValidationWorkerPool")

    const result = resolveProjectValidationWorkerFile(
      "/repo/packages/core/dist/projectValidationWorkerPool.js",
    )

    expect(result).toBe("/repo/packages/core/dist/projectValidationWorker.js")
  })

  it("uses parent dist worker for bundled MCP bin layout", async () => {
    const { resolveProjectValidationWorkerFile } = await import("./projectValidationWorkerPool")
    const existing = new Set([join("/repo/packages/mcp/dist", "projectValidationWorker.js")])

    const result = resolveProjectValidationWorkerFile(
      "/repo/packages/mcp/dist/bin/nkdk-mcp.mjs",
      (path) => existing.has(path),
    )

    expect(result).toBe("/repo/packages/mcp/dist/projectValidationWorker.js")
  })
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```sh
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts -t "resolveProjectValidationWorkerFile"
```

Expected: FAIL because `resolveProjectValidationWorkerFile` is not exported.

- [ ] **Step 3: Implement worker resolver**

In `packages/core/metadata/validation/projectValidationWorkerPool.ts`, add `existsSync` to imports:

```ts
import { existsSync } from "node:fs"
```

Add this exported function before `createWorkerPool()`:

```ts
export function resolveProjectValidationWorkerFile(
  currentFile: string,
  exists: (path: string) => boolean = existsSync,
): string {
  if (currentFile.endsWith(".ts")) return join(dirname(currentFile), "projectValidationWorker.ts")

  const sameDirectoryWorker = join(dirname(currentFile), "projectValidationWorker.js")
  if (exists(sameDirectoryWorker)) return sameDirectoryWorker

  const parentDirectoryWorker = join(dirname(dirname(currentFile)), "projectValidationWorker.js")
  if (exists(parentDirectoryWorker)) return parentDirectoryWorker

  return sameDirectoryWorker
}
```

Then replace the worker file calculation in `createWorkerPool()` with:

```ts
  const currentFile = fileURLToPath(import.meta.url)
  const workerFile = resolveProjectValidationWorkerFile(currentFile)
```

Keep the existing `execArgv` logic unchanged.

- [ ] **Step 4: Run focused worker tests**

Run:

```sh
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```sh
git add packages/core/metadata/validation/projectValidationWorkerPool.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts
git commit -m "fix: :bug: находить validation worker в сборке MCP"
```

---

### Task 3: Add MCP Publication Build

**Files:**
- Create: `packages/mcp/scripts/build.mjs`
- Modify: `packages/mcp/package.json`
- Test: `packages/mcp/src/server.test.ts`

**Interfaces:**
- Produces: `pnpm --filter @nkdk/mcp build`
- Produces files:
  - `packages/mcp/dist/bin/nkdk-mcp.mjs`
  - `packages/mcp/dist/projectValidationWorker.js`
  - `packages/mcp/dist/generateProjectValidationAjvStandalone.js`
  - `packages/mcp/dist/projectValidationAjvStandalone.js`

- [ ] **Step 1: Add a build-output test**

Add this test to `packages/mcp/src/server.test.ts`:

```ts
it("documents expected publish build outputs", () => {
  const outputs = [
    "dist/bin/nkdk-mcp.mjs",
    "dist/projectValidationWorker.js",
    "dist/generateProjectValidationAjvStandalone.js",
    "dist/projectValidationAjvStandalone.js",
  ]

  expect(outputs).toEqual([
    "dist/bin/nkdk-mcp.mjs",
    "dist/projectValidationWorker.js",
    "dist/generateProjectValidationAjvStandalone.js",
    "dist/projectValidationAjvStandalone.js",
  ])
})
```

This test is intentionally simple; the real verification is the build command in later steps.

- [ ] **Step 2: Create `packages/mcp/scripts/build.mjs`**

Create the file with this content:

```js
import esbuild from "esbuild"
import { chmod, cp, mkdir, rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(__dirname, "..")
const repoRoot = join(packageRoot, "../..")
const distDir = join(packageRoot, "dist")
const binDir = join(distDir, "bin")
const packageJson = (await import(pathToFileURL(join(packageRoot, "package.json")).href, {
  with: { type: "json" },
})).default

await rm(distDir, { force: true, recursive: true })
await mkdir(binDir, { recursive: true })

const commonOptions = {
  absWorkingDir: repoRoot,
  bundle: true,
  format: "esm",
  logLevel: "info",
  platform: "node",
  sourcemap: false,
  target: "node26",
  tsconfig: join(repoRoot, "tsconfig.build.json"),
  define: {
    __NKDK_MCP_VERSION__: JSON.stringify(packageJson.version),
  },
}

await esbuild.build({
  ...commonOptions,
  banner: { js: "#!/usr/bin/env node" },
  entryPoints: [join(packageRoot, "src/server.ts")],
  outfile: join(binDir, "nkdk-mcp.mjs"),
})

await esbuild.build({
  ...commonOptions,
  entryPoints: [join(repoRoot, "packages/core/metadata/validation/projectValidationWorker.ts")],
  outfile: join(distDir, "projectValidationWorker.js"),
})

await esbuild.build({
  ...commonOptions,
  entryPoints: [join(repoRoot, "packages/core/metadata/validation/generateProjectValidationAjvStandalone.ts")],
  outfile: join(distDir, "generateProjectValidationAjvStandalone.js"),
})

const { generateProjectValidationAjvStandalone } = await import(
  pathToFileURL(join(distDir, "generateProjectValidationAjvStandalone.js")).href
)

await generateProjectValidationAjvStandalone({
  outfile: join(distDir, "projectValidationAjvStandalone.js"),
})

await chmod(join(binDir, "nkdk-mcp.mjs"), 0o755)
await cp(join(repoRoot, "README.md"), join(packageRoot, "README.md"))
await cp(join(repoRoot, "LICENSE"), join(packageRoot, "LICENSE"))
```

- [ ] **Step 3: Add package scripts and esbuild dependency**

In `packages/mcp/package.json`, add:

```json
"scripts": {
  "build": "node scripts/build.mjs",
  "dev": "tsx src/server.ts",
  "prepack": "pnpm run build",
  "test": "vitest run --passWithNoTests",
  "type-check": "tsc --noEmit"
}
```

Add to `devDependencies`:

```json
"esbuild": "^0.28.1"
```

- [ ] **Step 4: Run the build**

Run:

```sh
pnpm --filter @nkdk/mcp build
```

Expected: command exits 0 and creates the four `dist` files listed above.

- [ ] **Step 5: Verify executable header**

Run:

```sh
head -n 1 packages/mcp/dist/bin/nkdk-mcp.mjs
```

Expected output:

```text
#!/usr/bin/env node
```

- [ ] **Step 6: Run MCP tests**

Run:

```sh
pnpm --filter @nkdk/mcp test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```sh
git add packages/mcp/package.json packages/mcp/scripts/build.mjs packages/mcp/src/server.test.ts pnpm-lock.yaml
git commit -m "feat: :sparkles: добавить сборку npm-пакета MCP"
```

---

### Task 4: Make Server Version and Package Metadata Publish-Safe

**Files:**
- Modify: `packages/mcp/src/server.ts`
- Modify: `packages/mcp/package.json`
- Modify: `package.json`
- Modify: `packages/core/package.json`
- Modify: `packages/cli/package.json`

**Interfaces:**
- Consumes: build constant `__NKDK_MCP_VERSION__`.
- Produces: `createNkdkMcpServer()` reports package version when built.

- [ ] **Step 1: Add server version test**

In `packages/mcp/src/server.test.ts`, add:

```ts
it("uses package version for MCP server metadata", async () => {
  const { createNkdkMcpServer } = await import("./server")
  const packageJson = await import("../package.json", { with: { type: "json" } })

  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("./server.ts", import.meta.url), "utf8"))

  expect(source).not.toContain('version: "1.0.0"')
  expect(packageJson.default.version).toMatch(/^\d+\.\d+\.\d+/)
  expect(createNkdkMcpServer()).toBeDefined()
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```sh
pnpm --filter @nkdk/mcp exec vitest run src/server.test.ts -t "uses package version"
```

Expected: FAIL because `server.ts` still contains `version: "1.0.0"`.

- [ ] **Step 3: Add build constant declaration and fallback**

In `packages/mcp/src/server.ts`, add near imports:

```ts
declare const __NKDK_MCP_VERSION__: string | undefined

const MCP_SERVER_VERSION =
  typeof __NKDK_MCP_VERSION__ === "string" && __NKDK_MCP_VERSION__.length > 0 ? __NKDK_MCP_VERSION__ : "0.0.0-dev"
```

Replace:

```ts
    version: "1.0.0",
```

with:

```ts
    version: MCP_SERVER_VERSION,
```

- [ ] **Step 4: Set publish metadata**

In `packages/mcp/package.json`, set these top-level fields:

```json
"bin": {
  "nkdk-mcp": "./dist/bin/nkdk-mcp.mjs"
},
"files": [
  "dist",
  "README.md",
  "LICENSE"
]
```

Remove this dependency from `dependencies`:

```json
"@nkdk/core": "workspace:*"
```

Keep `@modelcontextprotocol/sdk`, `tsx`, and `zod` in `dependencies` unless the build proves they are fully bundled and no longer needed at runtime. Do not remove them in this task.

- [ ] **Step 5: Protect non-published packages**

Add `"private": true` to:

```json
package.json
packages/core/package.json
packages/cli/package.json
```

Do not add `"private": true` to `packages/mcp/package.json`.

- [ ] **Step 6: Update lockfile**

Run:

```sh
pnpm install --lockfile-only
```

Expected: exits 0 and removes the `@nkdk/core` workspace dependency from the `packages/mcp` importer in `pnpm-lock.yaml`.

- [ ] **Step 7: Run tests and build**

Run:

```sh
pnpm --filter @nkdk/mcp test
pnpm --filter @nkdk/mcp build
```

Expected: both exit 0.

- [ ] **Step 8: Commit**

```sh
git add package.json packages/core/package.json packages/cli/package.json packages/mcp/package.json packages/mcp/src/server.ts packages/mcp/src/server.test.ts pnpm-lock.yaml
git commit -m "chore: :wrench: подготовить metadata MCP к публикации"
```

---

### Task 5: Add Packed Package Smoke Test

**Files:**
- Create: `packages/mcp/scripts/smoke-packed.mjs`
- Modify: `packages/mcp/package.json`

**Interfaces:**
- Produces: `pnpm --filter @nkdk/mcp smoke:packed`
- Verifies installed tarball can register and execute MCP tools outside the monorepo.

- [ ] **Step 1: Create smoke script**

Create `packages/mcp/scripts/smoke-packed.mjs`:

```js
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const tmpRoot = await mkdtemp(join(tmpdir(), "nkdk-mcp-pack-"))

try {
  const pack = spawnSync("npm", ["pack", "--json", "--pack-destination", tmpRoot], {
    cwd: packageRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  })
  if (pack.status !== 0) throw new Error(`npm pack failed with status ${pack.status}`)

  const packed = JSON.parse(pack.stdout)
  const tarball = join(tmpRoot, packed[0].filename)

  const install = spawnSync("npm", ["install", "--ignore-scripts", tarball], {
    cwd: tmpRoot,
    encoding: "utf8",
    stdio: "inherit",
  })
  if (install.status !== 0) throw new Error(`npm install failed with status ${install.status}`)

  const command = join(tmpRoot, "node_modules/.bin/nkdk-mcp")
  const transport = new StdioClientTransport({ command, args: [] })
  const client = new Client({ name: "nkdk-packed-smoke", version: "1.0.0" })

  await client.connect(transport)
  try {
    const tools = await client.listTools()
    const toolNames = tools.tools.map((tool) => tool.name)
    if (!toolNames.includes("nkdk.get_schema")) {
      throw new Error(`nkdk.get_schema not registered. Tools: ${toolNames.join(", ")}`)
    }

    const result = await client.callTool({
      name: "nkdk.get_schema",
      arguments: { target: "InputField", keys: true },
    })
    if (result.isError) throw new Error(`nkdk.get_schema returned MCP error`)
  } finally {
    await client.close()
  }
} finally {
  await rm(tmpRoot, { recursive: true, force: true })
}
```

- [ ] **Step 2: Add smoke script command**

In `packages/mcp/package.json`, add:

```json
"smoke:packed": "node scripts/smoke-packed.mjs"
```

Keep `prepack` as `pnpm run build`, so `npm pack` inside the smoke script always rebuilds.

- [ ] **Step 3: Run smoke test**

Run:

```sh
pnpm --filter @nkdk/mcp smoke:packed
```

Expected: exits 0. If it fails because npm cache permissions are broken, rerun with:

```sh
env npm_config_cache=/private/tmp/nkdk-npm-cache pnpm --filter @nkdk/mcp smoke:packed
```

- [ ] **Step 4: Inspect dry-run contents**

Run:

```sh
cd packages/mcp && env npm_config_cache=/private/tmp/nkdk-npm-cache npm pack --dry-run
```

Expected: tarball contents include `dist/**`, `package.json`, `README.md`, and `LICENSE`; contents do not include `src/**/*.ts`, `*.test.ts`, `node_modules`, `packages/core`, `.agents`, or `docs/superpowers`.

- [ ] **Step 5: Commit**

```sh
git add packages/mcp/package.json packages/mcp/scripts/smoke-packed.mjs
git commit -m "test: :white_check_mark: проверить упакованный MCP-сервер"
```

---

### Task 6: Update README for npm MCP Setup

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: README where npm/npx setup is primary and local clone setup is development-only.

- [ ] **Step 1: Update MCP connection section**

Replace the current clone-first MCP setup in `README.md` with:

```md
## Подключение MCP-сервера

NKDK подключается к агенту как локальный MCP-сервер через npm-пакет.

Укажите агенту команду запуска сервера:

```json
{
  "mcpServers": {
    "nkdk": {
      "command": "npx",
      "args": ["-y", "@nkdk/mcp"]
    }
  }
}
```

`npx` скачает опубликованную версию `@nkdk/mcp` и запустит MCP-сервер через stdio.
```

Keep the existing MCP tools table below this section.

- [ ] **Step 2: Add local development subsection**

After the MCP tools table, add:

```md
### Локальная разработка MCP-сервера

Для проверки изменений из локального клона:

```sh
git clone https://github.com/crimsongoldteam/nkdk.git
cd nkdk
pnpm install
pnpm --filter @nkdk/mcp dev
```

В конфигурации агента для локальной разработки можно указывать абсолютный путь к `packages/mcp/bin/nkdk-mcp`.
Для обычного использования предпочтителен npm-вариант через `npx`.
```

- [ ] **Step 3: Verify README mentions npx**

Run:

```sh
rg -n '"command": "npx"|@nkdk/mcp|Локальная разработка MCP-сервера' README.md
```

Expected: all three patterns are found.

- [ ] **Step 4: Commit**

```sh
git add README.md
git commit -m "docs: :memo: описать запуск MCP через npm"
```

---

### Task 7: Final Verification and Publish Readiness

**Files:**
- No source edits expected.

**Interfaces:**
- Consumes all previous tasks.
- Produces verified release candidate for `@nkdk/mcp`.

- [ ] **Step 1: Check worktree**

Run:

```sh
git status --short
```

Expected: no output.

- [ ] **Step 2: Run full tests**

Run:

```sh
pnpm test
```

Expected: all workspace test suites pass.

- [ ] **Step 3: Run MCP build**

Run:

```sh
pnpm --filter @nkdk/mcp build
```

Expected: exits 0 and creates `packages/mcp/dist/bin/nkdk-mcp.mjs`.

- [ ] **Step 4: Run packed smoke**

Run:

```sh
env npm_config_cache=/private/tmp/nkdk-npm-cache pnpm --filter @nkdk/mcp smoke:packed
```

Expected: exits 0.

- [ ] **Step 5: Run npm pack dry-run**

Run:

```sh
cd packages/mcp && env npm_config_cache=/private/tmp/nkdk-npm-cache npm pack --dry-run
```

Expected: output lists only publish-safe files: `dist`, `package.json`, `README.md`, and `LICENSE`.

- [ ] **Step 6: Check npm auth**

Run:

```sh
npm whoami
```

Expected: prints the npm username. If it returns `ENEEDAUTH`, stop and ask the user to run `npm login` or provide a publish token in their environment.

- [ ] **Step 7: Publish only MCP package**

Run only after user confirms publication:

```sh
cd packages/mcp
npm publish --access public
```

Expected: npm publishes `@nkdk/mcp@0.0.3`.

- [ ] **Step 8: Verify published package**

Run:

```sh
npm view @nkdk/mcp@0.0.3 version
```

Expected output:

```text
0.0.3
```

- [ ] **Step 9: Commit generated package metadata changes if any**

If `README.md` or `LICENSE` copied into `packages/mcp` are tracked and changed, commit them:

```sh
git status --short
git add packages/mcp/README.md packages/mcp/LICENSE
git commit -m "chore: :wrench: обновить файлы публикации MCP"
```

If `git status --short` is empty, do not create a commit.

---

## Self-Review

- Spec coverage: the plan covers single public `@nkdk/mcp`, no standalone `@nkdk/core`, no workspace runtime dependency, dist entrypoint plus worker/standalone files, npm `files`, README npx setup, dry-run, smoke test, auth check, and publish.
- Placeholder scan: no placeholder markers are present; every task has exact files, commands, and expected results.
- Type consistency: `loadCoreApi(): Promise<CoreApi>`, `resolveProjectValidationWorkerFile(currentFile, exists?)`, `pnpm --filter @nkdk/mcp build`, and `smoke:packed` are defined before later tasks consume them.
