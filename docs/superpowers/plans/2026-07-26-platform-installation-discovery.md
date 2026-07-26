# Platform Installation Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать `@nkdk/platform` и реализовать внутренний поиск самой новой установленной сборки 1С `8.3.27.*` с независимыми путями к `1cv8` и `ibcmd`.

**Architecture:** Новый пакет не зависит от `core` и получает файловую систему и окружение через внутренний договор. Рабочий переходник использует Node.js, а тесты целиком задают модельные файлы, каталоги, ошибки, ОС и архитектуру без временных файлов.

**Tech Stack:** TypeScript 6, Node.js 26, Vitest 4, pnpm workspace.

## Global Constraints

- Поддерживаются только Windows, Linux и macOS.
- Поддерживается только ветка платформы `8.3.27`; выбирается максимальная числовая сборка.
- Нет явного пути от вызывающей стороны, поиска через `PATH`, запуска программ, чтения PE/ELF/Mach-O, рекурсивного сканирования и кеша.
- `1cv8` и `ibcmd` проверяются независимо; кандидат без обоих приложений не считается установкой.
- На Linux и macOS приложение должно иметь хотя бы один исполняемый бит.
- Все тесты используют модельную файловую систему; временные каталоги и файлы запрещены.
- Существующие XML-фикстуры не изменяются.
- Перед завершением всего плана выполняется `pnpm test` из корня.

---

## File Structure

- `packages/platform/package.json` — workspace-манифест приватного пакета.
- `packages/platform/tsconfig.json` — строгая проверка TypeScript без emit.
- `packages/platform/vitest.config.ts` — тесты в Node.js.
- `packages/platform/index.ts` — единственная публичная граница пакета.
- `packages/platform/src/runtime.ts` — внутренние договоры файловой системы/окружения и рабочий Node.js-переходник.
- `packages/platform/src/testing/memoryRuntime.ts` — модельное окружение для тестов.
- `packages/platform/src/startupConfig.ts` — разбор `1cestart.cfg`, повторных ключей и `CommonCfgLocation`.
- `packages/platform/src/platform/roots.ts` — штатные корни и `InstalledLocation`.
- `packages/platform/src/platform/findPlatform.ts` — обнаружение кандидатов и выбор установки.
- `packages/platform/src/platform/types.ts` — тип результата и внутреннего кандидата.
- Тесты располагаются рядом с каждым модулем как `*.test.ts`.
- `tsconfig.build.json` — путь `@nkdk/platform` и включение исходников пакета.
- `pnpm-lock.yaml` — новый workspace-importer.

### Task 1: Package boundary and model runtime

**Files:**
- Create: `packages/platform/package.json`
- Create: `packages/platform/tsconfig.json`
- Create: `packages/platform/vitest.config.ts`
- Create: `packages/platform/index.ts`
- Create: `packages/platform/src/runtime.ts`
- Create: `packages/platform/src/testing/memoryRuntime.ts`
- Create: `packages/platform/src/testing/memoryRuntime.test.ts`
- Modify: `tsconfig.build.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces:

```ts
export type PlatformOs = "win32" | "linux" | "darwin"
export type PlatformArchitecture = "x86" | "x64" | "arm64" | "unknown"

export type FileStat = {
  isFile: boolean
  isDirectory: boolean
  mode: number
}

export type FileSystem = {
  readFile(path: string): Promise<string>
  readdir(path: string): Promise<string[]>
  stat(path: string): Promise<FileStat>
  realpath(path: string): Promise<string>
}

export type PlatformEnvironment = {
  os: PlatformOs
  arch: PlatformArchitecture
  env: Readonly<Record<string, string | undefined>>
}

export type PlatformRuntime = {
  fs: FileSystem
  environment: PlatformEnvironment
}

