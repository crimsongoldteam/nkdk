# Validate All Metadata Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `nkdk validate` validates every top-level metadata item from `TopLevelMetadataItemRules` and the root `Конфигурация.yaml`.

**Architecture:** Use `TopLevelMetadataItemRules` as the source of truth for validation specs, with explicit overrides only for objects that already have special YAML schema/import behavior. Add a separate root-file path for `Конфигурация.yaml`, then run the same schema, import, unique-name, and `metadataTarget` validation pipeline as properties files.

**Tech Stack:** TypeScript, Vitest, TypeBox, existing metadata orchestration rules, pnpm.

---

## File Structure

- Modify `packages/core/metadata/validation/projectSpecs.ts`
  - Build `validationProjectSpecs` from `TopLevelMetadataItemRules`.
  - Keep special behavior for `Справочник`, `Документ`, `Перечисление`.
  - Export `configurationValidationProjectSpec`.
- Modify `packages/core/metadata/validation/projectFiles.ts`
  - Discover and resolve `Конфигурация.yaml`.
  - Return a new `ValidationProjectFile` kind for root configuration.
- Modify `packages/core/metadata/validation/validateProject.ts`
  - Update unsupported-file help text.
  - Route root configuration through the properties validation pipeline.
  - Pass the correct object name `Конфигурация` to importer.
- Modify `packages/core/metadata/validation/projectFiles.test.ts`
  - Add coverage that all top-level `itemTypePrefix` directories are discoverable.
  - Add coverage for `Конфигурация.yaml`.
- Modify `packages/core/metadata/validation/validateProject.test.ts`
  - Add coverage that every top-level object is actually validated.
  - Add coverage for invalid `ОсновнойЯзык` in `Конфигурация.yaml`.
- Modify `packages/cli/src/commands/validate.test.ts`
  - Add public CLI coverage for `--file Конфигурация.yaml`.
  - Update unsupported-file message expectations if needed.

---

### Task 1: Make TopLevelMetadataItemRules Drive Validation Specs

**Files:**
- Modify: `packages/core/metadata/validation/projectSpecs.ts`
- Test: `packages/core/metadata/validation/projectFiles.test.ts`

- [ ] **Step 1: Write failing coverage for full top-level spec coverage**

In `packages/core/metadata/validation/projectFiles.test.ts`, add imports:

```ts
import { TopLevelMetadataItemRules } from "~/metadata/appliedObjects/configuration/topLevelRules"
import { validationProjectSpecs } from "./projectSpecs"
```

Add this test inside `describe("validation project files", () => { ... })`:

```ts
  it("has validation specs for every top-level metadata object with YAML directory", () => {
    const topLevelDirs = TopLevelMetadataItemRules.flatMap((rule) =>
      typeof rule.itemTypePrefix === "string" ? [rule.itemTypePrefix] : [],
    ).sort((left, right) => left.localeCompare(right, "ru"))

    const validationDirs = validationProjectSpecs
      .map((spec) => spec.dir)
      .sort((left, right) => left.localeCompare(right, "ru"))

    expect(validationDirs).toEqual(topLevelDirs)
  })
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/projectFiles.test.ts
```

Expected: fail because `validationProjectSpecs` is missing many directories such as `Язык` and `Подсистема`.

- [ ] **Step 3: Replace the manual validationProjectSpecs list with a generated list**

In `packages/core/metadata/validation/projectSpecs.ts`, add imports:

```ts
import { MetadataConfigurationRules } from "~/metadata/appliedObjects/configuration/rules"
import { TopLevelMetadataItemRules } from "~/metadata/appliedObjects/configuration/topLevelRules"
```

Replace the current manual `validationProjectSpecs` array with override-based generation:

```ts
type ValidationProjectSpecOverride = Partial<Pick<ValidationProjectSpec, "kind" | "exportSchema" | "importModel">>

const validationProjectSpecOverrides = new Map<string, ValidationProjectSpecOverride>([
  [
    "Справочник",
    {
      kind: "catalog",
      exportSchema: createSchemaExporter(exportMetadataCatalogToJSONSchema),
      importModel: ({ context, parsed, name }) => importMetadataCatalogFromYAML(context, parsed.data, name),
    },
  ],
  [
    "Документ",
    {
      kind: "document",
      exportSchema: createSchemaExporter(exportMetadataDocumentToJSONSchema),
    },
  ],
  [
    "Перечисление",
    {
      kind: "enumeration",
      exportSchema: createSchemaExporter(exportMetadataEnumerationToJSONSchema),
      importModel: ({ context, parsed, name }) => importMetadataEnumerationFromYAML(context, parsed.data, name),
    },
  ],
])

export const validationProjectSpecs: readonly ValidationProjectSpec[] = TopLevelMetadataItemRules.flatMap((rule) => {
  const dir = rule.itemTypePrefix
  if (typeof dir !== "string") return []

  const override = validationProjectSpecOverrides.get(dir)
  return [
    {
      kind: override?.kind ?? rule.itemType,
      dir,
      rule,
      exportSchema: override?.exportSchema ?? createMetadataItemSchemaExporter(rule),
      importModel: override?.importModel ?? genericImportModel(rule),
    },
  ]
})

export const configurationValidationProjectSpec: ValidationProjectSpec = {
  kind: "configuration",
  dir: "",
  rule: MetadataConfigurationRules,
  exportSchema: createMetadataItemSchemaExporter(MetadataConfigurationRules),
  importModel: genericImportModel(MetadataConfigurationRules),
}
```

Remove now-unused direct imports for rules that were only used in the manual array.

- [ ] **Step 4: Run the top-level spec coverage test**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/projectFiles.test.ts
```

Expected: the new top-level spec coverage passes. Other tests in the file may still fail until Task 2 updates discovery expectations.

- [ ] **Step 5: Commit Task 1**

```bash
git add packages/core/metadata/validation/projectSpecs.ts packages/core/metadata/validation/projectFiles.test.ts
git commit -m "feat: :sparkles: строить specs валидации из top-level rules"
```

---

### Task 2: Discover All Top-Level Properties and Configuration Root File

**Files:**
- Modify: `packages/core/metadata/validation/projectFiles.ts`
- Test: `packages/core/metadata/validation/projectFiles.test.ts`

- [ ] **Step 1: Replace narrow discovery expectations with generated ones**

In `packages/core/metadata/validation/projectFiles.test.ts`, replace the test `"discovers properties for owner kinds with existing metadata rules"` with:

```ts
  it("discovers properties for every top-level metadata object with YAML directory", () => {
    const projectDir = createProject()
    const dirs = TopLevelMetadataItemRules.flatMap((rule) =>
      typeof rule.itemTypePrefix === "string" ? [rule.itemTypePrefix] : [],
    )

    for (const dir of dirs) {
      touchProjectFile(projectDir, `${dir}/Тест/Свойства.yaml`)
    }

    expect(discoverValidationProjectFiles(projectDir).map((file) => file.projectPath)).toEqual(
      dirs
        .map((dir) => `${dir}/Тест/Свойства.yaml`)
        .sort((left, right) => left.localeCompare(right, "ru")),
    )
  })
```

Update `"discovers supported properties and form YAML files"` so `Подсистема/Продажи/Свойства.yaml` is expected, not ignored:

```ts
    expect(files.map((file) => file.projectPath).sort()).toEqual([
      "Документ/Заказ/Свойства.yaml",
      "Документ/Заказ/Формы/ФормаДокумента/Форма.yaml",
      "Подсистема/Продажи/Свойства.yaml",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
    ])
```

Update `"returns undefined for unsupported YAML files inside the project"` to remove `Подсистема/Продажи/Свойства.yaml` as an unsupported case:

```ts
  it("returns undefined for unsupported YAML files inside the project", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml")

    expect(resolveValidationProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml")).toBeUndefined()
    expect(discoverValidationProjectFiles(projectDir)).toEqual([])
  })
