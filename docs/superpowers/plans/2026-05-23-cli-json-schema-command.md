# CLI JSON Schema Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `nkdk schema <file> [--project <yaml-dir>]`, returning JSON Schema for a YAML project file.

**Architecture:** Core owns schema selection from project file paths and returns a TypeBox `TSchema`. CLI stays thin: parse `commander` arguments, call core, print pretty JSON to stdout, and let the shared `run()` wrapper handle errors. Path parsing is based on normalized project-style path segments, not file contents.

**Tech Stack:** TypeScript, TypeBox `TSchema`, Vitest, `commander`, existing `@nakidka/core` public exports.

---

## File Structure

- Create `packages/core/metadata/validation/projectFileSchema.ts`
  - Responsibility: resolve a file path relative to an optional YAML project root, classify supported project YAML paths, and return the matching JSON Schema.
- Create `packages/core/metadata/validation/projectFileSchema.test.ts`
  - Responsibility: unit-test path resolution, supported schemas, and error messages.
- Modify `packages/core/index.ts`
  - Responsibility: export the new public helper and its error class/types for CLI use.
- Create `packages/cli/src/commands/schema.ts`
  - Responsibility: CLI command handler that builds the current configuration context, calls core, and writes pretty JSON to stdout.
- Create `packages/cli/src/commands/schema.test.ts`
  - Responsibility: test stdout/stderr-safe command behavior through the handler.
- Modify `packages/cli/src/cli.ts`
  - Responsibility: register `schema` command with `<file>` and `--project <yaml-dir>`.

## Task 1: Core Path-To-Schema Helper

**Files:**
- Create: `packages/core/metadata/validation/projectFileSchema.ts`
- Test: `packages/core/metadata/validation/projectFileSchema.test.ts`
- Modify: `packages/core/index.ts`

- [ ] **Step 1: Write failing core tests**

Create `packages/core/metadata/validation/projectFileSchema.test.ts`:

```ts
import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { exportJSONSchemaForProjectFile, ProjectFileSchemaError } from "./projectFileSchema"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("exportJSONSchemaForProjectFile", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  const createProject = (): string => {
    const projectDir = mkdtempSync(join(tmpdir(), "nakidka-schema-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  it("exports catalog schema for absolute properties path", () => {
    const projectDir = createProject()
    const filePath = join(projectDir, "Справочник", "Товары", "Свойства.yaml")

    const schema = exportJSONSchemaForProjectFile({ context, filePath })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Синоним: expect.any(Object),
      }),
    })
  })

  it("exports document schema for project-relative properties path", () => {
    const projectDir = createProject()

    const schema = exportJSONSchemaForProjectFile({
      context,
      projectDir,
      filePath: "Документ/Заказ/Свойства.yaml",
    })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        СтандартныеРеквизиты: expect.any(Object),
      }),
    })
  })

  it("exports client form schema for form YAML path", () => {
    const schema = exportJSONSchemaForProjectFile({
      context,
      filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
    })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Реквизиты: expect.any(Object),
        Элементы: expect.any(Object),
      }),
    })
  })

  it("rejects non-yaml files", () => {
    expect(() =>
      exportJSONSchemaForProjectFile({
        context,
        filePath: "Справочник/Товары/МодульМенеджера.bsl",
      }),
    ).toThrow(new ProjectFileSchemaError("JSON Schema поддерживается только для .yaml файлов"))
  })

  it("rejects unsupported project paths with expected patterns", () => {
    expect(() =>
      exportJSONSchemaForProjectFile({
        context,
        filePath: "Справочник/Товары/Команды/Команда.yaml",
      }),
    ).toThrow(/Ожидались пути вида/)
  })

  it("rejects a file outside explicit project directory", () => {
    const projectDir = createProject()
    const outsidePath = resolve(projectDir, "..", "outside", "Справочник", "Товары", "Свойства.yaml")

    expect(() =>
      exportJSONSchemaForProjectFile({
        context,
        projectDir,
        filePath: outsidePath,
      }),
    ).toThrow(new ProjectFileSchemaError("Файл находится вне указанного YAML-проекта"))
  })
})
```

- [ ] **Step 2: Run core test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectFileSchema.test.ts --no-isolate
```

Expected: FAIL because `./projectFileSchema` does not exist.

- [ ] **Step 3: Implement the core helper**

Create `packages/core/metadata/validation/projectFileSchema.ts`:

```ts
import { TSchema } from "@sinclair/typebox"
import { isAbsolute, relative, resolve, sep } from "path"
import { MetadataAccumulationRegisterRules } from "~/metadata/appliedObjects/metadataAccumulationRegister/rules"
import { exportMetadataCatalogToJSONSchema } from "~/metadata/appliedObjects/metadataCatalog/toJSONSchema"
import { MetadataDataProcessorRules } from "~/metadata/appliedObjects/metadataDataProcessor/rules"
import { exportMetadataDocumentToJSONSchema } from "~/metadata/appliedObjects/metadataDocument/toJSONSchema"
import { MetadataDocumentJournalRules } from "~/metadata/appliedObjects/metadataDocumentJournal/rules"
import { exportMetadataEnumerationToJSONSchema } from "~/metadata/appliedObjects/metadataEnumeration/toJSONSchema"
import { MetadataExchangePlanRules } from "~/metadata/appliedObjects/metadataExchangePlan/rules"
import { MetadataHTTPServiceRules } from "~/metadata/appliedObjects/metadataHTTPService/rules"
import { MetadataInformationRegisterRules } from "~/metadata/appliedObjects/metadataInformationRegister/rules"
import { ConfigurationContext } from "~/metadata/context/types"
import { createEmptyClientApplicationForm } from "~/metadata/forms/clientApplicationForm/createEmpty"
import { exportClientApplicationFormToJSONSchema } from "~/metadata/forms/clientApplicationForm/toJSONSchema"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"

