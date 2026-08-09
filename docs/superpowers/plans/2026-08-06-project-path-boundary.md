# Project Path Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ввести единый переносимый контракт путей NKDK-проекта и устранить абсолютный путь в диагностике отсутствующего объекта.

**Architecture:** Чистый модуль `metadata/project/path.ts` отделяет нативные пути текущей ОС от переносимых `projectPath` с `/`. Существующие границы core переходят на три операции модуля, а MCP использует экспортированную проверку для диагностик и отдельно отвергает абсолютные форматы Windows/POSIX во входных значениях.

**Tech Stack:** TypeScript 7, Node.js 26 `node:path`, Vitest 4, pnpm.

## Global Constraints

- Не добавлять внешнюю библиотеку путей: используется только `node:path`.
- `projectPath` всегда относительный, канонический и использует `/`.
- Абсолютные форматы Windows, UNC, POSIX, URI-схемы, NUL, `.` и `..` во внешнем `projectPath` запрещены.
- Нативные пути проверяются семантикой текущей ОС; символьные ссылки остаются ответственностью операций с `realpath`.
- Виртуальные XML-пути, resourceTopology и пути агента Конфигуратора не мигрируют в этой задаче.
- Существующие XML-фикстуры не изменять.

---

### Task 1: Чистый модуль границы путей проекта

**Files:**
- Create: `packages/core/metadata/project/path.ts`
- Create: `packages/core/metadata/project/path.test.ts`
- Modify: `packages/core/index.ts`

**Interfaces:**
- Consumes: `node:path` (`isAbsolute`, `posix`, `relative`, `resolve`, `sep`, `win32`).
- Produces:

```ts
export interface ProjectPathOptions {
  readonly allowRoot?: boolean
}

export function parseProjectPath(input: string, options?: ProjectPathOptions): string
export function projectPathFromFileSystem(
  projectDir: string,
  filePath: string,
  options?: ProjectPathOptions,
): string
export function resolveProjectPath(
  projectDir: string,
  projectPath: string,
  options?: ProjectPathOptions,
): string
```

- [ ] **Step 1: Write failing contract tests**

Create table-driven tests that assert:

```ts
expect(parseProjectPath("cf\\Справочник\\Товары\\Свойства.yaml"))
  .toBe("cf/Справочник/Товары/Свойства.yaml")
expect(parseProjectPath("..backup/file.yaml")).toBe("..backup/file.yaml")
expect(() => parseProjectPath("../secret.yaml")).toThrow("Путь находится вне NKDK-проекта")
expect(() => parseProjectPath("C:\\secret.yaml")).toThrow("Путь находится вне NKDK-проекта")
expect(() => parseProjectPath("\\\\server\\share\\secret.yaml")).toThrow("Путь находится вне NKDK-проекта")
expect(() => parseProjectPath("/private/secret.yaml")).toThrow("Путь находится вне NKDK-проекта")
expect(() => parseProjectPath("file:///secret.yaml")).toThrow("Путь находится вне NKDK-проекта")
expect(() => parseProjectPath("cf//Свойства.yaml")).toThrow("Некорректный путь NKDK-проекта")
expect(() => parseProjectPath("cf/./Свойства.yaml")).toThrow("Некорректный путь NKDK-проекта")
expect(() => parseProjectPath("cf/\0Свойства.yaml")).toThrow("Некорректный путь NKDK-проекта")
expect(() => parseProjectPath("")).toThrow("Некорректный путь NKDK-проекта")
expect(parseProjectPath("", { allowRoot: true })).toBe("")
```

For native round-trip, create a temporary root and assert:

```ts
const native = join(projectDir, "cf", "Справочник", "Товары", "Свойства.yaml")
const projectPath = projectPathFromFileSystem(projectDir, native)
expect(projectPath).toBe("cf/Справочник/Товары/Свойства.yaml")
expect(resolveProjectPath(projectDir, projectPath)).toBe(resolve(native))
expect(() => projectPathFromFileSystem(projectDir, resolve(projectDir, "..", "secret.yaml")))
  .toThrow("Путь находится вне NKDK-проекта")
```

- [ ] **Step 2: Run the new tests and verify failure**

Run:

```powershell
pnpm --filter @nkdk/core exec vitest run metadata/project/path.test.ts
```

Expected: FAIL because `./path` does not exist.

- [ ] **Step 3: Implement the three pure operations**