export const nodePlatformRuntime: PlatformRuntime
```

- `createMemoryRuntime()` is test-only and returns the same `PlatformRuntime` plus methods for declaring files, directories, canonical paths and read errors.

- [ ] **Step 1: Add the package manifests and a failing runtime test**

Create the package scripts and exports:

```json
{
  "name": "@nkdk/platform",
  "version": "0.0.3",
  "private": true,
  "type": "module",
  "main": "./index.ts",
  "exports": {
    ".": {
      "import": "./index.ts"
    }
  },
  "scripts": {
    "test": "vitest run",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^26.0.0",
    "typescript": "~6.0.0",
    "vitest": "^4.1.9"
  }
}
```

Add a test that declares a directory and executable file entirely in memory:

```ts
it("models directories, files, canonical paths, and read failures", async () => {
  const runtime = createMemoryRuntime({ os: "linux", arch: "x64", env: { HOME: "/home/test" } })
    .directory("/opt/1cv8/x86_64")
    .file("/opt/1cv8/x86_64/ibcmd", { mode: 0o755, content: "binary" })
    .canonical("/opt/link", "/opt/1cv8/x86_64")
    .readError("/broken.cfg", new Error("EACCES"))

  await expect(runtime.fs.readdir("/opt/1cv8")).resolves.toEqual(["x86_64"])
  await expect(runtime.fs.stat("/opt/1cv8/x86_64/ibcmd")).resolves.toEqual({
    isFile: true,
    isDirectory: false,
    mode: 0o755,
  })
  await expect(runtime.fs.realpath("/opt/link")).resolves.toBe("/opt/1cv8/x86_64")
  await expect(runtime.fs.readFile("/broken.cfg")).rejects.toThrow("EACCES")
})
```

- [ ] **Step 2: Run the package test and verify it fails**

Run:

```bash
pnpm --filter @nkdk/platform test
```

Expected: FAIL because `createMemoryRuntime` and the runtime contracts do not exist.

- [ ] **Step 3: Implement the minimal runtime contracts and model**

Implement a normalized map-backed model. Missing paths must reject with an error carrying `code: "ENOENT"`; declared read failures must be returned verbatim. Select `node:path.win32` for Windows and `node:path.posix` otherwise. The working adapter uses:

```ts
import { readFile, readdir, realpath, stat } from "node:fs/promises"

export const nodePlatformRuntime: PlatformRuntime = {
  fs: {
    readFile: (path) => readFile(path, "utf8"),
    readdir,
    realpath,
    stat: async (path) => {
      const value = await stat(path)
      return {
        isFile: value.isFile(),
        isDirectory: value.isDirectory(),
        mode: value.mode,
      }
    },
  },
  environment: {
    os: normalizePlatform(process.platform),
    arch: normalizeArchitecture(process.arch),
    env: process.env,
  },
}
```

`normalizePlatform` must reject unsupported Node.js platforms with a descriptive error. `normalizeArchitecture` maps `ia32 → x86`, `x64 → x64`, `arm64 → arm64`, everything else to `unknown`.

- [ ] **Step 4: Wire the workspace and install**

Add to `tsconfig.build.json`:

```json
"paths": {
  "@nkdk/core": ["./packages/core/index.ts"],
  "@nkdk/platform": ["./packages/platform/index.ts"]
}
```

Add `packages/platform/index.ts` and `packages/platform/src/**/*.ts` to `include`, then run:

```bash
pnpm install
```

Expected: `pnpm-lock.yaml` contains a `packages/platform` importer and installation succeeds.

- [ ] **Step 5: Run focused verification**

Run:

```bash
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/platform type-check
```

Expected: both commands PASS without creating filesystem fixtures.

- [ ] **Step 6: Commit**

```bash
git add packages/platform tsconfig.build.json pnpm-lock.yaml
git commit -m "chore: :wrench: создать пакет platform"
```

### Task 2: Startup configuration and installation roots

**Files:**
- Create: `packages/platform/src/startupConfig.ts`
- Create: `packages/platform/src/startupConfig.test.ts`
- Create: `packages/platform/src/platform/roots.ts`
- Create: `packages/platform/src/platform/roots.test.ts`

**Interfaces:**
- Consumes: `PlatformRuntime`, `FileSystem`, `PlatformEnvironment`.
- Produces:

```ts
export type ConfigEntry = {
  key: string
  value: string
  order: number
}

export type StartupConfigFile = {
  path: string
  kind: "common-config" | "all-users-config" | "user-config"
  entries: ConfigEntry[]
}

export type ConfigWarning = {
  source: string
  message: string
}

export type StartupConfiguration = {
  files: StartupConfigFile[]
  warnings: ConfigWarning[]
}

export async function readStartupConfiguration(runtime: PlatformRuntime): Promise<StartupConfiguration>

