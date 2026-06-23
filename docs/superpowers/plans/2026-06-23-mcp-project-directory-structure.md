# MCP Project Directory Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить MCP tool `nkdk.describe_project_structure`, который по `projectDir` и `directoryPath` возвращает допустимую структуру каталогов NKDK YAML-проекта.

**Architecture:** Источник истины живёт в `@nakidka/core` в слое `packages/core/metadata/project`. MCP-пакет добавляет только JSON-договор, сервисную обёртку и регистрацию tool. Фактические файлы проекта не анализируются, кроме проверки, что `projectDir` существует и `directoryPath` не выходит за его пределы.

**Tech Stack:** TypeScript, Vitest, Zod v4, `@modelcontextprotocol/sdk`, существующие `metadataProjectSpecs`, `classifyMetadataProjectPath`, `describeMetadataRuleResources`.

---

## File Structure

- Create: `packages/core/metadata/project/directoryStructure.ts`
  - Pure core-функция `describeMetadataProjectDirectoryStructure`.
  - Типы `MetadataProjectDirectoryStructure`, `MetadataProjectStructureNode`.
  - Нормализация путей и построение дерева допустимых дочерних элементов.
- Create: `packages/core/metadata/project/directoryStructure.test.ts`
  - Тесты корня, вида metadata, объекта, форм, вложенных подсистем, виртуальных путей, `depth`.
- Modify: `packages/core/metadata/project/index.ts`
  - Экспорт новой core-функции и типов.
- Modify: `packages/core/index.ts`
  - Публичный экспорт для MCP.
- Modify: `packages/mcp/src/coreApi.ts`
  - Добавить тип core-функции в `CoreApi`.
- Create: `packages/mcp/src/contracts/describeProjectStructure.ts`
  - Zod shapes входа/выхода MCP tool.
- Create: `packages/mcp/src/services/describeProjectStructure.ts`
  - Проверка `projectDir`, вызов core, преобразование ошибок.
- Create: `packages/mcp/src/services/describeProjectStructure.test.ts`
  - Тесты успешного ответа, отсутствующего `projectDir`, выхода за пределы проекта, неверного виртуального пути.
- Modify: `packages/mcp/src/tools/registerTools.ts`
  - Регистрация `nkdk.describe_project_structure`.
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
  - Ожидать пять tools.
- Modify: `README.md`
  - Добавить новый MCP tool в список.

---

### Task 1: Core Directory Structure Tests

**Files:**
- Create: `packages/core/metadata/project/directoryStructure.test.ts`

- [ ] **Step 1: Write failing core tests**