```

Add root configuration coverage:

```ts
  it("discovers and resolves the root configuration YAML file", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Конфигурация.yaml")

    expect(discoverValidationProjectFiles(projectDir)).toEqual([
      expect.objectContaining({
        projectPath: "Конфигурация.yaml",
        kind: "configuration",
        owner: expect.objectContaining({
          dir: "",
          name: "Конфигурация",
          spec: expect.objectContaining({ kind: "configuration" }),
        }),
      }),
    ])

    expect(resolveValidationProjectFile(projectDir, "Конфигурация.yaml")).toMatchObject({
      absolutePath: join(projectDir, "Конфигурация.yaml"),
      projectPath: "Конфигурация.yaml",
      kind: "configuration",
      owner: {
        dir: "",
        name: "Конфигурация",
        spec: expect.objectContaining({ kind: "configuration" }),
      },
    })
  })
```

- [ ] **Step 2: Run project file tests and verify failures**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/projectFiles.test.ts
```

Expected: failures for missing `configuration` kind and missing root discovery.

- [ ] **Step 3: Add configuration file support to projectFiles.ts**

In `packages/core/metadata/validation/projectFiles.ts`, import:

```ts
import { CONFIGURATION_YAML_FILE } from "~/metadata/appliedObjects/configuration/rootIO"
import { configurationValidationProjectSpec } from "./projectSpecs"
```

Change the `ValidationProjectFile["kind"]` union to include configuration:

```ts
  kind: "configuration" | "properties" | "form"
```

At the start of `discoverValidationProjectFiles`, after `const files: ValidationProjectFile[] = []`, collect the root file:

```ts
  const configurationPath = join(projectRoot, CONFIGURATION_YAML_FILE)
  const configurationFile = collectExistingProjectFile(projectRoot, configurationPath)
  if (configurationFile) files.push(configurationFile)
```

In `resolveValidationProjectFile`, before splitting `projectPath`, handle root configuration:

```ts
  if (projectPath === CONFIGURATION_YAML_FILE) {
    return {
      absolutePath,
      projectPath,
      kind: "configuration",
      owner: {
        dir: "",
        name: "Конфигурация",
        spec: configurationValidationProjectSpec,
      },
    }
  }
```

- [ ] **Step 4: Run project file tests**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/projectFiles.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit Task 2**

```bash
git add packages/core/metadata/validation/projectFiles.ts packages/core/metadata/validation/projectFiles.test.ts
git commit -m "feat: :sparkles: находить все YAML-файлы metadata"
```

---

### Task 3: Validate Configuration.yaml and Every Top-Level Object

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Add validation tests for all top-level objects and configuration references**

In `packages/core/metadata/validation/validateProject.test.ts`, add import:

```ts
import { TopLevelMetadataItemRules } from "~/metadata/appliedObjects/configuration/topLevelRules"
```

Add helper near `writeProjectFile`:

```ts
function topLevelYamlDirs(): string[] {
  return TopLevelMetadataItemRules.flatMap((rule) =>
    typeof rule.itemTypePrefix === "string" ? [rule.itemTypePrefix] : [],
  )
}
```

Add tests:

```ts
  it("validates every top-level metadata object with YAML directory", () => {
    const projectDir = createProject()

    for (const dir of topLevelYamlDirs()) {
      writeProjectFile(projectDir, `${dir}/Тест/Свойства.yaml`, "{}\n")
    }

    const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

    expect(diagnostics).toEqual([])
  })

  it("validates the root configuration YAML file", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", [
      "Имя: Конфигурация",
      "ОсновнойЯзык: Язык.НеСуществует",
    ])

    const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Конфигурация.yaml"),
          source: "reference",
          severity: "error",
          message: 'Не найден объект "Язык.НеСуществует"',
        }),
      ]),
    )
  })

  it("validates a single root configuration file", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", [
      "Имя: Конфигурация",
      "ОсновнойЯзык: Язык.НеСуществует",
    ])
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      'НесуществующееПоле: "лишнее поле"',
    ])

    const diagnostics = validateProject({
      projectDir,
      filePath: "Конфигурация.yaml",
      context: mockContext,
    }).diagnostics

    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toMatchObject({
      filePath: join(projectDir, "Конфигурация.yaml"),
      message: 'Не найден объект "Язык.НеСуществует"',
    })
  })
```