export type InstallationRoot = {
  path: string
  source: "common-config" | "all-users-config" | "user-config" | "standard"
  architecture?: PlatformArchitecture
  order: number
}

export async function collectInstallationRoots(runtime: PlatformRuntime): Promise<InstallationRoot[]>
```

- [ ] **Step 1: Write failing configuration tests**

Cover repeated case-insensitive keys, comments/blank lines, quoted values, a relative `CommonCfgLocation`, a repeated canonical config path and an unreadable common config:

```ts
it("collects repeated keys and follows each common configuration once", async () => {
  const runtime = createMemoryRuntime({ os: "win32", arch: "x64", env: windowsEnv })
    .file("C:/Users/Test/AppData/Roaming/1C/1CEStart/1CEStart.cfg", {
      content: [
        "CommonCfgLocation=../shared/1cescmn.cfg",
        "installedlocation=C:/User/1cv8",
        "InstalledLocation=C:/User/Second",
      ].join("\n"),
    })
    .file("C:/Users/Test/AppData/Roaming/1C/shared/1cescmn.cfg", {
      content: "InstalledLocation=Z:/Company/1cv8",
    })

  const result = await readStartupConfiguration(runtime)

  expect(result.files.find(({ kind }) => kind === "common-config")?.entries)
    .toEqual([{ key: "installedlocation", value: "Z:/Company/1cv8", order: 0 }])
  expect(result.files.find(({ kind }) => kind === "user-config")?.entries)
    .toEqual([
      expect.objectContaining({ key: "commoncfglocation" }),
      { key: "installedlocation", value: "C:/User/1cv8", order: 1 },
      { key: "installedlocation", value: "C:/User/Second", order: 2 },
    ])
})
```

Assert each returned file's `kind`; do not require `readStartupConfiguration` to impose the `InstalledLocation` priority.

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/startupConfig.test.ts
```

Expected: FAIL because `readStartupConfiguration` is missing.

- [ ] **Step 3: Implement configuration parsing and traversal**

Parse each non-empty non-comment line at the first `=` and lowercase only the key. Resolve relative `CommonCfgLocation` against its declaring file. Read canonical config paths once and preserve entries in their declaring files. The user config is read first to discover `CommonCfgLocation`; every file carries an explicit `kind`, so each consumer can apply its own documented priority. Missing optional configs are ignored; unreadable explicitly connected configs produce `ConfigWarning`.

- [ ] **Step 4: Write failing root tests for all operating systems**

Add table-driven cases asserting these roots:

```ts
const expected = {
  win32: [
    "C:/Program Files/1cv8",
    "C:/Program Files (x86)/1cv8",
    "C:/Users/Test/AppData/Local/Programs/1cv8",
    "C:/Users/Test/AppData/Local/Programs/1cv8_x86",
    "C:/Users/Test/AppData/Local/Programs/1cv8_x64",
  ],
  linux: ["/opt/1cv8/x86_64", "/opt/1cv8/i386", "/opt/1cv8/arm64"],
  darwin: ["/opt/1cv8"],
}
```

Also assert that config roots precede standard roots and canonical duplicates are removed using case-insensitive comparison only on Windows.

- [ ] **Step 5: Run the root test and verify it fails**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/platform/roots.test.ts
```

Expected: FAIL because `collectInstallationRoots` is missing.

- [ ] **Step 6: Implement root collection**

Use `node:path.win32` or `node:path.posix` selected from `runtime.environment.os`. Expand only documented environment variables. When extracting `InstalledLocation`, apply `common-config → all-users-config → user-config`, then append standard roots. Attach architecture to Linux architecture roots and Windows `_x86`/`_x64` roots. Preserve order after canonical deduplication.

- [ ] **Step 7: Run focused verification**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/startupConfig.test.ts src/platform/roots.test.ts
pnpm --filter @nkdk/platform type-check
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/platform/src/startupConfig.ts packages/platform/src/startupConfig.test.ts packages/platform/src/platform
git commit -m "feat: :sparkles: находить корни установки платформы"
```

### Task 3: Candidate validation and newest installation selection

**Files:**
- Create: `packages/platform/src/platform/types.ts`
- Create: `packages/platform/src/platform/findPlatform.ts`
- Create: `packages/platform/src/platform/findPlatform.test.ts`
- Modify: `packages/platform/index.ts`