Create `packages/core/metadata/project/directoryStructure.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { metadataProjectSpecs } from "./specs"
import { describeMetadataProjectDirectoryStructure } from "./directoryStructure"

describe("metadata project directory structure", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  const createProject = (): string => {
    const projectDir = mkdtempSync(join(tmpdir(), "nakidka-project-structure-"))
    tempDirs.push(projectDir)
    return projectDir
  }

  it("describes root project structure", () => {
    const projectDir = createProject()

    const result = describeMetadataProjectDirectoryStructure({ projectDir, depth: 1 })

    expect(result.directoryPath).toBe("")
    expect(result.depth).toBe(1)
    expect(result.node.children?.map((child) => child.name)).toContain("Конфигурация.yaml")
    expect(result.node.children?.map((child) => child.name)).toEqual(
      expect.arrayContaining(metadataProjectSpecs.map((spec) => spec.dir)),
    )
    expect(result.node.children?.find((child) => child.name === "Справочник")).toMatchObject({
      kind: "directory",
      role: "metadataKind",
      pathTemplate: "Справочник",
      repeatable: false,
    })
  })

  it("describes metadata kind directories with an object-name template", () => {
    const projectDir = createProject()

    const result = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: "Справочник",
      depth: 1,
    })

    expect(result.node).toMatchObject({
      name: "Справочник",
      kind: "directory",
      role: "metadataKind",
    })
    expect(result.node.children).toEqual([
      expect.objectContaining({
        name: "<ИмяОбъекта>",
        kind: "directory",
        role: "metadataObject",
        pathTemplate: "Справочник/<ИмяОбъекта>",
        repeatable: true,
      }),
    ])
  })

  it("describes object directories", () => {
    const projectDir = createProject()

    const result = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: "Документ/Заказ",
      depth: 1,
    })

    expect(result.node.children).toEqual([
      expect.objectContaining({
        name: "Свойства.yaml",
        kind: "file",
        role: "properties",
        pathTemplate: "Документ/Заказ/Свойства.yaml",
        required: true,
      }),
      expect.objectContaining({
        name: "Формы",
        kind: "directory",
        role: "forms",
        pathTemplate: "Документ/Заказ/Формы",
        required: false,
      }),
    ])
  })

  it("describes form collection and form directories", () => {
    const projectDir = createProject()

    const forms = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: "Справочник/Товары/Формы",
      depth: 1,
    })
    expect(forms.node.children).toEqual([
      expect.objectContaining({
        name: "<ИмяФормы>",
        kind: "directory",
        role: "form",
        pathTemplate: "Справочник/Товары/Формы/<ИмяФормы>",
        repeatable: true,
      }),
    ])

    const form = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: "Справочник/Товары/Формы/ФормаЭлемента",
      depth: 1,
    })
    expect(form.node.children).toEqual([
      expect.objectContaining({
        name: "Форма.yaml",
        kind: "file",
        role: "formYaml",
        pathTemplate: "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
        required: true,
      }),
    ])
  })

  it("describes subsystem nesting without infinite recursion", () => {
    const projectDir = createProject()

    const result = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: "Подсистема/Администрирование",
    })

    expect(result.depth).toBeNull()
    expect(result.node.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Свойства.yaml", role: "properties" }),
        expect.objectContaining({
          name: "Подсистемы",
          kind: "directory",
          role: "subsystems",
          children: [
            expect.objectContaining({
              name: "<ИмяПодсистемы>",
              role: "subsystem",
              repeatable: true,
            }),
          ],
        }),
      ]),
    )
  })

  it("supports virtual directories that do not exist on disk", () => {
    const projectDir = createProject()

    const result = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: "Справочник/НовыйСправочник/Формы/НоваяФорма",
    })

    expect(result.node.children).toEqual([
      expect.objectContaining({
        name: "Форма.yaml",
        pathTemplate: "Справочник/НовыйСправочник/Формы/НоваяФорма/Форма.yaml",
      }),
    ])
  })

  it("rejects directories outside the project", () => {
    const projectDir = createProject()
    const outsideDir = createProject()

    expect(() =>
      describeMetadataProjectDirectoryStructure({
        projectDir,
        directoryPath: outsideDir,
      }),
    ).toThrow("Каталог находится вне указанного YAML-проекта")
  })

  it("rejects unsupported virtual directories and invalid depth", () => {
    const projectDir = createProject()

    expect(() =>
      describeMetadataProjectDirectoryStructure({
        projectDir,
        directoryPath: "Справочник/Товары/Команды",
      }),
    ).toThrow("Каталог не соответствует структуре metadata-проекта")

    expect(() =>
      describeMetadataProjectDirectoryStructure({
        projectDir,
        depth: 0,
      }),
    ).toThrow("depth должен быть положительным целым числом")
  })

  it("normalizes existing absolute directories inside the project", () => {
    const projectDir = createProject()
    const objectDir = join(projectDir, "Справочник", "Товары")
    mkdirSync(objectDir, { recursive: true })

    const result = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: objectDir,
      depth: 1,
    })

    expect(result.directoryPath).toBe("Справочник/Товары")
    expect(result.node.pathTemplate).toBe("Справочник/Товары")
  })

  it("limits child expansion by depth", () => {
    const projectDir = createProject()

    const result = describeMetadataProjectDirectoryStructure({
      projectDir,
      directoryPath: "Справочник/Товары",
      depth: 1,
    })

    expect(result.node.children?.find((child) => child.name === "Формы")?.children).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/project/directoryStructure.test.ts
```

Expected: FAIL because `./directoryStructure` does not exist.

- [ ] **Step 3: Commit failing tests**

```bash
git add packages/core/metadata/project/directoryStructure.test.ts
git commit -m "test: :white_check_mark: описать структуру каталогов metadata-проекта"
```

---

### Task 2: Core Directory Structure Implementation

**Files:**
- Create: `packages/core/metadata/project/directoryStructure.ts`
- Modify: `packages/core/metadata/project/index.ts`
- Modify: `packages/core/index.ts`
- Test: `packages/core/metadata/project/directoryStructure.test.ts`

- [ ] **Step 1: Implement the core structure builder**

Create `packages/core/metadata/project/directoryStructure.ts`:

```ts
import { existsSync, statSync } from "fs"
import { isAbsolute, relative, resolve, sep } from "path"
import { CONFIGURATION_YAML_FILE } from "~/metadata/appliedObjects/configuration/rootIO"
import { describeMetadataRuleResources } from "./ruleResources"
import { getMetadataProjectSpecByDir, metadataProjectSpecs, type MetadataProjectSpec } from "./specs"

const PROPERTIES_FILE = "Свойства.yaml"
const FORM_FILE = "Форма.yaml"
const FORMS_DIR = "Формы"
const SUBSYSTEM_DIR = "Подсистема"
const CHILD_SUBSYSTEMS_DIR = "Подсистемы"

export interface DescribeMetadataProjectDirectoryStructureParams {
  projectDir: string
  directoryPath?: string
  depth?: number
}

export interface MetadataProjectDirectoryStructure {
  projectDir: string
  directoryPath: string
  depth: number | null
  node: MetadataProjectStructureNode
}

export interface MetadataProjectStructureNode {
  name: string
  kind: "directory" | "file"
  pathTemplate: string
  role: string
  required: boolean
  repeatable: boolean
  description: string
  children?: MetadataProjectStructureNode[]
}

type DirectoryPosition =
  | { kind: "root" }
  | { kind: "metadataKind"; spec: MetadataProjectSpec; dir: string }
  | { kind: "metadataObject"; spec: MetadataProjectSpec; dir: string; name: string }
  | { kind: "forms"; spec: MetadataProjectSpec; dir: string; ownerName: string }
  | { kind: "form"; spec: MetadataProjectSpec; dir: string; ownerName: string; formName: string }
  | { kind: "subsystems"; ownerPath: string }

export function describeMetadataProjectDirectoryStructure(
  params: DescribeMetadataProjectDirectoryStructureParams,
): MetadataProjectDirectoryStructure {
  const projectDir = resolve(params.projectDir)
  const directoryPath = normalizeProjectDirectoryPath(projectDir, params.directoryPath)
  const depth = normalizeDepth(params.depth)
  const position = classifyDirectoryPosition(directoryPath)
  if (position === undefined) {
    throw new Error("Каталог не соответствует структуре metadata-проекта")
  }

  return {
    projectDir,
    directoryPath,
    depth,
    node: withLimitedChildren(createNode(position, directoryPath), depth),
  }
}

function normalizeDepth(depth: number | undefined): number | null {
  if (depth === undefined) return null
  if (!Number.isInteger(depth) || depth < 1) {
    throw new Error("depth должен быть положительным целым числом")
  }
  return depth
}

function normalizeProjectDirectoryPath(projectDir: string, directoryPath: string | undefined): string {
  if (directoryPath === undefined || directoryPath.trim() === "") return ""

  const absolutePath = isAbsolute(directoryPath) ? resolve(directoryPath) : resolve(projectDir, directoryPath)
  const projectPath = relative(projectDir, absolutePath)
  if (projectPath === "" && isExistingDirectory(absolutePath)) return ""
  if (projectPath.startsWith("..") || isAbsolute(projectPath)) {
    throw new Error("Каталог находится вне указанного YAML-проекта")
  }

  return toProjectSeparators(projectPath).replace(/\/+$/, "")
}

function classifyDirectoryPosition(directoryPath: string): DirectoryPosition | undefined {
  if (directoryPath === "") return { kind: "root" }

  const parts = directoryPath.split("/")
  if (parts.some((part) => part.length === 0)) return undefined

  if (parts[0] === SUBSYSTEM_DIR) return classifySubsystemPosition(parts)

  if (parts.length === 1) {
    const spec = getMetadataProjectSpecByDir(parts[0])
    return spec ? { kind: "metadataKind", spec, dir: parts[0] } : undefined
  }

  if (parts.length === 2) {
    const spec = getMetadataProjectSpecByDir(parts[0])
    return spec ? { kind: "metadataObject", spec, dir: parts[0], name: parts[1] } : undefined
  }

  if (parts.length === 3 && parts[2] === FORMS_DIR) {
    const spec = getMetadataProjectSpecByDir(parts[0])
    return spec ? { kind: "forms", spec, dir: parts[0], ownerName: parts[1] } : undefined
  }

  if (parts.length === 4 && parts[2] === FORMS_DIR) {
    const spec = getMetadataProjectSpecByDir(parts[0])
    return spec ? { kind: "form", spec, dir: parts[0], ownerName: parts[1], formName: parts[3] } : undefined
  }

  return undefined
}

function classifySubsystemPosition(parts: string[]): DirectoryPosition | undefined {
  const spec = getMetadataProjectSpecByDir(SUBSYSTEM_DIR)
  if (!spec || parts.length < 1) return undefined

  if (parts.length === 1) return { kind: "metadataKind", spec, dir: SUBSYSTEM_DIR }
  if (parts.length % 2 === 0) {
    for (let index = 2; index < parts.length; index += 2) {
      if (parts[index] !== CHILD_SUBSYSTEMS_DIR) return undefined
    }
    return { kind: "metadataObject", spec, dir: SUBSYSTEM_DIR, name: parts[parts.length - 1] }
  }
  if (parts.length >= 3 && parts[parts.length - 1] === CHILD_SUBSYSTEMS_DIR) {
    for (let index = 2; index < parts.length - 1; index += 2) {
      if (parts[index] !== CHILD_SUBSYSTEMS_DIR) return undefined
    }
    return { kind: "subsystems", ownerPath: parts.slice(0, -1).join("/") }
  }
  return undefined
}

function createNode(position: DirectoryPosition, directoryPath: string): MetadataProjectStructureNode {
  switch (position.kind) {
    case "root":
      return directory("", "root", "", "Корень YAML-проекта", false, false, [
        file(CONFIGURATION_YAML_FILE, "configuration", CONFIGURATION_YAML_FILE, "Корневой YAML-файл конфигурации", true),
        ...metadataProjectSpecs.map((spec) =>
          directory(spec.dir, "metadataKind", spec.dir, `Каталог metadata-объектов вида ${spec.dir}`, false, false, [
            objectTemplate(spec.dir),
          ]),
        ),
      ])
    case "metadataKind":
      return directory(position.dir, "metadataKind", position.dir, `Каталог metadata-объектов вида ${position.dir}`, false, false, [
        objectTemplate(position.dir),
      ])
    case "metadataObject":
      return metadataObjectNode(position, directoryPath)
    case "forms":
      return directory(lastSegment(directoryPath), "forms", directoryPath, "Каталог форм metadata-объекта", false, false, [
        directory("<ИмяФормы>", "form", `${directoryPath}/<ИмяФормы>`, "Каталог формы", false, true, [
          file(FORM_FILE, "formYaml", `${directoryPath}/<ИмяФормы>/${FORM_FILE}`, "YAML-файл формы", true),
        ]),
      ])
    case "form":
      return directory(position.formName, "form", directoryPath, "Каталог формы", false, false, [
        file(FORM_FILE, "formYaml", `${directoryPath}/${FORM_FILE}`, "YAML-файл формы", true),
      ])
    case "subsystems":
      return directory(lastSegment(directoryPath), "subsystems", directoryPath, "Каталог вложенных подсистем", false, false, [
        directory("<ИмяПодсистемы>", "subsystem", `${directoryPath}/<ИмяПодсистемы>`, "Каталог вложенной подсистемы", false, true, [
          file(PROPERTIES_FILE, "properties", `${directoryPath}/<ИмяПодсистемы>/${PROPERTIES_FILE}`, "YAML-файл свойств подсистемы", true),
          directory(CHILD_SUBSYSTEMS_DIR, "subsystems", `${directoryPath}/<ИмяПодсистемы>/${CHILD_SUBSYSTEMS_DIR}`, "Каталог вложенных подсистем", false, false),
        ]),
      ])
  }
}

function metadataObjectNode(position: Extract<DirectoryPosition, { kind: "metadataObject" }>, directoryPath: string): MetadataProjectStructureNode {
  const children = [
    file(PROPERTIES_FILE, "properties", `${directoryPath}/${PROPERTIES_FILE}`, `YAML-файл свойств объекта ${position.dir}`, true),
    directory(FORMS_DIR, "forms", `${directoryPath}/${FORMS_DIR}`, "Каталог форм metadata-объекта", false, false, [
      directory("<ИмяФормы>", "form", `${directoryPath}/${FORMS_DIR}/<ИмяФормы>`, "Каталог формы", false, true, [
        file(FORM_FILE, "formYaml", `${directoryPath}/${FORMS_DIR}/<ИмяФормы>/${FORM_FILE}`, "YAML-файл формы", true),
      ]),
    ]),
    ...externalResourceNodes(position.spec, directoryPath),
  ]

  if (position.dir === SUBSYSTEM_DIR) {
    children.push(
      directory(CHILD_SUBSYSTEMS_DIR, "subsystems", `${directoryPath}/${CHILD_SUBSYSTEMS_DIR}`, "Каталог вложенных подсистем", false, false, [
        directory("<ИмяПодсистемы>", "subsystem", `${directoryPath}/${CHILD_SUBSYSTEMS_DIR}/<ИмяПодсистемы>`, "Каталог вложенной подсистемы", false, true, [
          file(PROPERTIES_FILE, "properties", `${directoryPath}/${CHILD_SUBSYSTEMS_DIR}/<ИмяПодсистемы>/${PROPERTIES_FILE}`, "YAML-файл свойств подсистемы", true),
        ]),
      ]),
    )
  }

  return directory(position.name, "metadataObject", directoryPath, `Каталог metadata-объекта вида ${position.dir}`, false, false, children)
}

function externalResourceNodes(spec: MetadataProjectSpec, objectPath: string): MetadataProjectStructureNode[] {
  return describeMetadataRuleResources(spec.rule).flatMap((resource) => {
    if (resource.kind === "asset") {
      return [
        directory(resource.nkdkDir, "externalFileDirectory", `${objectPath}/${resource.nkdkDir}`, `Каталог внешних файлов свойства ${resource.propertyName}`, false, false),
      ]
    }
    if (resource.kind === "dynamic") {
      return [
        directory("<ДинамическиеРесурсы>", "dynamicExternalResources", `${objectPath}/<ДинамическиеРесурсы>`, `Динамические внешние ресурсы свойства ${resource.propertyName}`, false, true),
      ]
    }
    return []
  })
}

function objectTemplate(dir: string): MetadataProjectStructureNode {
  return directory("<ИмяОбъекта>", "metadataObject", `${dir}/<ИмяОбъекта>`, "Каталог metadata-объекта", false, true, [
    file(PROPERTIES_FILE, "properties", `${dir}/<ИмяОбъекта>/${PROPERTIES_FILE}`, "YAML-файл свойств объекта", true),
    directory(FORMS_DIR, "forms", `${dir}/<ИмяОбъекта>/${FORMS_DIR}`, "Каталог форм metadata-объекта", false, false),
  ])
}

function withLimitedChildren(node: MetadataProjectStructureNode, depth: number | null): MetadataProjectStructureNode {
  if (depth === null) return node
  if (depth <= 0) {
    const { children: _children, ...withoutChildren } = node
    return withoutChildren
  }
  return {
    ...node,
    ...(node.children === undefined ? {} : { children: node.children.map((child) => withLimitedChildren(child, depth - 1)) }),
  }
}

function directory(
  name: string,
  role: string,
  pathTemplate: string,
  description: string,
  required: boolean,
  repeatable: boolean,
  children?: MetadataProjectStructureNode[],
): MetadataProjectStructureNode {
  return {
    name,
    kind: "directory",
    pathTemplate,
    role,
    required,
    repeatable,
    description,
    ...(children === undefined ? {} : { children }),
  }
}

function file(
  name: string,
  role: string,
  pathTemplate: string,
  description: string,
  required: boolean,
): MetadataProjectStructureNode {
  return {
    name,
    kind: "file",
    pathTemplate,
    role,
    required,
    repeatable: false,
    description,
  }
}

function lastSegment(path: string): string {
  return path.split("/").at(-1) ?? ""
}

function toProjectSeparators(filePath: string): string {
  return filePath.split(sep).join("/")
}

function isExistingDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory()
}
```