export interface ExportJSONSchemaForProjectFileParams {
  context: ConfigurationContext
  filePath: string
  projectDir?: string
}

export class ProjectFileSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProjectFileSchemaError"
  }
}

const expectedPatterns =
  "Ожидались пути вида <Вид>/<Имя>/Свойства.yaml или <Вид>/<Имя>/Формы/<Форма>/Форма.yaml"

const metadataSchemaByDir = {
  Справочник: (context: ConfigurationContext) => exportMetadataCatalogToJSONSchema({ context }),
  Документ: (context: ConfigurationContext) => exportMetadataDocumentToJSONSchema({ context }),
  Перечисление: (context: ConfigurationContext) => exportMetadataEnumerationToJSONSchema({ context }),
  Обработка: (context: ConfigurationContext) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataDataProcessorRules }),
  ЖурналДокументов: (context: ConfigurationContext) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataDocumentJournalRules }),
  HTTPСервис: (context: ConfigurationContext) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataHTTPServiceRules }),
  РегистрСведений: (context: ConfigurationContext) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataInformationRegisterRules }),
  РегистрНакопления: (context: ConfigurationContext) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataAccumulationRegisterRules }),
  ПланОбмена: (context: ConfigurationContext) =>
    exportMetadataItemToJSONSchema({ context, rule: MetadataExchangePlanRules }),
} satisfies Record<string, (context: ConfigurationContext) => TSchema>

export function exportJSONSchemaForProjectFile(params: ExportJSONSchemaForProjectFileParams): TSchema {
  const { context } = params
  const normalized = normalizeProjectPath(params)
  const parts = normalized.split("/")

  if (!normalized.toLowerCase().endsWith(".yaml")) {
    throw new ProjectFileSchemaError("JSON Schema поддерживается только для .yaml файлов")
  }

  if (isFormPath(parts)) {
    return exportClientApplicationFormToJSONSchema({
      context,
      value: createEmptyClientApplicationForm(),
    })
  }

  const propertiesMatch = findPropertiesPath(parts)
  if (propertiesMatch) {
    return propertiesMatch.exportSchema(context)
  }

  throw new ProjectFileSchemaError(expectedPatterns)
}

function normalizeProjectPath(params: Pick<ExportJSONSchemaForProjectFileParams, "filePath" | "projectDir">): string {
  const { filePath, projectDir } = params
  const fullPath = projectDir && !isAbsolute(filePath) ? resolve(projectDir, filePath) : resolve(filePath)

  if (projectDir) {
    const projectPath = resolve(projectDir)
    const relativePath = relative(projectPath, fullPath)
    if (relativePath === "" || relativePath.startsWith("..") || isAbsolute(relativePath)) {
      throw new ProjectFileSchemaError("Файл находится вне указанного YAML-проекта")
    }
    return toProjectSeparators(relativePath)
  }

  return toProjectSeparators(filePath)
}

function toProjectSeparators(filePath: string): string {
  return filePath.split(sep).join("/")
}

function isFormPath(parts: string[]): boolean {
  const ownerDir = parts[parts.length - 5]

  return parts.length >= 5 &&
    parts[parts.length - 3] === "Формы" &&
    parts[parts.length - 2] !== "" &&
    parts[parts.length - 1] === "Форма.yaml" &&
    ownerDir !== undefined &&
    hasMetadataSchema(ownerDir)
}

function findPropertiesPath(parts: string[]): { exportSchema: (context: ConfigurationContext) => TSchema } | undefined {
  if (parts.length < 3 || parts[parts.length - 1] !== "Свойства.yaml") return undefined

  const objectDir = parts[parts.length - 3]
  if (!objectDir || !hasMetadataSchema(objectDir)) return undefined

  const exportSchema = metadataSchemaByDir[objectDir]

  return { exportSchema }
}

