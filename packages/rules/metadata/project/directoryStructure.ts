import { resolve } from "path"
import { CONFIGURATION_YAML_FILE } from "./constants"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"
import { getMetadataProjectSpecByDir, metadataProjectSpecs, type MetadataProjectSpec } from "../projectDefinition/specs"
import { projectPathFromFileSystem } from "../projectDefinition/path"
import type { RuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"

const PROPERTIES_FILE = "Свойства.yaml"

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

type ProjectStructureRegistries = Pick<
  RuleRegistrySet,
  "projectSpecs" | "resourceTopology"
>

type DirectoryPosition =
  | { kind: "root" }
  | { kind: "metadataKind"; dir: string; spec: MetadataProjectSpec }
  | { kind: "metadataObject"; dir: string; name: string; spec: MetadataProjectSpec }
  | { kind: "fileItemDirectory"; dirName: string; ownerPath: string; resourcePattern: string }
  | { kind: "fileItem"; itemName: string; fileName: string; ownerPath: string; resourcePattern: string }
  | { kind: "recursiveChildren"; ownerPath: string; spec: MetadataProjectSpec }

export function describeMetadataProjectDirectoryStructure(
  params: DescribeMetadataProjectDirectoryStructureParams,
  registries?: ProjectStructureRegistries,
): MetadataProjectDirectoryStructure {
  const projectDir = resolve(params.projectDir)
  const directoryPath = normalizeProjectDirectoryPath(projectDir, params.directoryPath)
  const depth = normalizeDepth(params.depth)
  const position = classifyDirectoryPosition(directoryPath, registries)

  if (position === undefined) {
    throw new Error("Каталог не соответствует структуре metadata-проекта")
  }

  return {
    projectDir,
    directoryPath,
    depth,
    node: withLimitedChildren(createNode(position, directoryPath, registries), depth),
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

  try {
    return projectPathFromFileSystem(projectDir, directoryPath, { allowRoot: true })
  } catch {
    throw new Error("Каталог находится вне указанного YAML-проекта")
  }
}

function classifyDirectoryPosition(
  directoryPath: string,
  registries?: ProjectStructureRegistries,
): DirectoryPosition | undefined {
  if (directoryPath === "") return { kind: "root" }

  const parts = directoryPath.split("/")
  if (parts.some((part) => part.length === 0)) return undefined

  if (parts.length === 1) {
    const spec = projectSpecByDir(parts[0], registries)
    return spec ? { kind: "metadataKind", dir: parts[0], spec } : undefined
  }

  if (parts.length === 2) {
    const spec = projectSpecByDir(parts[0], registries)
    return spec ? { kind: "metadataObject", dir: parts[0], name: parts[1], spec } : undefined
  }

  const spec = projectSpecByDir(parts[0], registries)
  if (!spec) return undefined
  const ownerPath = parts.slice(0, 2).join("/")
  const fileItemPosition = classifyFileItemPosition(
    parts.slice(2),
    ownerPath,
    spec,
    registries,
  )
  if (fileItemPosition) return fileItemPosition

  const recursivePosition = classifyRecursiveChildrenPosition(parts, spec)
  if (recursivePosition) return recursivePosition

  return undefined
}

function classifyFileItemPosition(
  relativeParts: string[],
  ownerPath: string,
  spec: MetadataProjectSpec,
  registries?: ProjectStructureRegistries,
): DirectoryPosition | undefined {
  for (const resource of topologyResourcesForSpec(spec, registries)) {
    if (resource.kind !== "content" || resource.role !== "fileItem") continue
    const [dirName, itemPlaceholder, fileName] = resource.projectPattern.split("/")
    if (!dirName || itemPlaceholder !== "{itemName}" || !fileName) continue

    if (relativeParts.length === 1 && relativeParts[0] === dirName) {
      return { kind: "fileItemDirectory", dirName, ownerPath, resourcePattern: resource.projectPattern }
    }

    if (relativeParts.length === 2 && relativeParts[0] === dirName && relativeParts[1]) {
      return {
        kind: "fileItem",
        itemName: relativeParts[1],
        fileName,
        ownerPath,
        resourcePattern: resource.projectPattern,
      }
    }
  }

  return undefined
}

function classifyRecursiveChildrenPosition(parts: string[], spec: MetadataProjectSpec): DirectoryPosition | undefined {
  const nesting = spec.nesting
  if (nesting?.kind !== "recursiveChildDir") return undefined

  if (parts.length % 2 === 0) {
    for (let index = 2; index < parts.length; index += 2) {
      if (parts[index] !== nesting.childDir) return undefined
    }
    return { kind: "metadataObject", dir: spec.dir, name: parts[parts.length - 1], spec }
  }

  if (parts.length >= 3 && parts[parts.length - 1] === nesting.childDir) {
    for (let index = 2; index < parts.length - 1; index += 2) {
      if (parts[index] !== nesting.childDir) return undefined
    }
    return { kind: "recursiveChildren", ownerPath: parts.slice(0, -1).join("/"), spec }
  }

  return undefined
}

function createNode(
  position: DirectoryPosition,
  directoryPath: string,
  registries?: ProjectStructureRegistries,
): MetadataProjectStructureNode {
  switch (position.kind) {
    case "root":
      return directory("", "root", "", "Корень YAML-проекта", false, false, [
        file(
          CONFIGURATION_YAML_FILE,
          "configuration",
          CONFIGURATION_YAML_FILE,
          "Корневой YAML-файл конфигурации",
          true
        ),
        ...projectSpecs(registries).map((spec) =>
          directory(spec.dir, "metadataKind", spec.dir, `Каталог metadata-объектов вида ${spec.dir}`, false, false, [
            objectTemplate(spec.dir),
          ])
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
        [objectTemplate(position.dir)]
      )
    case "metadataObject":
      return metadataObjectNode(position, directoryPath, registries)
    case "fileItemDirectory":
      return directory(
        lastSegment(directoryPath),
        "fileItemDirectory",
        directoryPath,
        "Каталог файловых дочерних объектов",
        false,
        false,
        [
          directory(
            "<ИмяОбъекта>",
            "fileItem",
            `${directoryPath}/<ИмяОбъекта>`,
            "Каталог файлового дочернего объекта",
            false,
            true,
            [
              file(
                lastSegment(position.resourcePattern),
                "fileItemYaml",
                `${directoryPath}/<ИмяОбъекта>/${lastSegment(position.resourcePattern)}`,
                "YAML-файл файлового дочернего объекта",
                true
              ),
            ]
          ),
        ]
      )
    case "fileItem":
      return directory(
        position.itemName,
        "fileItem",
        directoryPath,
        "Каталог файлового дочернего объекта",
        false,
        false,
        [
          file(
            position.fileName,
            "fileItemYaml",
            `${directoryPath}/${position.fileName}`,
            "YAML-файл файлового дочернего объекта",
            true
          ),
        ]
      )
    case "recursiveChildren":
      return directory(
        lastSegment(directoryPath),
        position.spec.nesting?.collectionRole ?? "recursiveChildren",
        directoryPath,
        "Каталог вложенных объектов",
        false,
        false,
        [
          directory(
            "<ИмяОбъекта>",
            position.spec.nesting?.itemRole ?? "recursiveChild",
            `${directoryPath}/<ИмяОбъекта>`,
            "Каталог вложенного объекта",
            false,
            true,
            [
              file(
                PROPERTIES_FILE,
                "properties",
                `${directoryPath}/<ИмяОбъекта>/${PROPERTIES_FILE}`,
                "YAML-файл свойств вложенного объекта",
                true
              ),
            ]
          ),
        ]
      )
  }
}

function metadataObjectNode(
  position: Extract<DirectoryPosition, { kind: "metadataObject" }>,
  directoryPath: string,
  registries?: ProjectStructureRegistries,
): MetadataProjectStructureNode {
  const children: MetadataProjectStructureNode[] = [
    file(
      PROPERTIES_FILE,
      "properties",
      `${directoryPath}/${PROPERTIES_FILE}`,
      `YAML-файл свойств объекта ${position.dir}`,
      true
    ),
    ...projectResourceNodes(position.spec, directoryPath, registries),
  ]

  if (position.spec.nesting?.kind === "recursiveChildDir") {
    children.push(
      directory(
        position.spec.nesting.childDir,
        position.spec.nesting.collectionRole,
        `${directoryPath}/${position.spec.nesting.childDir}`,
        "Каталог вложенных объектов",
        false,
        false,
        [
          directory(
            "<ИмяОбъекта>",
            position.spec.nesting.itemRole,
            `${directoryPath}/${position.spec.nesting.childDir}/<ИмяОбъекта>`,
            "Каталог вложенного объекта",
            false,
            true,
            [
              file(
                PROPERTIES_FILE,
                "properties",
                `${directoryPath}/${position.spec.nesting.childDir}/<ИмяОбъекта>/${PROPERTIES_FILE}`,
                "YAML-файл свойств вложенного объекта",
                true
              ),
            ]
          ),
        ]
      )
    )
  }

  return directory(
    position.name,
    "metadataObject",
    directoryPath,
    `Каталог metadata-объекта вида ${position.dir}`,
    false,
    false,
    children
  )
}

function projectResourceNodes(
  spec: MetadataProjectSpec,
  objectPath: string,
  registries?: ProjectStructureRegistries,
): MetadataProjectStructureNode[] {
  return topologyResourcesForSpec(spec, registries).flatMap((resource) => {
    if (resource.kind === "content" && resource.role === "fileItem") {
      const [dirName, itemName, fileName] = resource.projectPattern.split("/")
      return [
        directory(
          dirName,
          "fileItemDirectory",
          `${objectPath}/${dirName}`,
          "Каталог файловых дочерних объектов",
          false,
          false,
          [
            directory(
              itemName,
              "fileItem",
              `${objectPath}/${dirName}/${itemName}`,
              "Каталог файлового дочернего объекта",
              false,
              true,
              [
                file(
                  fileName,
                  "fileItemYaml",
                  `${objectPath}/${dirName}/${itemName}/${fileName}`,
                  "YAML-файл файлового дочернего объекта",
                  resource.required
                ),
              ]
            ),
          ]
        ),
      ]
    }

    if (resource.kind === "directory") {
      return [
        directory(
          resource.projectPattern,
          "externalResourceDirectory",
          `${objectPath}/${resource.projectPattern}`,
          "Каталог внешних ресурсов",
          resource.required,
          resource.repeatable
        ),
      ]
    }

    return []
  })
}

type DirectoryTopologyResource =
  | {
      kind: "content"
      role: "fileItem"
      projectPattern: string
      required: boolean
      repeatable: boolean
    }
  | {
      kind: "directory"
      projectPattern: string
      required: boolean
      repeatable: boolean
    }

function topologyResourcesForSpec(
  spec: MetadataProjectSpec,
  registries?: ProjectStructureRegistries,
): DirectoryTopologyResource[] {
  const topology = registries?.resourceTopology.get()
    ?? compileRegisteredMetadataResourceTopology()
  const ownerPattern = `${spec.dir}/{ownerName}/Свойства.yaml`
  const prefix = `${spec.dir}/{ownerName}/`
  const contents = topology.assignments
    .filter((assignment) => assignment.ownerProjectPattern === ownerPattern && assignment.role === "fileItem")
    .map((assignment): DirectoryTopologyResource => ({
      kind: "content",
      role: "fileItem",
      projectPattern: assignment.projectPattern.slice(prefix.length),
      required: assignment.required,
      repeatable: assignment.repeatable,
    }))
  const coveredDirectories = new Set(contents.map((content) => content.projectPattern.split("/")[0]))
  const owner = topology.assignments.find((assignment) => assignment.projectPattern === ownerPattern)
  const directories = (owner?.externalFiles ?? [])
    .map((file) => file.projectPattern.slice(prefix.length).split("/")[0])
    .filter((directory) => directory.length > 0 && !coveredDirectories.has(directory))
    .filter((directory, index, all) => all.indexOf(directory) === index)
    .map((projectPattern): DirectoryTopologyResource => ({
      kind: "directory",
      projectPattern,
      required: false,
      repeatable: false,
    }))
  return [...contents, ...directories]
}

function projectSpecs(
  registries?: ProjectStructureRegistries,
): MetadataProjectSpec[] {
  return registries === undefined
    ? metadataProjectSpecs
    : [...registries.projectSpecs.values()]
      .filter((spec) => spec.dir !== "")
      .sort((left, right) => left.dir.localeCompare(right.dir, "ru"))
}

function projectSpecByDir(
  dir: string,
  registries?: ProjectStructureRegistries,
): MetadataProjectSpec | undefined {
  return registries === undefined
    ? getMetadataProjectSpecByDir(dir)
    : registries.projectSpecs.get(dir)
}

function objectTemplate(dir: string): MetadataProjectStructureNode {
  return directory("<ИмяОбъекта>", "metadataObject", `${dir}/<ИмяОбъекта>`, "Каталог metadata-объекта", false, true, [
    file(PROPERTIES_FILE, "properties", `${dir}/<ИмяОбъекта>/${PROPERTIES_FILE}`, "YAML-файл свойств объекта", true),
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
    ...(node.children === undefined
      ? {}
      : { children: node.children.map((child) => withLimitedChildren(child, depth - 1)) }),
  }
}

function directory(
  name: string,
  role: string,
  pathTemplate: string,
  description: string,
  required: boolean,
  repeatable: boolean,
  children?: MetadataProjectStructureNode[]
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
  required: boolean
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
