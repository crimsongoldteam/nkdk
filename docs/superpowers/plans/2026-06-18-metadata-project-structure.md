# Metadata Project Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Вынести общее представление о структуре metadata-проекта в `metadata/project`, чтобы `schema`, `validate` и `sync` использовали одни правила интерпретации путей.

**Architecture:** Новый слой `packages/core/metadata/project/` интерпретирует уже существующие `rules.ts` и `typeRuleRegistry`, но не хранит отдельный реестр структуры. `schema` использует классификацию виртуальных путей без чтения файлов, `validate` использует обнаружение реальных YAML-ресурсов вместе со своими кэшами, `syncToXML` использует общий список верхнеуровневых properties-ресурсов для планирования задач.

**Tech Stack:** TypeScript, Vitest, TypeBox JSON Schema, текущие `MetadataItemRule`, `registerTypeRule`, `pnpm`.

---

## File Structure

- Create: `packages/core/metadata/project/specs.ts`
  - Нейтральные project spec, построенные из `MetadataConfigurationRules` и `TopLevelMetadataItemRules`.
  - Переносит смысл `validationProjectSpecs`, но без привязки к validation.
- Create: `packages/core/metadata/project/resources.ts`
  - Типы `MetadataProjectResourceRef`.
  - `classifyMetadataProjectPath`, `discoverMetadataProjectResources`, нормализация путей.
- Create: `packages/core/metadata/project/ruleResources.ts`
  - `describeMetadataRuleResources` для потенциальных YAML/XML/asset-ресурсов из `MetadataItemRule`.
- Create: `packages/core/metadata/project/index.ts`
  - Публичный вход нового слоя.
- Create: `packages/core/metadata/project/specs.test.ts`
- Create: `packages/core/metadata/project/resources.test.ts`
- Create: `packages/core/metadata/project/ruleResources.test.ts`
- Modify: `packages/core/metadata/validation/projectSpecs.ts`
  - Сделать совместимый экспорт из нового слоя для старых потребителей.
- Modify: `packages/core/metadata/validation/projectFiles.ts`
  - Сделать совместимый адаптер поверх `metadata/project/resources`.
- Modify: `packages/core/metadata/validation/projectFiles.test.ts`
  - Проверить совместимость и удалить тесты, которые теперь принадлежат `metadata/project/resources.test.ts`.
- Modify: `packages/core/metadata/validation/projectFileSchema.ts`
  - Использовать `classifyMetadataProjectPath`.
- Modify: `packages/core/metadata/validation/projectFileSchema.test.ts`
  - Добавить `Конфигурация.yaml`, вложенную подсистему и несуществующие пути.
- Modify: `packages/cli/src/commands/schema.test.ts`
  - Проверить все режимы `schema` для `Конфигурация.yaml`.
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
  - Использовать общий список top-level properties-ресурсов.
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`
  - Зафиксировать, что верхний обход использует существующие YAML properties и не запускает вложенные подсистемы отдельными top-level задачами.
- Modify: `packages/core/metadata/importBoundaries.test.ts`
  - Разрешить broad metadata registration только в новом `metadata/project/specs.ts`, убрать старое разрешение после переноса.
- Modify: `packages/core/index.ts`
  - Экспортировать новые public API, если они нужны CLI и внешним потребителям.

## Task 1: Neutral Project Specs

**Files:**
- Create: `packages/core/metadata/project/specs.ts`
- Create: `packages/core/metadata/project/specs.test.ts`
- Create: `packages/core/metadata/project/index.ts`
- Modify: `packages/core/metadata/validation/projectSpecs.ts`
- Modify: `packages/core/metadata/importBoundaries.test.ts`

- [ ] **Step 1: Write failing project specs tests**

Create `packages/core/metadata/project/specs.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { MetadataConfigurationRules } from "~/metadata/appliedObjects/configuration/rules"
import { TopLevelMetadataItemRules } from "~/metadata/appliedObjects/configuration/topLevelRules"
import {
  configurationMetadataProjectSpec,
  getMetadataProjectSpecByDir,
  metadataProjectSpecs,
} from "./specs"