Implement `parseProjectPath` by replacing `\` with `/`, rejecting POSIX/Windows absolute forms and `^[a-z][a-z\d+.-]*:`, then validating every segment. Implement `projectPathFromFileSystem` with `relative(resolve(projectDir), resolvedTarget)` and the exact escape predicate:

```ts
relativePath === ".." ||
relativePath.startsWith(`..${sep}`) ||
isAbsolute(relativePath)
```

Convert a successful native relative path with `split(sep).join("/")`. Implement `resolveProjectPath` by parsing first, resolving its `/`-separated segments under the root and repeating the containment assertion as defense in depth.

- [ ] **Step 4: Export the interface and run tests**

Export the three functions and `ProjectPathOptions` from `packages/core/index.ts`, then run:

```powershell
pnpm --filter @nkdk/core exec vitest run metadata/project/path.test.ts
pnpm --filter @nkdk/core run type-check
```

Expected: PASS.

- [ ] **Step 5: Commit the boundary module**

```powershell
git add packages/core/metadata/project/path.ts packages/core/metadata/project/path.test.ts packages/core/index.ts
git commit -m "refactor: ♻️ выделить границу путей проекта"
```

---

### Task 2: Перевод существующих core-границ

**Files:**
- Modify: `packages/core/metadata/project/resources.ts`
- Modify: `packages/core/metadata/project/resources.test.ts`
- Modify: `packages/core/metadata/project/directoryStructure.ts`
- Modify: `packages/core/metadata/project/directoryStructure.test.ts`
- Modify: `packages/core/metadata/validation/projectFileSchema.ts`
- Modify: `packages/core/metadata/validation/projectFileSchema.test.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`

**Interfaces:**
- Consumes: `parseProjectPath`, `projectPathFromFileSystem`, `resolveProjectPath` from Task 1.
- Produces: прежние публичные результаты с единым относительным `filePath`; `assertMetadataProjectPathInside` сохраняет существующее имя и текст ошибки.

- [ ] **Step 1: Add regression tests for consistent containment**

Extend the existing tests so `..backup/Свойства.yaml` is accepted and actual parent traversal is rejected. Add an assertion that `toRootProjectDiagnostic(projectDir, diagnostic)` returns `cf/...` with `/` from a native absolute diagnostic path.

- [ ] **Step 2: Run the focused tests and verify the false-positive failure**

```powershell
pnpm --filter @nkdk/core exec vitest run metadata/project/resources.test.ts metadata/project/directoryStructure.test.ts metadata/validation/projectFileSchema.test.ts metadata/validation/validateProject.test.ts
```

Expected: at least the `..backup` case FAILS because current code uses `startsWith("..")`.

- [ ] **Step 3: Replace local conversions with the shared boundary**

Use `projectPathFromFileSystem` in `assertMetadataProjectPathInside`, `normalizeProjectDirectoryPath`, `normalizeProjectPath` and `toRootProjectDiagnostic`. Preserve caller-specific errors by catching the shared error only where the existing public message differs. Use `{ allowRoot: true }` only in `normalizeProjectDirectoryPath` when the requested directory is the project root.

Remove now-unused imports of `relative`, `sep` and separator helper functions. Do not change resourceTopology pattern handling.

- [ ] **Step 4: Run focused tests and type checking**

```powershell
pnpm --filter @nkdk/core exec vitest run metadata/project/resources.test.ts metadata/project/directoryStructure.test.ts metadata/validation/projectFileSchema.test.ts metadata/validation/validateProject.test.ts
pnpm --filter @nkdk/core run type-check
```

Expected: PASS with unchanged public error messages.

- [ ] **Step 5: Commit the core migration**

```powershell
git add packages/core/metadata/project packages/core/metadata/validation
git commit -m "refactor: ♻️ унифицировать пути проекта в core"
```

---

### Task 3: Исправление диагностики отсутствующего объекта

**Files:**
- Modify: `packages/core/metadata/projectState/dependencyValidation.ts`
- Modify: `packages/core/metadata/projectState/dependencyValidation.test.ts`

**Interfaces:**
- Consumes: `projectPathFromFileSystem(projectDir, filePath)` from Task 1.
- Produces: `Diagnostic.filePath` относительно общего корня проекта, включая `cf/` или `cfe/<Имя>/`.

- [ ] **Step 1: Change the existing expectation to the required contract**

At the missing-object test, replace:

```ts
filePath: "/project/cf/Справочник/НетТакого/Свойства.yaml"
```

with:

```ts
filePath: "cf/Справочник/НетТакого/Свойства.yaml"
```

Add the same assertion for a missing object in `cfe/Продажи` so the component prefix is retained.

- [ ] **Step 2: Run the test and verify the regression**

```powershell
pnpm --filter @nkdk/core exec vitest run metadata/projectState/dependencyValidation.test.ts
```

Expected: FAIL showing the current absolute `/project/...` path.

- [ ] **Step 3: Normalize the contributor result at the producer boundary**

After the object contributor returns `filePath`, convert it before calling `unresolvedProjectReferenceResult`:

```ts
const objectProjectPath = objectFilePath === undefined
  ? undefined
  : projectPathFromFileSystem(params.projectDir, objectFilePath)
```

Pass `objectProjectPath`, not `objectFilePath`, to the unresolved-reference diagnostic. Do not add conditions for metadata kinds or component names.

- [ ] **Step 4: Run projectState and validation tests**

```powershell
pnpm --filter @nkdk/core exec vitest run metadata/projectState/dependencyValidation.test.ts metadata/validation/validateProject.test.ts
pnpm --filter @nkdk/core run type-check
```

Expected: PASS.

- [ ] **Step 5: Commit the bug fix**

```powershell
git add packages/core/metadata/projectState/dependencyValidation.ts packages/core/metadata/projectState/dependencyValidation.test.ts
git commit -m "fix: 🐛 возвращать относительный путь диагностики"
```

---

### Task 4: Согласование защитной границы MCP

**Files:**
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/services/validateProject.ts`
- Modify: `packages/mcp/src/services/validateProject.test.ts`
- Modify: `packages/mcp/src/services/componentResolver.ts`
- Modify: `packages/mcp/src/services/componentResolver.test.ts`