- [ ] **Step 2: Run validateProject tests and verify failures**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/validateProject.test.ts
```

Expected: configuration validation fails until `validateProject.ts` routes `configuration` files.

- [ ] **Step 3: Update validateProject.ts for configuration files**

In `packages/core/metadata/validation/validateProject.ts`, update `expectedPatterns`:

```ts
const expectedPatterns =
  "Ожидались Конфигурация.yaml или пути вида <Вид>/<Имя>/Свойства.yaml и <Вид>/<Имя>/Формы/<Форма>/Форма.yaml"
```

Keep `validateProjectFile` routing as:

```ts
  if (params.file.kind === "form") {
    return validateProjectForm(params)
  }

  return validateProjectProperties(params)
```

This lets `configuration` use the same path as `properties`.

In `validateProjectProperties`, compute owner only for real object directories:

```ts
  const ownerRoot = rootFromYAML[params.file.owner.dir]
  const owner = ownerRoot ? { root: ownerRoot, objectName: params.file.owner.name } : undefined
```

This code already has the right shape; verify no assumption requires `kind === "properties"`.

- [ ] **Step 4: Run validateProject tests**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/validateProject.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit Task 3**

```bash
git add packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/validateProject.test.ts
git commit -m "feat: :sparkles: валидировать корневую конфигурацию"
```

---

### Task 4: Cover CLI Behavior and Run Full Verification

**Files:**
- Modify: `packages/cli/src/commands/validate.test.ts`

- [ ] **Step 1: Add CLI test for --file Конфигурация.yaml**

In `packages/cli/src/commands/validate.test.ts`, add test after `"validates a single properties file from --file"`:

```ts
  it("validates a single root configuration file from --file", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", [
      "Имя: Конфигурация",
      "ОсновнойЯзык: Язык.НеСуществует",
    ])
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", ['НесуществующееПоле: "лишнее"'])
    const stdout = captureStdout()

    await validateYamlProject(projectDir, { file: "Конфигурация.yaml" })

    const text = writtenText(stdout)
    expect(text).toContain("Конфигурация.yaml")
    expect(text).toContain('Не найден объект "Язык.НеСуществует"')
    expect(text).not.toContain("Справочник/Товары/Свойства.yaml")
    expect(process.exitCode).toBe(1)
  })
```

Update unsupported-file assertion to the new message:

```ts
    expect(writtenText(stderr)).toContain("Ожидались Конфигурация.yaml")
```

- [ ] **Step 2: Run CLI validate tests and verify failures if any**

Run:

```bash
pnpm --dir packages/cli test -- src/commands/validate.test.ts
```

Expected: pass if Tasks 1-3 are complete.

- [ ] **Step 3: Run all focused validation tests**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/projectFiles.test.ts metadata/validation/validateProject.test.ts
pnpm --dir packages/cli test -- src/commands/validate.test.ts
```

Expected: all pass.

- [ ] **Step 4: Run full project test suite**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 5: Validate the original sample project**

Run:

```bash
pnpm -s --dir packages/cli exec tsx src/cli.ts validate /home/nikita/git/new-test-yaml
```

Expected: diagnostics now include root configuration or language-object issues if the sample has invalid references; otherwise `summary: 0 error, 0 warning`.

- [ ] **Step 6: Commit Task 4**

```bash
git add packages/cli/src/commands/validate.test.ts
git commit -m "test: :white_check_mark: проверить validate для конфигурации"
```

---

## Final Verification

- [ ] Run `git status --short` and confirm only intended files changed.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm -s --dir packages/cli exec tsx src/cli.ts validate /home/nikita/git/new-test-yaml`.
- [ ] Summarize commits and verification output for the user.