describe("metadata project specs", () => {
  it("builds specs for every top-level metadata item with YAML directory", () => {
    const topLevelDirs = TopLevelMetadataItemRules.flatMap((rule) =>
      typeof rule.itemTypePrefix === "string" ? [rule.itemTypePrefix] : [],
    ).sort((left, right) => left.localeCompare(right, "ru"))

    const projectDirs = metadataProjectSpecs
      .map((spec) => spec.dir)
      .sort((left, right) => left.localeCompare(right, "ru"))

    expect(projectDirs).toEqual(topLevelDirs)
  })

  it("exposes configuration spec separately from top-level object directories", () => {
    expect(configurationMetadataProjectSpec).toMatchObject({
      kind: "configuration",
      dir: "",
      rule: MetadataConfigurationRules,
    })
    expect(metadataProjectSpecs.map((spec) => spec.dir)).not.toContain("")
  })

  it("resolves specs by YAML directory", () => {
    expect(getMetadataProjectSpecByDir("Справочник")).toMatchObject({
      dir: "Справочник",
      kind: "catalog",
    })
    expect(getMetadataProjectSpecByDir("НетТакогоВида")).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/specs.test.ts
```

Expected: FAIL because `packages/core/metadata/project/specs.ts` does not exist.

- [ ] **Step 3: Create neutral specs implementation**

Create `packages/core/metadata/project/specs.ts` by moving the neutral content from `metadata/validation/projectSpecs.ts` and renaming the exported symbols:

```ts
import "~/metadata/appliedObjects"
import "~/metadata/commonObjects"
import "~/metadata/forms"
import type { TSchema } from "@sinclair/typebox"
import { MetadataConfigurationRules } from "~/metadata/appliedObjects/configuration/rules"
import { TopLevelMetadataItemRules } from "~/metadata/appliedObjects/configuration/topLevelRules"
import { importMetadataCatalogFromYAML } from "~/metadata/appliedObjects/metadataCatalog/fromYAML"
import { exportMetadataCatalogToJSONSchema } from "~/metadata/appliedObjects/metadataCatalog/toJSONSchema"
import { exportMetadataDocumentToJSONSchema } from "~/metadata/appliedObjects/metadataDocument/toJSONSchema"
import { importMetadataEnumerationFromYAML } from "~/metadata/appliedObjects/metadataEnumeration/fromYAML"
import { exportMetadataEnumerationToJSONSchema } from "~/metadata/appliedObjects/metadataEnumeration/toJSONSchema"
import type { ConfigurationContext, JSONSchemaExportMode } from "~/metadata/context/types"
import {
  attachCollectedSchemaRefs,
  createJSONSchemaExportContext,
} from "~/metadata/orchestration/jsonSchemaRefs"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import type { MetadataItem, MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import { ensureJSONSchemaRegistry } from "~/metadata/validation/schemaRegistry"

export interface MetadataProjectSpec {
  kind: string
  dir: string
  rule: MetadataItemRule
  exportSchema: (params: { context: ConfigurationContext; mode?: JSONSchemaExportMode }) => TSchema
  importModel: (params: { context: ConfigurationContext; parsed: ParsedYaml; name: string }) => MetadataItem | undefined
}

type SchemaExporter = (params: { context: ConfigurationContext }) => TSchema
type MetadataProjectSpecOverride = Partial<Pick<MetadataProjectSpec, "kind" | "exportSchema" | "importModel">>

const metadataProjectSpecOverrides = new Map<string, MetadataProjectSpecOverride>([
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

export const metadataProjectSpecs: readonly MetadataProjectSpec[] = TopLevelMetadataItemRules.flatMap((rule) => {
  const dir = rule.itemTypePrefix
  if (typeof dir !== "string") return []

  const override = metadataProjectSpecOverrides.get(dir)

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

export const configurationMetadataProjectSpec: MetadataProjectSpec = {
  kind: "configuration",
  dir: "",
  rule: MetadataConfigurationRules,
  exportSchema: createMetadataItemSchemaExporter(MetadataConfigurationRules),
  importModel: genericImportModel(MetadataConfigurationRules),
}

export const metadataProjectSpecByDir = new Map(metadataProjectSpecs.map((spec) => [spec.dir, spec]))

export function getMetadataProjectSpecByDir(dir: string): MetadataProjectSpec | undefined {
  return metadataProjectSpecByDir.get(dir)
}

function createMetadataItemSchemaExporter(rule: MetadataItemRule): MetadataProjectSpec["exportSchema"] {
  return createSchemaExporter(({ context }) => exportMetadataItemToJSONSchema({ context, rule }))
}

function createSchemaExporter(exporter: SchemaExporter): MetadataProjectSpec["exportSchema"] {
  return ({ context, mode = "externalRefs" }) => {
    ensureJSONSchemaRegistry()
    const schemaContext = createJSONSchemaExportContext(context, mode)
    const schema = exporter({ context: schemaContext })

    return mode === "externalRefs" ? attachCollectedSchemaRefs(schemaContext, schema) : schema
  }
}

function genericImportModel(rule: MetadataItemRule): MetadataProjectSpec["importModel"] {
  return ({ context, parsed, name }) => {
    const model: unknown = importMetadataItemFromYAML({ context, yaml: parsed.data, rule, name })

    return isMetadataItem(model) ? model : undefined
  }
}

function isMetadataItem(value: unknown): value is MetadataItem {
  return typeof value === "object" && value !== null && "itemType" in value
}
```

- [ ] **Step 4: Add project index**

Create `packages/core/metadata/project/index.ts`:

```ts
export {
  configurationMetadataProjectSpec,
  getMetadataProjectSpecByDir,
  metadataProjectSpecs,
  type MetadataProjectSpec,
} from "./specs"
```

- [ ] **Step 5: Keep validation spec compatibility**

Replace `packages/core/metadata/validation/projectSpecs.ts` with a compatibility export:

```ts
export {
  configurationMetadataProjectSpec as configurationValidationProjectSpec,
  getMetadataProjectSpecByDir as getValidationProjectSpecByDir,
  metadataProjectSpecs as validationProjectSpecs,
  type MetadataProjectSpec as ValidationProjectSpec,
} from "~/metadata/project/specs"
```

- [ ] **Step 6: Update import boundary allowlist**

In `packages/core/metadata/importBoundaries.test.ts`, change the allowlist entry:

```ts
const REGISTRATION_ENTRYPOINT_ALLOWLIST = new Set([
  "index.ts",
  "metadata/register.ts",
  "metadata/register.test.ts",
  "tests/setupTests.ts",
  "metadata/project/specs.ts",
  "metadata/project/specs.test.ts",
  "metadata/validation/schemaRegistry.ts",
  "metadata/validation/validateForm.ts",
  "metadata/validation/dataPath/formTraversal.ts",
  "metadata/forms/clientApplicationForm/convertFromXML.ts",
  "metadata/validation/schemaRegistry.test.ts",
  "metadata/validation/validateForm.test.ts",
  "metadata/validation/dataPath/formTraversal.test.ts",
  "metadata/appliedObjects/metadataWebSocketClient/fromYAML.test.ts",
  "metadata/appliedObjects/metadataWebSocketClient/toYAML.test.ts",
  "metadata/appliedObjects/metadataXDTOPackage/fromYAML.test.ts",
  "metadata/appliedObjects/metadataXDTOPackage/toYAML.test.ts",
  "metadata/appliedObjects/metadataCommonCommand/fromYAML.test.ts",
  "metadata/appliedObjects/metadataCommonModule/fromYAML.test.ts",
  "metadata/appliedObjects/metadataCommonModule/toYAML.test.ts",
  "metadata/appliedObjects/metadataExternalDataSource/fromYAML.test.ts",
  "metadata/appliedObjects/metadataExternalDataSource/toYAML.test.ts",
])
```

- [ ] **Step 7: Run tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/specs.test.ts packages/core/metadata/importBoundaries.test.ts packages/core/metadata/validation/projectFiles.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/project/specs.ts packages/core/metadata/project/index.ts packages/core/metadata/project/specs.test.ts packages/core/metadata/validation/projectSpecs.ts packages/core/metadata/importBoundaries.test.ts
git commit -m "refactor: :recycle: вынести project specs metadata"
```

## Task 2: Path Classification And Discovery

**Files:**
- Create: `packages/core/metadata/project/resources.ts`
- Create: `packages/core/metadata/project/resources.test.ts`
- Modify: `packages/core/metadata/project/index.ts`

- [ ] **Step 1: Write failing resource tests**

Create `packages/core/metadata/project/resources.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { TopLevelMetadataItemRules } from "~/metadata/appliedObjects/configuration/topLevelRules"
import {
  assertMetadataProjectPathInside,
  classifyMetadataProjectPath,
  discoverMetadataProjectResources,
} from "./resources"

describe("metadata project resources", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  const createProject = (): string => {
    const projectDir = mkdtempSync(join(tmpdir(), "nakidka-project-resources-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  const touchProjectFile = (projectDir: string, projectPath: string): void => {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(resolve(filePath, ".."), { recursive: true })
    writeFileSync(filePath, "")
  }

  it("classifies virtual configuration, properties and form YAML paths", () => {
    expect(classifyMetadataProjectPath("Конфигурация.yaml")).toMatchObject({
      kind: "yaml",
      role: "configuration",
      projectPath: "Конфигурация.yaml",
      owner: { dir: "", name: "Конфигурация" },
    })

    expect(classifyMetadataProjectPath("Справочник/Новый/Свойства.yaml")).toMatchObject({
      kind: "yaml",
      role: "properties",
      owner: { dir: "Справочник", name: "Новый" },
      nesting: [],
    })

    expect(classifyMetadataProjectPath("Документ/Заказ/Формы/ФормаДокумента/Форма.yaml")).toMatchObject({
      kind: "yaml",
      role: "form",
      owner: { dir: "Документ", name: "Заказ" },
      formName: "ФормаДокумента",
    })
  })

  it("classifies virtual nested subsystem properties", () => {
    expect(
      classifyMetadataProjectPath(
        "Подсистема/Администрирование/Подсистемы/Настройки/Подсистемы/Интерфейс/Свойства.yaml",
      ),
    ).toMatchObject({
      kind: "yaml",
      role: "properties",
      owner: { dir: "Подсистема", name: "Интерфейс" },
      nesting: [
        { dir: "Подсистема", name: "Администрирование" },
        { dir: "Подсистема", name: "Настройки" },
      ],
    })
  })

  it("does not classify migrations or malformed paths", () => {
    expect(classifyMetadataProjectPath("Миграции/0001.yaml")).toBeUndefined()
    expect(classifyMetadataProjectPath("Справочник/Товары/Команды/Команда.yaml")).toBeUndefined()
    expect(classifyMetadataProjectPath("Подсистема/Администрирование/Подсистемы/Свойства.yaml")).toBeUndefined()
    expect(
      classifyMetadataProjectPath("Подсистема/Администрирование/Подсистемы/Настройки/Формы/Форма/Форма.yaml"),
    ).toBeUndefined()
  })

  it("discovers existing metadata YAML resources", () => {
    const projectDir = createProject()
    touchProjectFile(projectDir, "Конфигурация.yaml")
    touchProjectFile(projectDir, "Справочник/Товары/Свойства.yaml")
    touchProjectFile(projectDir, "Справочник/Товары/Формы/ФормаСписка/Форма.yaml")
    touchProjectFile(projectDir, "Документ/Заказ/Свойства.yaml")
    touchProjectFile(projectDir, "Справочник/Товары/Команды/Команда.yaml")
    touchProjectFile(projectDir, "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml")

    expect(discoverMetadataProjectResources(projectDir).map((file) => file.projectPath)).toEqual([
      "Документ/Заказ/Свойства.yaml",
      "Конфигурация.yaml",
      "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
    ])
  })

  it("discovers properties for every top-level metadata item with YAML directory", () => {
    const projectDir = createProject()
    const dirs = TopLevelMetadataItemRules.flatMap((rule) =>
      typeof rule.itemTypePrefix === "string" ? [rule.itemTypePrefix] : [],
    )

    for (const dir of dirs) {
      touchProjectFile(projectDir, `${dir}/Тест/Свойства.yaml`)
    }

    expect(discoverMetadataProjectResources(projectDir).map((file) => file.projectPath)).toEqual(
      dirs
        .map((dir) => `${dir}/Тест/Свойства.yaml`)
        .sort((left, right) => left.localeCompare(right, "ru")),
    )
  })

  it("rejects absolute files outside project root", () => {
    const projectDir = createProject()
    const outsidePath = resolve(projectDir, "..", "outside", "Справочник", "Товары", "Свойства.yaml")

    expect(() => assertMetadataProjectPathInside(projectDir, outsidePath)).toThrow(
      "Файл находится вне указанного YAML-проекта",
    )
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/resources.test.ts
```

Expected: FAIL because `resources.ts` does not exist.

- [ ] **Step 3: Implement resource types and classifiers**

Create `packages/core/metadata/project/resources.ts`:

```ts
import { existsSync, readdirSync, statSync } from "fs"
import { isAbsolute, join, relative, resolve, sep } from "path"
import { CONFIGURATION_YAML_FILE } from "~/metadata/appliedObjects/configuration/rootIO"
import {
  configurationMetadataProjectSpec,
  getMetadataProjectSpecByDir,
  metadataProjectSpecs,
  type MetadataProjectSpec,
} from "./specs"

const SUBSYSTEM_DIR = "Подсистема"
const CHILD_SUBSYSTEMS_DIR = "Подсистемы"
const PROPERTIES_FILE = "Свойства.yaml"
const FORM_FILE = "Форма.yaml"

export type MetadataProjectResourceKind = "yaml" | "xml" | "asset"
export type MetadataProjectYamlRole = "configuration" | "properties" | "form"

export interface MetadataProjectResourceOwner {
  dir: string
  name: string
  spec: MetadataProjectSpec
}

export interface MetadataProjectNestingSegment {
  dir: string
  name: string
}

export type MetadataProjectResourceRef =
  | MetadataProjectConfigurationYamlRef
  | MetadataProjectPropertiesYamlRef
  | MetadataProjectFormYamlRef

export interface MetadataProjectConfigurationYamlRef {
  kind: "yaml"
  role: "configuration"
  projectPath: string
  absolutePath?: string
  owner: MetadataProjectResourceOwner
}

export interface MetadataProjectPropertiesYamlRef {
  kind: "yaml"
  role: "properties"
  projectPath: string
  absolutePath?: string
  owner: MetadataProjectResourceOwner
  nesting: MetadataProjectNestingSegment[]
}

export interface MetadataProjectFormYamlRef {
  kind: "yaml"
  role: "form"
  projectPath: string
  absolutePath?: string
  owner: MetadataProjectResourceOwner
  formName: string
}

export function classifyMetadataProjectPath(projectPath: string): MetadataProjectResourceRef | undefined {
  const normalized = toProjectSeparators(projectPath)
  if (normalized === CONFIGURATION_YAML_FILE) return configurationResource(normalized)

  const parts = normalized.split("/")
  const nestedSubsystem = matchNestedSubsystemPropertiesPath(parts, normalized)
  if (nestedSubsystem) return nestedSubsystem

  const properties = matchPropertiesPath(parts, normalized)
  if (properties) return properties

  const form = matchFormPath(parts, normalized)
  if (form) return form

  return undefined
}

export function discoverMetadataProjectResources(projectDir: string): MetadataProjectResourceRef[] {
  const projectRoot = resolve(projectDir)
  const resources: MetadataProjectResourceRef[] = []

  collectExistingProjectResource(projectRoot, join(projectRoot, CONFIGURATION_YAML_FILE), resources)

  for (const spec of metadataProjectSpecs) {
    const kindDir = join(projectRoot, spec.dir)
    if (!isExistingDirectory(kindDir)) continue

    for (const ownerEntry of readdirSync(kindDir, { withFileTypes: true })) {
      if (!ownerEntry.isDirectory()) continue

      collectExistingProjectResource(projectRoot, join(kindDir, ownerEntry.name, PROPERTIES_FILE), resources)

      const formsDir = join(kindDir, ownerEntry.name, "Формы")
      if (!isExistingDirectory(formsDir)) continue

      for (const formEntry of readdirSync(formsDir, { withFileTypes: true })) {
        if (!formEntry.isDirectory()) continue
        collectExistingProjectResource(projectRoot, join(formsDir, formEntry.name, FORM_FILE), resources)
      }
    }
  }

  collectNestedSubsystemPropertyResources(projectRoot, resources)

  return resources.sort((left, right) => left.projectPath.localeCompare(right.projectPath, "ru"))
}

export function assertMetadataProjectPathInside(projectDir: string, filePath: string): string {
  const projectRoot = resolve(projectDir)
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  const projectPath = relative(projectRoot, absolutePath)

  if (projectPath === "" || projectPath.startsWith("..") || isAbsolute(projectPath)) {
    throw new Error("Файл находится вне указанного YAML-проекта")
  }

  return toProjectSeparators(projectPath)
}

export function resolveMetadataProjectResource(
  projectDir: string,
  filePath: string,
): MetadataProjectResourceRef | undefined {
  const projectRoot = resolve(projectDir)
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  const projectPath = assertMetadataProjectPathInside(projectRoot, absolutePath)
  const resource = classifyMetadataProjectPath(projectPath)

  return resource ? { ...resource, absolutePath } : undefined
}

function collectExistingProjectResource(projectRoot: string, filePath: string, resources: MetadataProjectResourceRef[]): void {
  if (!isExistingFile(filePath)) return

  const resource = resolveMetadataProjectResource(projectRoot, filePath)
  if (resource) resources.push(resource)
}

function configurationResource(projectPath: string): MetadataProjectConfigurationYamlRef {
  return {
    kind: "yaml",
    role: "configuration",
    projectPath,
    owner: {
      dir: "",
      name: "Конфигурация",
      spec: configurationMetadataProjectSpec,
    },
  }
}

function matchPropertiesPath(parts: string[], projectPath: string): MetadataProjectPropertiesYamlRef | undefined {
  if (parts.length !== 3 || parts[2] !== PROPERTIES_FILE) return undefined

  const owner = createOwner(parts[0], parts[1])
  return owner ? { kind: "yaml", role: "properties", projectPath, owner, nesting: [] } : undefined
}

function matchNestedSubsystemPropertiesPath(
  parts: string[],
  projectPath: string,
): MetadataProjectPropertiesYamlRef | undefined {
  const lastPart = parts[parts.length - 1]
  if (parts.length < 5 || parts[0] !== SUBSYSTEM_DIR || lastPart !== PROPERTIES_FILE) return undefined
  if ((parts.length - 3) % 2 !== 0) return undefined

  const nesting: MetadataProjectNestingSegment[] = [{ dir: SUBSYSTEM_DIR, name: parts[1] }]
  for (let index = 2; index < parts.length - 2; index += 2) {
    if (parts[index] !== CHILD_SUBSYSTEMS_DIR || !parts[index + 1]) return undefined
    if (index < parts.length - 3) nesting.push({ dir: SUBSYSTEM_DIR, name: parts[index + 1] })
  }

  const owner = createOwner(SUBSYSTEM_DIR, parts[parts.length - 2])
  return owner ? { kind: "yaml", role: "properties", projectPath, owner, nesting } : undefined
}

function matchFormPath(parts: string[], projectPath: string): MetadataProjectFormYamlRef | undefined {
  if (parts.length !== 5 || parts[2] !== "Формы" || parts[4] !== FORM_FILE) return undefined

  const owner = createOwner(parts[0], parts[1])
  const formName = parts[3]
  if (!owner || !formName) return undefined

  return { kind: "yaml", role: "form", projectPath, owner, formName }
}

function createOwner(dir: string | undefined, name: string | undefined): MetadataProjectResourceOwner | undefined {
  if (!dir || !name) return undefined

  const spec = getMetadataProjectSpecByDir(dir)
  if (!spec) return undefined

  return { dir, name, spec }
}

function collectNestedSubsystemPropertyResources(projectRoot: string, resources: MetadataProjectResourceRef[]): void {
  const subsystemRoot = join(projectRoot, SUBSYSTEM_DIR)
  if (!isExistingDirectory(subsystemRoot)) return

  for (const subsystemEntry of readdirSync(subsystemRoot, { withFileTypes: true })) {
    if (!subsystemEntry.isDirectory()) continue
    collectNestedSubsystemPropertyResourcesFromDir(projectRoot, join(subsystemRoot, subsystemEntry.name), resources)
  }
}

function collectNestedSubsystemPropertyResourcesFromDir(
  projectRoot: string,
  currentDir: string,
  resources: MetadataProjectResourceRef[],
): void {
  const childSubsystemsDir = join(currentDir, CHILD_SUBSYSTEMS_DIR)
  if (!isExistingDirectory(childSubsystemsDir)) return

  for (const childEntry of readdirSync(childSubsystemsDir, { withFileTypes: true })) {
    if (!childEntry.isDirectory()) continue

    const childDir = join(childSubsystemsDir, childEntry.name)
    collectExistingProjectResource(projectRoot, join(childDir, PROPERTIES_FILE), resources)
    collectNestedSubsystemPropertyResourcesFromDir(projectRoot, childDir, resources)
  }
}

function toProjectSeparators(filePath: string): string {
  return filePath.split(sep).join("/")
}

function isExistingDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory()
}

function isExistingFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile()
}
```

- [ ] **Step 4: Export resource API**

Append to `packages/core/metadata/project/index.ts`:

```ts
export {
  assertMetadataProjectPathInside,
  classifyMetadataProjectPath,
  discoverMetadataProjectResources,
  resolveMetadataProjectResource,
  type MetadataProjectConfigurationYamlRef,
  type MetadataProjectFormYamlRef,
  type MetadataProjectPropertiesYamlRef,
  type MetadataProjectResourceOwner,
  type MetadataProjectResourceRef,
} from "./resources"
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/resources.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/project/resources.ts packages/core/metadata/project/resources.test.ts packages/core/metadata/project/index.ts
git commit -m "feat: :sparkles: описать ресурсы metadata-проекта"
```

## Task 3: Validation Compatibility Adapter

**Files:**
- Modify: `packages/core/metadata/validation/projectFiles.ts`
- Modify: `packages/core/metadata/validation/projectFiles.test.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`

- [ ] **Step 1: Run existing validation project file tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/validation/projectFiles.test.ts packages/core/metadata/validation/validateProject.test.ts
```

Expected: PASS before the refactor starts.

- [ ] **Step 2: Replace project file discovery with adapter**

Replace `packages/core/metadata/validation/projectFiles.ts` with:

```ts
import { isAbsolute, resolve } from "path"
import {
  assertMetadataProjectPathInside,
  discoverMetadataProjectResources,
  resolveMetadataProjectResource,
  type MetadataProjectResourceRef,
} from "~/metadata/project"
import type { ValidationProjectSpec } from "./projectSpecs"

export interface ValidationProjectFile {
  absolutePath: string
  projectPath: string
  kind: "configuration" | "properties" | "form"
  owner: { dir: string; name: string; spec: ValidationProjectSpec }
  formName?: string
}

export function discoverValidationProjectFiles(projectDir: string): ValidationProjectFile[] {
  return discoverMetadataProjectResources(projectDir).flatMap((resource) => {
    const file = toValidationProjectFile(resource)
    return file ? [file] : []
  })
}

export function resolveValidationProjectFile(projectDir: string, filePath: string): ValidationProjectFile | undefined {
  const resource = resolveMetadataProjectResource(projectDir, filePath)
  return resource ? toValidationProjectFile(resource) : undefined
}

export function assertProjectFileInside(projectDir: string, filePath: string): string {
  const projectRoot = resolve(projectDir)
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  return assertMetadataProjectPathInside(projectRoot, absolutePath)
}

function toValidationProjectFile(resource: MetadataProjectResourceRef): ValidationProjectFile | undefined {
  if (resource.kind !== "yaml") return undefined
  if (resource.absolutePath === undefined) return undefined

  if (resource.role === "configuration") {
    return {
      absolutePath: resource.absolutePath,
      projectPath: resource.projectPath,
      kind: "configuration",
      owner: resource.owner,
    }
  }

  if (resource.role === "properties") {
    return {
      absolutePath: resource.absolutePath,
      projectPath: resource.projectPath,
      kind: "properties",
      owner: resource.owner,
    }
  }

  if (resource.role === "form") {
    return {
      absolutePath: resource.absolutePath,
      projectPath: resource.projectPath,
      kind: "form",
      owner: resource.owner,
      formName: resource.formName,
    }
  }

  return undefined
}
```

- [ ] **Step 3: Keep projectFiles tests focused on adapter compatibility**

In `packages/core/metadata/validation/projectFiles.test.ts`, keep the existing assertions, but import `validationProjectSpecs` from `./projectSpecs` as before. Do not duplicate all `classifyMetadataProjectPath` cases here; those live in `metadata/project/resources.test.ts`.

- [ ] **Step 4: Run validation tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/validation/projectFiles.test.ts packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/validation/projectMetadataResolver.test.ts packages/core/metadata/validation/validateForm.test.ts
```

Expected: PASS. This confirms `ProjectYamlCache`, `OwnerMetadataCache`, `metadataTarget` and `DataPath` still use validation-owned logic.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/validation/projectFiles.ts packages/core/metadata/validation/projectFiles.test.ts packages/core/metadata/validation/validateProject.ts
git commit -m "refactor: :recycle: использовать карту проекта в validate"
```

## Task 4: Schema Uses Virtual Project Paths

**Files:**
- Modify: `packages/core/metadata/validation/projectFileSchema.ts`
- Modify: `packages/core/metadata/validation/projectFileSchema.test.ts`
- Modify: `packages/cli/src/commands/schema.test.ts`

- [ ] **Step 1: Add failing core schema tests**

Append tests to `packages/core/metadata/validation/projectFileSchema.test.ts` inside `describe("exportJSONSchemaForProjectFile", () => { ... })`:

```ts
  it("exports configuration schema for virtual root configuration path", () => {
    const schema = exportJSONSchemaForProjectFile({
      context,
      filePath: "Конфигурация.yaml",
    })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Имя: expect.any(Object),
      }),
    })
  })

  it("exports nested subsystem schema from virtual nested subsystem path", () => {
    const schema = exportJSONSchemaForProjectFile({
      context,
      filePath: "Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml",
    })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Синоним: expect.any(Object),
      }),
    })
  })

  it("exports schema for a new properties file that does not exist on disk", () => {
    const projectDir = createProject()

    const schema = exportJSONSchemaForProjectFile({
      context,
      projectDir,
      filePath: "Справочник/НовыйСправочник/Свойства.yaml",
    })

    expect(schema).toMatchObject({
      type: "object",
      properties: expect.objectContaining({
        Реквизиты: expect.any(Object),
      }),
    })
  })
```

- [ ] **Step 2: Add failing CLI schema tests**

Append tests to `packages/cli/src/commands/schema.test.ts`:

```ts
  it("prints YAML summary for root configuration project file", async () => {
    const stdout = captureStdout()

    await printSchema("Конфигурация.yaml", {})

    const text = writtenText(stdout)
    expect(text).toContain("fields:")
    expect(text).toContain("key: Имя")
  })

  it("prints keys for root configuration project file", async () => {
    const stdout = captureStdout()

    await printSchema("Конфигурация.yaml", { keys: true })

    expect(writtenText(stdout)).toContain("Имя\n")
  })

  it("prints JSON schema for root configuration project file", async () => {
    const stdout = captureStdout()

    await printSchema("Конфигурация.yaml", { jsonSchema: true })

    const schema = JSON.parse(writtenText(stdout))
    expect(schema.properties).toHaveProperty("Имя")
  })

  it("prints YAML summary for nested subsystem project file", async () => {
    const stdout = captureStdout()

    await printSchema("Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml", {})

    const text = writtenText(stdout)
    expect(text).toContain("fields:")
    expect(text).toContain("key: Синоним")
  })
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/validation/projectFileSchema.test.ts
pnpm --filter @nakidka/cli test -- packages/cli/src/commands/schema.test.ts
```

Expected: FAIL on `Конфигурация.yaml` or nested subsystem support.

- [ ] **Step 4: Replace schema path parsing**

Modify `packages/core/metadata/validation/projectFileSchema.ts`:

```ts
import type { TSchema } from "@sinclair/typebox"
import { isAbsolute, relative, resolve, sep } from "path"
import type { ConfigurationContext, JSONSchemaExportMode } from "~/metadata/context/types"
import { classifyMetadataProjectPath } from "~/metadata/project"
import {
  exportJSONSchemaForSchemaName as exportRegisteredJSONSchemaForSchemaName,
  ProjectFileSchemaError,
} from "./schemaRegistry"

export { ProjectFileSchemaError } from "./schemaRegistry"

export interface ExportJSONSchemaForProjectFileParams {
  context: ConfigurationContext
  filePath: string
  projectDir?: string
  mode?: JSONSchemaExportMode
}

export interface ExportJSONSchemaForSchemaNameParams {
  context: ConfigurationContext
  name: string
  mode?: JSONSchemaExportMode
}

const expectedPatterns =
  "Ожидались Конфигурация.yaml или пути вида <Вид>/<Имя>/Свойства.yaml и <Вид>/<Имя>/Формы/<Форма>/Форма.yaml"

export function exportJSONSchemaForProjectFile(params: ExportJSONSchemaForProjectFileParams): TSchema {
  const normalized = normalizeProjectPath(params)

  if (!normalized.toLowerCase().endsWith(".yaml")) {
    throw new ProjectFileSchemaError("JSON Schema поддерживается только для .yaml файлов")
  }

  const resource = classifyMetadataProjectPath(normalized)
  if (!resource || resource.kind !== "yaml") {
    throw new ProjectFileSchemaError(expectedPatterns)
  }

  if (resource.role === "form") {
    return exportRegisteredJSONSchemaForSchemaName({
      context: params.context,
      name: "ClientApplicationForm",
      mode: params.mode,
    })
  }

  if (resource.role === "configuration" || resource.role === "properties") {
    return resource.owner.spec.exportSchema({
      context: params.context,
      mode: params.mode,
    })
  }

  throw new ProjectFileSchemaError("JSON Schema для этого вида metadata-ресурса не поддерживается")
}

export function exportJSONSchemaForSchemaName(params: ExportJSONSchemaForSchemaNameParams): TSchema {
  return exportRegisteredJSONSchemaForSchemaName(params)
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
```

- [ ] **Step 5: Run schema tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/validation/projectFileSchema.test.ts
pnpm --filter @nakidka/cli test -- packages/cli/src/commands/schema.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/validation/projectFileSchema.ts packages/core/metadata/validation/projectFileSchema.test.ts packages/cli/src/commands/schema.test.ts
git commit -m "fix: :bug: поддержать проектные пути в schema"
```

## Task 5: SyncToXML Uses Project Resource Discovery

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Add a regression test for nested subsystem planning**

Append a test to `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts` near other temporary sync tests:

```ts
  it("не планирует вложенные подсистемы как отдельные top-level задачи", async () => {
    const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-sync-nested-subsystem-plan-"))
    const yamlDir = join(tmp, "yaml")
    const outDir = join(tmp, "xml")

    try {
      fs.mkdirSync(join(yamlDir, "Подсистема", "Администрирование", "Подсистемы", "Настройки"), { recursive: true })
      fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")
      fs.writeFileSync(
        join(yamlDir, "Подсистема", "Администрирование", "Свойства.yaml"),
        "Имя: Администрирование\n",
        "utf-8",
      )
      fs.writeFileSync(
        join(yamlDir, "Подсистема", "Администрирование", "Подсистемы", "Настройки", "Свойства.yaml"),
        "Имя: Настройки\n",
        "utf-8",
      )

      const result = await syncConfigurationToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        outputDir: outDir,
      })

      expect(result.failed).toEqual([])
      expect(fs.existsSync(join(outDir, "Subsystems", "Администрирование.xml"))).toBe(true)
      expect(fs.existsSync(join(outDir, "Subsystems", "Настройки.xml"))).toBe(false)
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
    }
  })
```

- [ ] **Step 2: Run sync test before refactor**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS before the refactor. If this test fails because the current behavior already plans nested subsystems incorrectly, stop and inspect the subsystem sync behavior before changing `syncToXML`.

- [ ] **Step 3: Use discovered top-level properties resources in syncToXML**

Modify imports in `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`:

```ts
import { discoverMetadataProjectResources, type MetadataProjectPropertiesYamlRef } from "~/metadata/project"
```

Add helper near constants:

```ts
function discoverTopLevelPropertiesResources(inputDir: string): MetadataProjectPropertiesYamlRef[] {
  return discoverMetadataProjectResources(inputDir).filter(
    (resource): resource is MetadataProjectPropertiesYamlRef =>
      resource.kind === "yaml" &&
      resource.role === "properties" &&
      resource.nesting.length === 0 &&
      resource.owner.spec.rule.xmlDir !== undefined &&
      resource.owner.spec.rule.itemTypePrefix !== undefined,
  )
}
```

Replace the manual `for (const rule of TopLevelMetadataItemRules)` task planning loop with:

```ts
  for (const resource of discoverTopLevelPropertiesResources(inputDir)) {
    const rule = resource.owner.spec.rule
    const name = resource.owner.name
    const yamlDirAbs = join(inputDir, rule.itemTypePrefix!)
    const xmlOutputDir = join(outputDir, rule.xmlDir!)
    const xmlReferenceDir = referenceDir ? join(referenceDir, rule.xmlDir!) : undefined
    const currentObjectPath = `${rule.itemTypePrefix}.${name}`
    const referencePath = migrationResult.referencePathByCurrentPath.get(currentObjectPath) ?? currentObjectPath
    const referencePathSegments = referencePath.split(".")
    const referenceName = referencePathSegments[referencePathSegments.length - 1]!
    const currentNode = migrationResult.state.nodes.get(currentObjectPath)
    const referenceModel = currentNode && currentNode.referencePath === undefined ? null : undefined
    const referenceModelRemapper: ReferenceModelRemapper | undefined =
      migrationResult.referencePathByCurrentPath.size > 0
        ? ({ rule, currentModel, referenceModel }) =>
            remapReferenceModel({
              rule,
              currentObjectPath,
              currentModel,
              referenceModel,
              referencePathByCurrentPath: migrationResult.referencePathByCurrentPath,
            })
        : undefined
    const xmlExternalOutputDir = join(xmlOutputDir, name)
    const xmlExternalReferenceDir = xmlReferenceDir ? join(xmlReferenceDir, referenceName) : undefined

    tasks.push({
      kind: rule.itemType,
      name,
      run: () =>
        syncAppliedObjectToXML({
          rule,
          context: { ...context, exportToXML: { ...context.exportToXML } },
          inputDir: yamlDirAbs,
          name,
          outputDir: xmlOutputDir,
          externalOutputDir: xmlExternalOutputDir,
          referenceDir: xmlReferenceDir,
          externalReferenceDir: xmlExternalReferenceDir,
          referenceName,
          referenceModel,
          referenceModelRemapper,
          xmlManifest,
        }),
    })
  }
```

Keep `TopLevelMetadataItemRules` imports where they are still needed for `pruneXmlByManifest` and unsupported extension preservation.

- [ ] **Step 4: Run sync tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts packages/core/metadata/appliedObjects/metadataSubsystem/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/syncToXML.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "refactor: :recycle: использовать карту проекта в sync"
```

## Task 6: Rule Resource Descriptors

**Files:**
- Create: `packages/core/metadata/project/ruleResources.ts`
- Create: `packages/core/metadata/project/ruleResources.test.ts`
- Modify: `packages/core/metadata/project/index.ts`

- [ ] **Step 1: Write failing rule resource descriptor tests**

Create `packages/core/metadata/project/ruleResources.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataCommonFormRules } from "~/metadata/appliedObjects/metadataCommonForm/rules"
import { MetadataConfigurationRules } from "~/metadata/appliedObjects/configuration/rules"
import { describeMetadataRuleResources } from "./ruleResources"

describe("describeMetadataRuleResources", () => {
  it("describes YAML properties and XML object resource from item rule directories", () => {
    expect(describeMetadataRuleResources(MetadataCatalogRules)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "yaml",
          role: "properties",
          itemTypePrefix: "Справочник",
        }),
        expect.objectContaining({
          kind: "xml",
          role: "objectXml",
          xmlDir: "Catalogs",
        }),
      ]),
    )
  })

  it("describes external XML resources from filePath properties", () => {
    const resources = describeMetadataRuleResources(MetadataCatalogRules)

    expect(resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "xml",
          role: "externalXml",
          propertyName: "predefined",
          xmlPath: "Ext/Predefined.xml",
        }),
        expect.objectContaining({
          kind: "xml",
          role: "externalXml",
          propertyName: "help",
          xmlPath: "Ext/Help.xml",
        }),
      ]),
    )
  })

  it("describes dynamic external handlers for child forms and templates", () => {
    const resources = describeMetadataRuleResources(MetadataCatalogRules)

    expect(resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "dynamic",
          role: "syncExternal",
          propertyName: "forms",
          propertyType: "ChildFormNames",
        }),
        expect.objectContaining({
          kind: "dynamic",
          role: "syncExternal",
          propertyName: "templates",
          propertyType: "ChildTemplateNames",
        }),
      ]),
    )
  })

  it("describes root configuration external resources", () => {
    const resources = describeMetadataRuleResources(MetadataConfigurationRules)

    expect(resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "yaml",
          role: "configuration",
        }),
        expect.objectContaining({
          kind: "dynamic",
          role: "syncExternal",
        }),
      ]),
    )
  })

  it("describes asset-like external files from externalFile rules", () => {
    const resources = describeMetadataRuleResources(MetadataCommonFormRules)

    expect(resources.some((resource) => resource.kind === "asset" || resource.kind === "dynamic")).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/ruleResources.test.ts
```

Expected: FAIL because `ruleResources.ts` does not exist.

- [ ] **Step 3: Implement descriptors from rules**

Create `packages/core/metadata/project/ruleResources.ts`:

```ts
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"

export type MetadataProjectResourceDescriptor =
  | MetadataProjectYamlDescriptor
  | MetadataProjectXmlDescriptor
  | MetadataProjectAssetDescriptor
  | MetadataProjectDynamicDescriptor

export interface MetadataProjectYamlDescriptor {
  kind: "yaml"
  role: "configuration" | "properties"
  itemTypePrefix?: string
}

export interface MetadataProjectXmlDescriptor {
  kind: "xml"
  role: "objectXml" | "externalXml"
  xmlDir?: string
  propertyName?: string
  propertyType?: string
  xmlPath?: string
}

export interface MetadataProjectAssetDescriptor {
  kind: "asset"
  role: "externalFile"
  propertyName: string
  propertyType: string
  nkdkDir: string
  extension?: string
}

export interface MetadataProjectDynamicDescriptor {
  kind: "dynamic"
  role: "syncExternal"
  propertyName: string
  propertyType: string
  hasSyncExternalFromXML: boolean
  hasSyncExternalToXML: boolean
}

export function describeMetadataRuleResources(rule: MetadataItemRule): MetadataProjectResourceDescriptor[] {
  const resources: MetadataProjectResourceDescriptor[] = []

  if (rule.itemType === "Configuration") {
    resources.push({ kind: "yaml", role: "configuration" })
  } else if (typeof rule.itemTypePrefix === "string") {
    resources.push({ kind: "yaml", role: "properties", itemTypePrefix: rule.itemTypePrefix })
  }

  if (typeof rule.xmlDir === "string") {
    resources.push({ kind: "xml", role: "objectXml", xmlDir: rule.xmlDir })
  }

  for (const [propertyName, propertyRule] of Object.entries(rule.properties) as [string, PropertyRule][]) {
    collectPropertyResources(resources, propertyName, propertyRule)
  }

  return resources
}

function collectPropertyResources(
  resources: MetadataProjectResourceDescriptor[],
  propertyName: string,
  propertyRule: PropertyRule,
): void {
  if (typeof propertyRule.filePath === "string") {
    resources.push({
      kind: "xml",
      role: "externalXml",
      propertyName,
      propertyType: propertyRule.type,
      xmlPath: propertyRule.filePath,
    })
  }

  if (propertyRule.externalFile !== undefined) {
    resources.push({
      kind: "asset",
      role: "externalFile",
      propertyName,
      propertyType: propertyRule.type,
      nkdkDir: propertyRule.externalFile.dir,
      extension: propertyRule.externalFile.extension,
    })
  }

  const hasSyncExternalFromXML = getTypeRule(propertyRule.type, "syncExternalFromXML") !== undefined
  const hasSyncExternalToXML = getTypeRule(propertyRule.type, "syncExternalToXML") !== undefined
  if (hasSyncExternalFromXML || hasSyncExternalToXML || propertyRule.syncExternalOnly === true) {
    resources.push({
      kind: "dynamic",
      role: "syncExternal",
      propertyName,
      propertyType: propertyRule.type,
      hasSyncExternalFromXML,
      hasSyncExternalToXML,
    })
  }
}
```

- [ ] **Step 4: Export descriptor API**

Append to `packages/core/metadata/project/index.ts`:

```ts
export {
  describeMetadataRuleResources,
  type MetadataProjectAssetDescriptor,
  type MetadataProjectDynamicDescriptor,
  type MetadataProjectResourceDescriptor,
  type MetadataProjectXmlDescriptor,
  type MetadataProjectYamlDescriptor,
} from "./ruleResources"
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project/ruleResources.test.ts packages/core/metadata/project/specs.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/project/ruleResources.ts packages/core/metadata/project/ruleResources.test.ts packages/core/metadata/project/index.ts
git commit -m "feat: :sparkles: описать ресурсы из rules"
```

## Task 7: Public Exports And Regression Sweep

**Files:**
- Modify: `packages/core/index.ts`
- Modify: `packages/core/metadata/project/index.ts`

- [ ] **Step 1: Export project APIs from core**

Append to `packages/core/index.ts`:

```ts
export {
  assertMetadataProjectPathInside,
  classifyMetadataProjectPath,
  configurationMetadataProjectSpec,
  describeMetadataRuleResources,
  discoverMetadataProjectResources,
  getMetadataProjectSpecByDir,
  metadataProjectSpecs,
  resolveMetadataProjectResource,
  type MetadataProjectResourceDescriptor,
  type MetadataProjectResourceRef,
  type MetadataProjectSpec,
} from "./metadata/project"
```

- [ ] **Step 2: Run focused regression tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/project packages/core/metadata/validation/projectFiles.test.ts packages/core/metadata/validation/projectFileSchema.test.ts packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts packages/core/metadata/importBoundaries.test.ts
pnpm --filter @nakidka/cli test -- packages/cli/src/commands/schema.test.ts packages/cli/src/commands/validate.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run type check**

Run:

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/core/index.ts packages/core/metadata/project/index.ts
git commit -m "feat: :sparkles: экспортировать модель metadata-проекта"
```

## Task 8: Final Verification

**Files:**
- No code files.

- [ ] **Step 1: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS for `packages/core` and `packages/cli`.

- [ ] **Step 2: Inspect git status**

Run:

```bash
git status --short
```

Expected: no uncommitted files.

- [ ] **Step 3: Summarize implementation**

Prepare a short summary with:

```text
- Создан слой metadata/project, который интерпретирует rules.ts.
- schema использует virtual path classification и поддерживает Конфигурация.yaml.
- validate использует общий discovery, но сохраняет ProjectYamlCache, OwnerMetadataCache и DataPath.
- syncToXML использует общий список top-level properties.
- pnpm test прошёл.
```