**Interfaces:**
- Consumes: `CoreApi.parseProjectPath(input): string` from Task 1.
- Produces: MCP никогда не принимает абсолютный путь Windows как относительный на macOS/Linux и наоборот.

- [ ] **Step 1: Extend MCP tests**

Add `parseProjectPath` to the hoisted core mock in `validateProject.test.ts` with the same observable contract. Verify that valid backslashes normalize and the existing table of absolute/escaping paths still returns `core_error`.

Extend `componentResolver.test.ts` with explicit foreign formats:

```ts
expect(resolveComponent({ projectDir, componentPath: "C:\\outside\\cf" })).toMatchObject({
  ok: false,
  error: { code: "invalid_arguments" },
})
expect(() => resolveStructurePath(join(projectDir, "cf"), "C:\\outside\\secret.yaml"))
  .toThrow("structurePath должен быть относительным путем")
expect(() => resolveStructurePath(join(projectDir, "cf"), "file:///outside/secret.yaml"))
  .toThrow("structurePath должен быть относительным путем")
```

- [ ] **Step 2: Run MCP tests and verify the foreign-path failure**

```powershell
pnpm --filter @nkdk/mcp exec vitest run src/services/validateProject.test.ts src/services/componentResolver.test.ts
```

Expected: URI-путь FAILS на любой ОС до исправления; проверки Windows-формата фиксируют переносимость для Linux/macOS, а макет validation не собирается до расширения `CoreApi`.

- [ ] **Step 3: Reuse the core parser for diagnostic output**

Add to `CoreApi`:

```ts
parseProjectPath(input: string, options?: { readonly allowRoot?: boolean }): string
```

Replace `visibleProjectPath` implementation with a call to `core.parseProjectPath`. Catch its error only to preserve the public message `Core вернул путь диагностики вне NKDK-проекта`.

- [ ] **Step 4: Reject foreign absolute formats at synchronous MCP input boundaries**

In `componentResolver.ts`, centralize the outer-boundary predicate:

```ts
function isAbsoluteInputPath(input: string): boolean {
  const normalized = input.replaceAll("\\", "/")
  return posix.isAbsolute(normalized) || win32.isAbsolute(input) || /^[a-z][a-z\d+.-]*:/i.test(normalized)
}
```

Use it in `normalizeRelativePath` and `resolveStructurePath`. Keep the native `relative` containment check after resolution as defense in depth.

- [ ] **Step 5: Run MCP tests, type checking and packed build**

```powershell
pnpm --filter @nkdk/mcp exec vitest run src/services/validateProject.test.ts src/services/componentResolver.test.ts
pnpm --filter @nkdk/mcp run type-check
pnpm --filter @nkdk/mcp run build
```

Expected: PASS; the packed server builds with the extended lazy Core API.

- [ ] **Step 6: Commit the MCP boundary migration**

```powershell
git add packages/mcp/src/coreApi.ts packages/mcp/src/services/validateProject.ts packages/mcp/src/services/validateProject.test.ts packages/mcp/src/services/componentResolver.ts packages/mcp/src/services/componentResolver.test.ts
git commit -m "fix: 🛡️ унифицировать проверку путей MCP"
```

---

### Task 5: Полная проверка и реальный проект

**Files:**
- Verify only: `C:/git/sed_nkdk`

**Interfaces:**
- Consumes: completed Tasks 1–4.
- Produces: подтверждённая validation без ошибки пути MCP.

- [ ] **Step 1: Check duplication against the starting commit**

Record the starting commit before implementation and run:

```powershell
pnpm duplicates -- --base 95ec6424bc9002a6a3fb7be545e80fbf521b9904
```

Expected: no new unsupported duplicate blocks.

- [ ] **Step 2: Run the complete repository test suite**

```powershell
pnpm test
```

Expected: all package tests PASS.

- [ ] **Step 3: Run repository type checking**

```powershell
pnpm type-check
```

Expected: PASS.

- [ ] **Step 4: Validate the imported project through the compiled MCP path**

Invoke NKDK validation for `C:/git/sed_nkdk` without modifying its files. Confirm that the result contains ordinary reference diagnostics such as:

```text
cf/ОбщаяФорма/ВыборКонтрагентаКонтактноеЛицо/Свойства.yaml
```

and does not contain:

```text
Core вернул путь диагностики вне NKDK-проекта
```

- [ ] **Step 5: Review the final diff**

```powershell
git status --short
git diff --check
git diff --stat
```

Expected: only planned files plus the approved specification and plan are changed; the user's pre-existing `packages/mcp/README.md` edit remains untouched.