**Interfaces:**
- Consumes: `collectInstallationRoots(runtime)`.
- Produces:

```ts
export type PlatformInstallation = {
  version: string
  directory: string
  enterprisePath?: string
  ibcmdPath?: string
}

export async function findPlatform(): Promise<PlatformInstallation | undefined>

// Internal seam used by tests:
export async function findPlatformWithRuntime(
  runtime: PlatformRuntime,
): Promise<PlatformInstallation | undefined>
```

Only `findPlatform` and `PlatformInstallation` are exported from `packages/platform/index.ts`; the runtime-aware seam is imported directly by co-located tests.

- [ ] **Step 1: Write the failing selection tests**

Model candidates without creating files:

```ts
it("selects the highest numeric 8.3.27 build and reports applications independently", async () => {
  const runtime = linuxRuntime()
    .directory("/opt/1cv8/x86_64/8.3.27.999")
    .file("/opt/1cv8/x86_64/8.3.27.999/1cv8", { mode: 0o755 })
    .directory("/opt/1cv8/x86_64/8.3.27.1000")
    .file("/opt/1cv8/x86_64/8.3.27.1000/ibcmd", { mode: 0o755 })
    .directory("/opt/1cv8/x86_64/8.3.28.1")
    .file("/opt/1cv8/x86_64/8.3.28.1/ibcmd", { mode: 0o755 })

  await expect(findPlatformWithRuntime(runtime)).resolves.toEqual({
    version: "8.3.27.1000",
    directory: "/opt/1cv8/x86_64/8.3.27.1000",
    ibcmdPath: "/opt/1cv8/x86_64/8.3.27.1000/ibcmd",
  })
})
```

Add separate tests for:

- Windows `bin/1cv8.exe` and `bin/ibcmd.exe`;
- Unix executable-bit rejection;
- `bin` fallback on Linux/macOS;
- candidate with neither application;
- same build on native and non-native architecture;
- canonical paths returned from `realpath`;
- unreadable roots skipped;
- no candidates returning `undefined`.

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
pnpm --filter @nkdk/platform exec vitest run src/platform/findPlatform.test.ts
```

Expected: FAIL because the function and result type are missing.

- [ ] **Step 3: Implement candidate enumeration and validation**

Use the exact version expression:

```ts
const SUPPORTED_VERSION = /^8\.3\.27\.(\d+)$/
```

For every root, inspect only its immediate children. For Windows probe:

```ts
["bin/1cv8.exe", "bin/ibcmd.exe"]
```

For Linux/macOS probe:

```ts
["1cv8", "bin/1cv8", "ibcmd", "bin/ibcmd"]
```

Use the first valid path for each application. A valid Unix file satisfies:

```ts
stat.isFile && (stat.mode & 0o111) !== 0
```

Sort candidates by descending build, native architecture first, root order, then normalized canonical directory. Return canonical application paths and directory.

- [ ] **Step 4: Export the default API**

Implement the zero-argument boundary:

```ts
export async function findPlatform(): Promise<PlatformInstallation | undefined> {
  return findPlatformWithRuntime(nodePlatformRuntime)
}
```

Export only:

```ts
export { findPlatform, type PlatformInstallation } from "./src/platform/findPlatform"
```

- [ ] **Step 5: Run package and workspace verification**

Run:

```bash
pnpm --filter @nkdk/platform test
pnpm --filter @nkdk/platform type-check
pnpm type-check
```

Expected: all commands PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/platform
git commit -m "feat: :sparkles: находить платформу 1С 8.3.27"
```

### Task 4: Full verification for the first plan

**Files:**
- Modify only files required by failures directly caused by this plan.

**Interfaces:**
- Produces a stable `@nkdk/platform` public API containing `findPlatform`.

- [ ] **Step 1: Run the full test suite**

Run:

```bash
pnpm test
```

Expected: every workspace package passes, including `@nkdk/platform`.

- [ ] **Step 2: Run build verification**

Run:

```bash
pnpm build
```

Expected: root TypeScript build succeeds with `@nkdk/platform` included.

- [ ] **Step 3: Commit only necessary verification fixes**

If verification required a code or configuration correction, stage only those files and use:

```bash
git commit -m "fix: :bug: исправить сборку пакета platform"
```

If no correction was needed, do not create an empty commit.