function hasMetadataSchema(dir: string): dir is keyof typeof metadataSchemaByDir {
  return Object.hasOwn(metadataSchemaByDir, dir)
}
```

- [ ] **Step 4: Export the helper from core**

Modify `packages/core/index.ts` by adding near validation exports:

```ts
export {
  exportJSONSchemaForProjectFile,
  ProjectFileSchemaError,
  type ExportJSONSchemaForProjectFileParams,
} from "./metadata/validation/projectFileSchema"
```

- [ ] **Step 5: Run core test and fix type issues**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectFileSchema.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Commit core helper**

Run:

```bash
git add packages/core/metadata/validation/projectFileSchema.ts packages/core/metadata/validation/projectFileSchema.test.ts packages/core/index.ts
git commit -m "feat: :sparkles: добавить выбор JSON Schema по YAML-файлу"
```

## Task 2: CLI Command Handler

**Files:**
- Create: `packages/cli/src/commands/schema.ts`
- Test: `packages/cli/src/commands/schema.test.ts`
- Modify: `packages/cli/src/cli.ts`

- [ ] **Step 1: Write failing CLI handler tests**

Create `packages/cli/src/commands/schema.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest"
import { printJSONSchema } from "./schema"

describe("schema command", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("prints pretty JSON schema to stdout", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printJSONSchema("Справочник/Товары/Свойства.yaml", {})

    expect(stdout).toHaveBeenCalledOnce()
    const text = String(stdout.mock.calls[0]?.[0])
    expect(() => JSON.parse(text)).not.toThrow()
    expect(text).toContain("\n  ")
    expect(text).toContain("\"Синоним\"")
  })

  it("resolves relative file from explicit project", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await printJSONSchema("Документ/Заказ/Свойства.yaml", { project: process.cwd() })

    const text = String(stdout.mock.calls[0]?.[0])
    expect(JSON.parse(text).properties).toHaveProperty("СтандартныеРеквизиты")
  })

  it("does not write stdout when schema lookup fails", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await expect(printJSONSchema("Справочник/Товары/Команды/Команда.yaml", {})).rejects.toThrow(
      /Ожидались пути вида/,
    )

    expect(stdout).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run CLI test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/cli exec vitest run src/commands/schema.test.ts --no-isolate
```

Expected: FAIL because `./schema` does not exist.

- [ ] **Step 3: Implement CLI command handler**

Create `packages/cli/src/commands/schema.ts`:

```ts
import { exportJSONSchemaForProjectFile } from "@nakidka/core"

export interface SchemaCommandOptions {
  project?: string
}

export const printJSONSchema = async (filePath: string, options: SchemaCommandOptions): Promise<void> => {
  const schema = exportJSONSchemaForProjectFile({
    context: {
      defaultLanguage: "ru",
      version: "2.20",
    },
    filePath,
    projectDir: options.project,
  })

  process.stdout.write(`${JSON.stringify(schema, null, 2)}\n`)
}
```

- [ ] **Step 4: Register command in CLI**

Modify `packages/cli/src/cli.ts`:

```ts
import { printJSONSchema } from "./commands/schema"
```

Add before `program.parse()`:

```ts
program
  .command("schema")
  .description("Показать JSON Schema для YAML-файла проекта")
  .argument("<file>", "путь к YAML-файлу проекта")
  .option("--project <yamlDir>", "путь к корню YAML-проекта")
  .action((file: string, opts: { project?: string }) => {
    run(() => printJSONSchema(file, opts))
  })
```

- [ ] **Step 5: Run CLI tests**

Run:

```bash
pnpm --filter @nakidka/cli exec vitest run src/commands/schema.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Commit CLI command**

Run:

```bash
git add packages/cli/src/commands/schema.ts packages/cli/src/commands/schema.test.ts packages/cli/src/cli.ts
git commit -m "feat: :sparkles: добавить CLI-команду schema"
```

## Task 3: Focused Integration And Type Checks

**Files:**
- Modify only if a previous task reveals a compile or runtime issue:
  - `packages/core/metadata/validation/projectFileSchema.ts`
  - `packages/cli/src/commands/schema.ts`
  - `packages/cli/src/cli.ts`

- [ ] **Step 1: Run focused core and CLI tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectFileSchema.test.ts --no-isolate
pnpm --filter @nakidka/cli exec vitest run src/commands/schema.test.ts --no-isolate
```

Expected: both commands PASS.

- [ ] **Step 2: Run type checks for touched packages**

Run:

```bash
pnpm --filter @nakidka/core run type-check
pnpm --filter @nakidka/cli run build
```

Expected: both commands exit with code 0.

- [ ] **Step 3: Run command manually through package dev script**

Run:

```bash
pnpm --filter @nakidka/cli dev schema --project packages/core/tests/fixtures/sync/syncConfiguration/yaml Справочник/Контрагенты/Свойства.yaml
```

Expected: stdout is JSON, starts with `{`, contains `"Синоним"`, and stderr is empty.

- [ ] **Step 4: Run full project tests before finishing**

From the worktree root, run the project-required Langium generation first:

```bash
pnpm --filter nkdk-language langium:generate
pnpm test
```

Expected: all package tests PASS.

- [ ] **Step 5: Commit verification fixes if needed**

If Steps 1-4 required code fixes, commit them:

```bash
git add packages/core/metadata/validation/projectFileSchema.ts packages/core/metadata/validation/projectFileSchema.test.ts packages/core/index.ts packages/cli/src/commands/schema.ts packages/cli/src/commands/schema.test.ts packages/cli/src/cli.ts
git commit -m "fix: :bug: стабилизировать команду schema"
```

If no fixes were needed, do not create an empty commit.
