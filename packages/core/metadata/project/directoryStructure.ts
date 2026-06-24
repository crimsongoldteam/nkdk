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
  | { kind: "metadataKind"; dir: string; spec: MetadataProjectSpec }
  | { kind: "metadataObject"; dir: string; name: string; spec: MetadataProjectSpec }
  | { kind: "forms"; dir: string; ownerName: string; spec: MetadataProjectSpec }
  | { kind: "form"; dir: string; ownerName: string; formName: string; spec: MetadataProjectSpec }
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
    return spec ? { kind: "metadataKind", dir: parts[0], spec } : undefined
  }

  if (parts.length === 2) {
    const spec = getMetadataProjectSpecByDir(parts[0])
    return spec ? { kind: "metadataObject", dir: parts[0], name: parts[1], spec } : undefined
  }

  if (parts.length === 3 && parts[2] === FORMS_DIR) {
    const spec = getMetadataProjectSpecByDir(parts[0])
    return spec ? { kind: "forms", dir: parts[0], ownerName: parts[1], spec } : undefined
  }

  if (parts.length === 4 && parts[2] === FORMS_DIR) {
    const spec = getMetadataProjectSpecByDir(parts[0])
    return spec ? { kind: "form", dir: parts[0], ownerName: parts[1], formName: parts[3], spec } : undefined
  }

  return undefined
}

function classifySubsystemPosition(parts: string[]): DirectoryPosition | undefined {
  const spec = getMetadataProjectSpecByDir(SUBSYSTEM_DIR)
  if (!spec) return undefined

  if (parts.length === 1) return { kind: "metadataKind", dir: SUBSYSTEM_DIR, spec }

  if (parts.length % 2 === 0) {
    for (let index = 2; index < parts.length; index += 2) {
      if (parts[index] !== CHILD_SUBSYSTEMS_DIR) return undefined
    }
    return { kind: "metadataObject", dir: SUBSYSTEM_DIR, name: parts[parts.length - 1], spec }
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
      return directory(
        position.dir,
        "metadataKind",
        position.dir,
        `Каталог metadata-объектов вида ${position.dir}`,
        false,
        false,
        [objectTemplate(position.dir)],
      )
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
        directory(
          "<ИмяПодсистемы>",
          "subsystem",
          `${directoryPath}/<ИмяПодсистемы>`,
          "Каталог вложенной подсистемы",
          false,
          true,
          [
            file(
              PROPERTIES_FILE,
              "properties",
              `${directoryPath}/<ИмяПодсистемы>/${PROPERTIES_FILE}`,
              "YAML-файл свойств подсистемы",
              true,
            ),
            directory(
              CHILD_SUBSYSTEMS_DIR,
              "subsystems",
              `${directoryPath}/<ИмяПодсистемы>/${CHILD_SUBSYSTEMS_DIR}`,
              "Каталог вложенных подсистем",
              false,
              false,
            ),
          ],
        ),
      ])
  }
}

function metadataObjectNode(
  position: Extract<DirectoryPosition, { kind: "metadataObject" }>,
  directoryPath: string,
): MetadataProjectStructureNode {
  const children: MetadataProjectStructureNode[] = [
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
      directory(
        CHILD_SUBSYSTEMS_DIR,
        "subsystems",
        `${directoryPath}/${CHILD_SUBSYSTEMS_DIR}`,
        "Каталог вложенных подсистем",
        false,
        false,
        [
          directory(
            "<ИмяПодсистемы>",
            "subsystem",
            `${directoryPath}/${CHILD_SUBSYSTEMS_DIR}/<ИмяПодсистемы>`,
            "Каталог вложенной подсистемы",
            false,
            true,
            [
              file(
                PROPERTIES_FILE,
                "properties",
                `${directoryPath}/${CHILD_SUBSYSTEMS_DIR}/<ИмяПодсистемы>/${PROPERTIES_FILE}`,
                "YAML-файл свойств подсистемы",
                true,
              ),
            ],
          ),
        ],
      ),
    )
  }

  return directory(
    position.name,
    "metadataObject",
    directoryPath,
    `Каталог metadata-объекта вида ${position.dir}`,
    false,
    false,
    children,
  )
}

function externalResourceNodes(spec: MetadataProjectSpec, objectPath: string): MetadataProjectStructureNode[] {
  return describeMetadataRuleResources(spec.rule).flatMap((resource) => {
    if (resource.kind === "asset") {
      return [
        directory(
          resource.nkdkDir,
          "externalFileDirectory",
          `${objectPath}/${resource.nkdkDir}`,
          `Каталог внешних файлов свойства ${resource.propertyName}`,
          false,
          false,
        ),
      ]
    }

    if (resource.kind === "dynamic") {
      return [
        directory(
          "<ДинамическиеРесурсы>",
          "dynamicExternalResources",
          `${objectPath}/<ДинамическиеРесурсы>`,
          `Динамические внешние ресурсы свойства ${resource.propertyName}`,
          false,
          true,
        ),
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
  const parts = path.split("/")
  return parts[parts.length - 1] ?? ""
}

function toProjectSeparators(filePath: string): string {
  return filePath.split(sep).join("/")
}

function isExistingDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory()
}
