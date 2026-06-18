# Nested Subsystem Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Включить `Свойства.yaml` вложенных подсистем в полный `validate` и в режим `--file`.

**Architecture:** Изменение остается в слое обнаружения файлов проекта. `projectFiles.ts` добавляет отдельное распознавание пути `Подсистема/<Имя>/Подсистемы/<Имя>/.../Свойства.yaml`, но не включает общий рекурсивный поиск всех `Свойства.yaml` и не добавляет поддержку форм вложенных подсистем.

**Tech Stack:** TypeScript, Vitest, существующие `ValidationProjectFile`, `ValidationProjectSpec`, `validateProject`.

---

## File Structure

- Modify: `packages/core/metadata/validation/projectFiles.ts`
  - Добавить helper для распознавания вложенной подсистемы.
  - Добавить рекурсивный обход только для `Подсистема/**/Подсистемы/*/Свойства.yaml`.
  - Оставить текущую поддержку top-level `Свойства.yaml`, `Форма.yaml` и `Конфигурация.yaml`.
- Modify: `packages/core/metadata/validation/projectFiles.test.ts`
  - Проверить discovery, `--file`-resolution, несколько уровней вложенности, некорректный путь и отсутствие форм.
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
  - Проверить, что вложенный `Свойства.yaml` проходит через JSON Schema и даёт structure-ошибку для лишнего поля.

## Task 1: Project File Tests

**Files:**
- Modify: `packages/core/metadata/validation/projectFiles.test.ts`

- [ ] **Step 1: Write failing discovery and resolve tests**

Add these tests before `it("rejects files outside the project", ...)`:

```ts
  it("discovers and resolves nested subsystem properties", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Подсистема/Администрирование/Свойства.yaml")
    touchProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml")
    touchProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Подсистемы/Интерфейс/Свойства.yaml")

    const files = discoverValidationProjectFiles(projectDir)

    expect(files.map((file) => file.projectPath).sort()).toEqual([
      "Подсистема/Администрирование/Подсистемы/Настройки/Подсистемы/Интерфейс/Свойства.yaml",
      "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml",
      "Подсистема/Администрирование/Свойства.yaml",
    ])

    expect(
      resolveValidationProjectFile(
        projectDir,
        "Подсистема/Администрирование/Подсистемы/Настройки/Подсистемы/Интерфейс/Свойства.yaml",
      ),
    ).toMatchObject({
      projectPath: "Подсистема/Администрирование/Подсистемы/Настройки/Подсистемы/Интерфейс/Свойства.yaml",
      kind: "properties",
      owner: {
        dir: "Подсистема",
        name: "Интерфейс",
        spec: expect.objectContaining({ dir: "Подсистема" }),
      },
    })
  })
```

- [ ] **Step 2: Write failing boundary tests**

Add this test after the nested subsystem discovery test:

```ts
  it("does not resolve malformed nested subsystem paths or nested subsystem forms", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Свойства.yaml")
    touchProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Формы/Форма/Форма.yaml")

    expect(
      resolveValidationProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Свойства.yaml"),
    ).toBeUndefined()
    expect(
      resolveValidationProjectFile(
        projectDir,
        "Подсистема/Администрирование/Подсистемы/Настройки/Формы/Форма/Форма.yaml",
      ),
    ).toBeUndefined()
    expect(discoverValidationProjectFiles(projectDir)).toEqual([])
  })
```

- [ ] **Step 3: Run focused tests and verify failure**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/projectFiles.test.ts
```

Expected: tests from steps 1 and 2 fail because nested subsystem paths are not discovered or resolved.

- [ ] **Step 4: Commit failing tests**

```bash
git add packages/core/metadata/validation/projectFiles.test.ts
git commit -m "test: :white_check_mark: проверить вложенные подсистемы в validate"
```

## Task 2: Project File Discovery Implementation

**Files:**
- Modify: `packages/core/metadata/validation/projectFiles.ts`

- [ ] **Step 1: Add constants near imports**

Add these constants below the imports:

```ts
const SUBSYSTEM_DIR = "Подсистема"
const CHILD_SUBSYSTEMS_DIR = "Подсистемы"
const PROPERTIES_FILE = "Свойства.yaml"
const FORM_FILE = "Форма.yaml"
```

- [ ] **Step 2: Replace hard-coded file names with constants**

In `discoverValidationProjectFiles()`, replace:

```ts
const propertiesPath = join(kindDir, ownerEntry.name, "Свойства.yaml")
```

with:

```ts
const propertiesPath = join(kindDir, ownerEntry.name, PROPERTIES_FILE)
```

Replace:

```ts
const formPath = join(formsDir, formEntry.name, "Форма.yaml")
```

with:

```ts
const formPath = join(formsDir, formEntry.name, FORM_FILE)
```

In `matchPropertiesPath()`, replace `"Свойства.yaml"` with `PROPERTIES_FILE`.

In `matchFormPath()`, replace `"Форма.yaml"` with `FORM_FILE`.

- [ ] **Step 3: Add nested subsystem discovery after the main spec loop**

Add this call just before the final `return files.sort(...)` in `discoverValidationProjectFiles()`:

```ts
  collectNestedSubsystemPropertyFiles(projectRoot, files)
```

Add these helper functions above `collectExistingProjectFile()`:

```ts
function collectNestedSubsystemPropertyFiles(projectRoot: string, files: ValidationProjectFile[]): void {
  const subsystemRoot = join(projectRoot, SUBSYSTEM_DIR)
  if (!isExistingDirectory(subsystemRoot)) return

  collectNestedSubsystemPropertyFilesFromDir(projectRoot, subsystemRoot, files)
}