- [ ] **Step 2: Export from project index**

Modify `packages/core/metadata/project/index.ts`:

```ts
export {
  describeMetadataProjectDirectoryStructure,
  type DescribeMetadataProjectDirectoryStructureParams,
  type MetadataProjectDirectoryStructure,
  type MetadataProjectStructureNode,
} from "./directoryStructure"
export {
  describeMetadataRuleResources,
  type MetadataProjectAssetDescriptor,
  type MetadataProjectConfigurationYamlDescriptor,
  type MetadataProjectDynamicDescriptor,
  type MetadataProjectExternalXmlBaseDescriptor,
  type MetadataProjectExternalXmlDescriptor,
  type MetadataProjectExternalXmlPathDescriptor,
  type MetadataProjectObjectXmlDescriptor,
  type MetadataProjectPropertiesYamlDescriptor,
  type MetadataProjectResourceDescriptor,
  type MetadataProjectXmlDescriptor,
  type MetadataProjectYamlDescriptor,
} from "./ruleResources"
```

- [ ] **Step 3: Export from package root**

Modify the `./metadata/project` export block in `packages/core/index.ts` so it includes:

```ts
export {
  describeMetadataProjectDirectoryStructure,
  describeMetadataRuleResources,
  type DescribeMetadataProjectDirectoryStructureParams,
  type MetadataProjectAssetDescriptor,
  type MetadataProjectConfigurationYamlDescriptor,
  type MetadataProjectDirectoryStructure,
  type MetadataProjectDynamicDescriptor,
  type MetadataProjectExternalXmlBaseDescriptor,
  type MetadataProjectExternalXmlDescriptor,
  type MetadataProjectExternalXmlPathDescriptor,
  type MetadataProjectObjectXmlDescriptor,
  type MetadataProjectPropertiesYamlDescriptor,
  type MetadataProjectResourceDescriptor,
  type MetadataProjectStructureNode,
  type MetadataProjectXmlDescriptor,
  type MetadataProjectYamlDescriptor,
} from "./metadata/project"
```