function collectNestedSubsystemPropertyFilesFromDir(
  projectRoot: string,
  currentDir: string,
  files: ValidationProjectFile[],
): void {
  const childSubsystemsDir = join(currentDir, CHILD_SUBSYSTEMS_DIR)
  if (!isExistingDirectory(childSubsystemsDir)) return

  for (const childEntry of readdirSync(childSubsystemsDir, { withFileTypes: true })) {
    if (!childEntry.isDirectory()) continue

    const childDir = join(childSubsystemsDir, childEntry.name)
    const propertiesFile = collectExistingProjectFile(projectRoot, join(childDir, PROPERTIES_FILE))
    if (propertiesFile) files.push(propertiesFile)

    collectNestedSubsystemPropertyFilesFromDir(projectRoot, childDir, files)
  }
}
```

- [ ] **Step 4: Add nested subsystem path resolution**

In `resolveValidationProjectFile()`, add this block after `const parts = projectPath.split("/")` and before `const propertiesOwner = matchPropertiesPath(parts)`:

```ts
  const nestedSubsystemOwner = matchNestedSubsystemPropertiesPath(parts)
  if (nestedSubsystemOwner) {
    return {
      absolutePath,
      projectPath,
      kind: "properties",
      owner: nestedSubsystemOwner,
    }
  }
```

Add this helper below `matchPropertiesPath()`:

```ts
function matchNestedSubsystemPropertiesPath(parts: string[]): ValidationProjectFile["owner"] | undefined {
  if (parts.length < 5 || parts[0] !== SUBSYSTEM_DIR || parts.at(-1) !== PROPERTIES_FILE) return undefined
  if ((parts.length - 3) % 2 !== 0) return undefined

  for (let index = 2; index < parts.length - 2; index += 2) {
    if (parts[index] !== CHILD_SUBSYSTEMS_DIR || !parts[index + 1]) return undefined
  }

  return createOwner(SUBSYSTEM_DIR, parts.at(-2))
}
```

- [ ] **Step 5: Run focused tests and verify pass**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/projectFiles.test.ts
```

Expected: `projectFiles.test.ts` passes.

- [ ] **Step 6: Commit implementation**

```bash
git add packages/core/metadata/validation/projectFiles.ts
git commit -m "feat: :sparkles: находить вложенные подсистемы в validate"
```

## Task 3: Validation Behavior Test

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Add validation test**

Add this test after `it("validates every top-level metadata object with YAML directory", ...)`:

```ts
  it("validates nested subsystem properties with schema rules", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Подсистема/Администрирование/Свойства.yaml", "{}\n")
    writeProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml", [
      "ЛишнееПоле: true",
    ])

    const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

    expect(diagnostics).toEqual([
      expect.objectContaining({
        filePath: join(
          projectDir,
          "Подсистема",
          "Администрирование",
          "Подсистемы",
          "Настройки",
          "Свойства.yaml",
        ),
        source: "structure",
        severity: "error",
        path: "/ЛишнееПоле",
      }),
    ])
  })
```

- [ ] **Step 2: Run focused validation tests**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/validateProject.test.ts
```

Expected: `validateProject.test.ts` passes.

- [ ] **Step 3: Commit behavior test**

```bash
git add packages/core/metadata/validation/validateProject.test.ts
git commit -m "test: :white_check_mark: проверить валидацию вложенных подсистем"
```

## Task 4: Full Verification

**Files:**
- No source changes.

- [ ] **Step 1: Run focused validation suite**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/projectFiles.test.ts metadata/validation/validateProject.test.ts
```

Expected: both test files pass.

- [ ] **Step 2: Run full test suite**

Run from the worktree root:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 3: Re-run ERP YAML validation**

Run:

```bash
pnpm -s --dir packages/cli exec tsx src/cli.ts validate /home/nikita/git/new-test-yaml
```

Expected: command may still exit with validation errors from real ERP YAML, but the summary should be produced and the discovered-file coverage check in step 4 must show no unresolved nested subsystem `Свойства.yaml`.

- [ ] **Step 4: Check that nested subsystem properties are no longer missed**

Run:

```bash
pnpm -s --dir packages/core exec tsx -e "import { readdirSync } from 'fs'; import { join, relative } from 'path'; import { resolveValidationProjectFile } from './metadata/validation/projectFiles'; const root='/home/nikita/git/new-test-yaml'; const candidates:string[]=[]; function walk(dir:string){ for (const e of readdirSync(dir,{withFileTypes:true})) { const p=join(dir,e.name); if(e.isDirectory()) walk(p); else if(['Свойства.yaml','Форма.yaml','Конфигурация.yaml'].includes(e.name)) candidates.push(relative(root,p).split('/').join('/')); }} walk(root); const unresolved=candidates.filter(p=>!resolveValidationProjectFile(root,p)); const nestedSubsystemProperties=unresolved.filter(p=>p.startsWith('Подсистема/') && p.includes('/Подсистемы/') && p.endsWith('/Свойства.yaml')); console.log(JSON.stringify({ unresolved: unresolved.length, nestedSubsystemProperties: nestedSubsystemProperties.length }, null, 2));"
```

Expected:

```json
{
  "unresolved": 0,
  "nestedSubsystemProperties": 0
}
```

If `unresolved` is not zero but `nestedSubsystemProperties` is zero, inspect the remaining paths before changing code; they may be non-YAML service structures outside this task.

- [ ] **Step 5: Final status check**

Run:

```bash
git status --short
```

Expected: no uncommitted changes.