- [ ] **Step 4: Run core tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/project/directoryStructure.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run related project tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/project/resources.test.ts packages/core/metadata/project/specs.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit core implementation**

```bash
git add packages/core/metadata/project/directoryStructure.ts packages/core/metadata/project/index.ts packages/core/index.ts
git commit -m "feat: :sparkles: описать структуру каталогов metadata-проекта"
```

---

### Task 3: MCP Contract And Service

**Files:**
- Modify: `packages/mcp/src/coreApi.ts`
- Create: `packages/mcp/src/contracts/describeProjectStructure.ts`
- Create: `packages/mcp/src/services/describeProjectStructure.ts`
- Create: `packages/mcp/src/services/describeProjectStructure.test.ts`

- [ ] **Step 1: Add CoreApi method type**

Modify `packages/mcp/src/coreApi.ts`:

```ts
export interface MetadataProjectStructureNode {
  name: string
  kind: "directory" | "file"
  pathTemplate: string
  role: string
  required: boolean
  repeatable: boolean
  description: string
  children?: MetadataProjectStructureNode[]
}

export interface MetadataProjectDirectoryStructure {
  projectDir: string
  directoryPath: string
  depth: number | null
  node: MetadataProjectStructureNode
}
```

Then add this method inside `CoreApi`:

```ts
describeMetadataProjectDirectoryStructure(params: {
  projectDir: string
  directoryPath?: string
  depth?: number
}): MetadataProjectDirectoryStructure
```

- [ ] **Step 2: Create MCP contract**

Create `packages/mcp/src/contracts/describeProjectStructure.ts`:

```ts
import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"

export const describeProjectStructureInputShape = {
  projectDir: z.string().min(1),
  directoryPath: z.string().optional(),
  depth: z.number().int().positive().optional(),
}

export const metadataProjectStructureNodeSchema: z.ZodType<{
  name: string
  kind: "directory" | "file"
  pathTemplate: string
  role: string
  required: boolean
  repeatable: boolean
  description: string
  children?: Array<{
    name: string
    kind: "directory" | "file"
    pathTemplate: string
    role: string
    required: boolean
    repeatable: boolean
    description: string
    children?: unknown[]
  }>
}> = z.lazy(() =>
  z.object({
    name: z.string(),
    kind: z.enum(["directory", "file"]),
    pathTemplate: z.string(),
    role: z.string(),
    required: z.boolean(),
    repeatable: z.boolean(),
    description: z.string(),
    children: z.array(metadataProjectStructureNodeSchema).optional(),
  }),
)

export const describeProjectStructureSuccessOutputShape = {
  ok: z.literal(true),
  projectDir: z.string(),
  directoryPath: z.string(),
  depth: z.number().nullable(),
  node: metadataProjectStructureNodeSchema,
}

export const describeProjectStructureOutputShape = z.union([
  z.object(describeProjectStructureSuccessOutputShape),
  z.object(toolErrorOutputShape),
])

export type DescribeProjectStructureInput = z.infer<z.ZodObject<typeof describeProjectStructureInputShape>>
```

- [ ] **Step 3: Create MCP service**

Create `packages/mcp/src/services/describeProjectStructure.ts`:

```ts
import { existsSync, statSync } from "fs"
import { resolve } from "path"
import { loadCoreApi, type MetadataProjectDirectoryStructure } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import type { DescribeProjectStructureInput } from "../contracts/describeProjectStructure"

export type DescribeProjectStructurePayload = ToolPayload<MetadataProjectDirectoryStructure>

const invalidArgumentMessages = new Set([
  "Каталог находится вне указанного YAML-проекта",
  "Каталог не соответствует структуре metadata-проекта",
  "depth должен быть положительным целым числом",
])

export async function describeProjectStructure(
  input: DescribeProjectStructureInput,
): Promise<DescribeProjectStructurePayload> {
  const projectDir = resolve(input.projectDir)

  if (!existsSync(projectDir)) {
    return toolError("not_found", "YAML-проект не найден", { projectDir: input.projectDir })
  }

  if (!statSync(projectDir).isDirectory()) {
    return toolError("invalid_arguments", "Путь не является каталогом YAML-проекта", { projectDir: input.projectDir })
  }

  try {
    const core = await loadCoreApi()
    return toolSuccess(
      core.describeMetadataProjectDirectoryStructure({
        projectDir,
        ...(input.directoryPath !== undefined ? { directoryPath: input.directoryPath } : {}),
        ...(input.depth !== undefined ? { depth: input.depth } : {}),
      }),
    )
  } catch (caught) {
    if (caught instanceof Error && invalidArgumentMessages.has(caught.message)) {
      return toolError("invalid_arguments", caught.message)
    }
    return toolError("core_error", errorMessage(caught))
  }
}
```

- [ ] **Step 4: Write MCP service tests**

Create `packages/mcp/src/services/describeProjectStructure.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { describeProjectStructure } from "./describeProjectStructure"

describe("describeProjectStructure service", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("returns project structure as JSON payload", async () => {
    const projectDir = createProject()

    const result = await describeProjectStructure({ projectDir, directoryPath: "Справочник/Товары", depth: 1 })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)
    expect(result.directoryPath).toBe("Справочник/Товары")
    expect(result.depth).toBe(1)
    expect(result.node.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Свойства.yaml", kind: "file" }),
        expect.objectContaining({ name: "Формы", kind: "directory" }),
      ]),
    )
  })

  it("returns not_found for a missing project directory", async () => {
    const projectDir = join(tmpdir(), "nakidka-missing-project-structure")

    const result = await describeProjectStructure({ projectDir })

    expect(result).toEqual({
      ok: false,
      code: "not_found",
      message: "YAML-проект не найден",
      details: { projectDir },
    })
  })

  it("returns invalid_arguments for a file projectDir", async () => {
    const projectDir = createProject()
    const filePath = join(projectDir, "not-dir")
    writeFileSync(filePath, "")

    const result = await describeProjectStructure({ projectDir: filePath })

    expect(result).toEqual({
      ok: false,
      code: "invalid_arguments",
      message: "Путь не является каталогом YAML-проекта",
      details: { projectDir: filePath },
    })
  })

  it("returns invalid_arguments for outside and unsupported directories", async () => {
    const projectDir = createProject()
    const outsideDir = createProject()

    const outside = await describeProjectStructure({ projectDir, directoryPath: outsideDir })
    expect(outside.ok).toBe(false)
    if (outside.ok) throw new Error("expected failure")
    expect(outside.code).toBe("invalid_arguments")
    expect(outside.message).toBe("Каталог находится вне указанного YAML-проекта")

    const unsupported = await describeProjectStructure({ projectDir, directoryPath: "Справочник/Товары/Команды" })
    expect(unsupported.ok).toBe(false)
    if (unsupported.ok) throw new Error("expected failure")
    expect(unsupported.code).toBe("invalid_arguments")
    expect(unsupported.message).toBe("Каталог не соответствует структуре metadata-проекта")
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nakidka-mcp-project-structure-"))
    mkdirSync(projectDir, { recursive: true })
    tempDirs.push(projectDir)
    return projectDir
  }
})
```

- [ ] **Step 5: Run MCP service tests**

Run:

```bash
pnpm --filter @nakidka/mcp exec vitest run packages/mcp/src/services/describeProjectStructure.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit MCP service**

```bash
git add packages/mcp/src/coreApi.ts packages/mcp/src/contracts/describeProjectStructure.ts packages/mcp/src/services/describeProjectStructure.ts packages/mcp/src/services/describeProjectStructure.test.ts
git commit -m "feat: :sparkles: добавить MCP-сервис структуры проекта"
```

---

### Task 4: MCP Tool Registration And README

**Files:**
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Register new tool**

Modify imports in `packages/mcp/src/tools/registerTools.ts`:

```ts
import {
  describeProjectStructureInputShape,
  describeProjectStructureOutputShape,
} from "../contracts/describeProjectStructure"
import { describeProjectStructure } from "../services/describeProjectStructure"
```

Add this registration after `nkdk.get_schema`:

```ts
  server.registerTool(
    "nkdk.describe_project_structure",
    {
      title: "Describe NKDK project structure",
      description: "Возвращает допустимые файлы и подкаталоги для каталога NKDK YAML-проекта.",
      inputSchema: describeProjectStructureInputShape,
      outputSchema: describeProjectStructureOutputShape,
    },
    async (input) => jsonToolResult(await describeProjectStructure(input)),
  )
```

- [ ] **Step 2: Update registration test**

Modify `packages/mcp/src/tools/registerTools.test.ts`:

```ts
describe("registerNkdkCapabilities", () => {
  it("registers five tools, four resources, and four prompts", () => {
    const calls = {
      tools: [] as string[],
      resources: [] as string[],
      prompts: [] as string[],
    }
    const server = {
      registerTool: vi.fn((name: string) => calls.tools.push(name)),
      registerResource: vi.fn((name: string) => calls.resources.push(name)),
      registerPrompt: vi.fn((name: string) => calls.prompts.push(name)),
    }

    registerNkdkCapabilities(server as unknown as Parameters<typeof registerNkdkCapabilities>[0])

    expect(calls.tools).toEqual([
      "nkdk.get_schema",
      "nkdk.describe_project_structure",
      "nkdk.validate_project",
      "nkdk.import_from_xml",
      "nkdk.sync_to_xml",
    ])
    expect(calls.resources).toEqual([
      "config-edit-yaml",
      "config-import-from-xml",
      "config-sync-to-xml",
      "config-validate-yaml",
    ])
    expect(calls.prompts).toEqual([
      "nkdk_config_edit_yaml",
      "nkdk_config_import_from_xml",
      "nkdk_config_sync_to_xml",
      "nkdk_config_validate_yaml",
    ])
  })
})
```

- [ ] **Step 3: Update README MCP tool list**

Modify the MCP tools list in `README.md`:

```md
- `nkdk.get_schema` — получить схему YAML-файла или краткую сводку по ней;
- `nkdk.describe_project_structure` — узнать допустимые файлы и подкаталоги для каталога YAML-проекта;
- `nkdk.validate_project` — проверить YAML-проект и получить diagnostics;
- `nkdk.import_from_xml` — импортировать XML-выгрузку 1С в YAML;
- `nkdk.sync_to_xml` — синхронизировать YAML-проект обратно в XML.
```

- [ ] **Step 4: Run MCP tests**

Run:

```bash
pnpm --filter @nakidka/mcp test
```

Expected: PASS.

- [ ] **Step 5: Commit registration and docs**

```bash
git add packages/mcp/src/tools/registerTools.ts packages/mcp/src/tools/registerTools.test.ts README.md
git commit -m "docs: :memo: описать MCP tool структуры проекта"
```

---

### Task 5: Type Check And Full Verification

**Files:**
- No new files.

- [ ] **Step 1: Run package type checks**

Run:

```bash
pnpm --filter @nakidka/core type-check
pnpm --filter @nakidka/mcp type-check
```

Expected: both commands PASS.

- [ ] **Step 2: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/project/directoryStructure.test.ts packages/core/metadata/project/resources.test.ts packages/core/metadata/project/specs.test.ts
pnpm --filter @nakidka/mcp test
```

Expected: both commands PASS.

- [ ] **Step 3: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: PASS across all packages.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git status --short
git log --oneline -n 5
```

Expected:

- `git status --short` shows no unstaged or uncommitted files.
- Recent commits include the four implementation commits from this plan.

---

## Self-Review

Spec coverage:

- Core function in `metadata/project`: Task 2.
- MCP tool contract and service: Task 3.
- Registration: Task 4.
- README update: Task 4.
- Virtual directories, depth, nested subsystems, root/object/form scenarios: Task 1 tests and Task 2 implementation.
- Error handling: Task 1 and Task 3 tests.

Placeholder scan:

- No `TBD`, `TODO`, or undefined follow-up sections.

Type consistency:

- Public function name is consistently `describeMetadataProjectDirectoryStructure`.
- MCP tool/service/contract name is consistently `describeProjectStructure`.
- Output node fields match the spec: `name`, `kind`, `pathTemplate`, `role`, `required`, `repeatable`, `description`, `children`.
