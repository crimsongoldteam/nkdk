import { readFileSync } from "node:fs"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import type { ConfigurationContext } from "../context/types"
import { rootFromYAML } from "../commonObjects/metadataTargets/roots"
import type { Diagnostic } from "../validation/types"
import type {
  PreparedMetadataDeclaration,
  PreparedMetadataDependency,
  PreparedYamlFile,
  PreparedYamlProjectFileDescriptor,
} from "./preparedYamlProject"

export type PreparedYamlProjectWorkerTask = {
  kind: "prepare"
  projectDir: string
  context: ConfigurationContext
  files: PreparedYamlProjectFileDescriptor[]
}

export type PreparedYamlProjectWorkerTaskResult = {
  kind: "prepareResult"
  yamlFiles: PreparedYamlFile[]
  declarations: PreparedMetadataDeclaration[]
  dependencies: PreparedMetadataDependency[]
  diagnostics: Diagnostic[]
}

export default async function runPreparedYamlProjectWorkerTask(
  message: PreparedYamlProjectWorkerTask
): Promise<PreparedYamlProjectWorkerTaskResult> {
  const yamlFiles: PreparedYamlFile[] = []
  const declarations: PreparedMetadataDeclaration[] = []
  const dependencies: PreparedMetadataDependency[] = []
  const diagnostics: Diagnostic[] = []

  for (const file of message.files) {
    try {
      const text = readFileSync(file.filePath, "utf8")
      const parsed = parseMetadataYaml(text)
      declarations.push(...extractDeclarations(file))
      dependencies.push(...extractDependencies({ file, data: parsed.data }))
      yamlFiles.push({
        projectPath: file.projectPath,
        filePath: file.filePath,
        role: file.role,
        owner: file.owner,
        data: parsed.data,
        syntaxDiagnostics: parsed.syntaxErrors.map((error) => ({
          filePath: file.filePath,
          line: error.line,
          col: error.col,
          severity: "error",
          source: "syntax",
          message: error.message,
        })),
      })
    } catch (caught) {
      diagnostics.push({
        filePath: file.filePath,
        line: 1,
        col: 1,
        severity: "error",
        source: "external-file",
        message: `Не удалось прочитать YAML-файл: ${caught instanceof Error ? caught.message : String(caught)}`,
      })
    }
  }

  return { kind: "prepareResult", yamlFiles, declarations, dependencies, diagnostics }
}

function extractDeclarations(file: PreparedYamlProjectFileDescriptor): PreparedMetadataDeclaration[] {
  if (file.role !== "properties") return []
  const canonical = objectCanonicalFromProjectFile(file)
  if (canonical === undefined) return []
  return [{ canonical, projectPath: file.projectPath, filePath: file.filePath }]
}

function objectCanonicalFromProjectFile(file: PreparedYamlProjectFileDescriptor): string | undefined {
  const root = rootFromYAML[file.owner.dir]
  if (root === undefined || file.owner.name.length === 0) return undefined

  const parts = file.projectPath.split("/")
  if (parts.length > 3 && parts[0] === file.owner.dir && parts[parts.length - 1] === "Свойства.yaml") {
    const rootObjectName = parts[1]
    if (rootObjectName === undefined || rootObjectName.length === 0) return undefined
    const nestedNames: string[] = []
    for (let index = 2; index < parts.length - 2; index += 2) {
      const objectName = parts[index + 1]
      if (objectName === undefined || objectName.length === 0) return undefined
      nestedNames.push(objectName)
    }
    return [root, rootObjectName, ...nestedNames.flatMap((name) => [root, name])].join(".")
  }

  return `${root}.${file.owner.name}`
}

function extractDependencies(params: {
  file: PreparedYamlProjectFileDescriptor
  data: unknown
}): PreparedMetadataDependency[] {
  const dependencies: PreparedMetadataDependency[] = []
  visitYamlValue(params.data, [], (value, yamlPath) => {
    if (yamlPath[yamlPath.length - 1] !== "Тип") return
    for (const canonical of typeValueObjectCanonicals(value)) {
      dependencies.push({
        canonical,
        sourceProjectPath: params.file.projectPath,
        sourceFilePath: params.file.filePath,
        yamlPath,
        kind: "metadata",
      })
    }
  })
  return dependencies
}

function visitYamlValue(
  value: unknown,
  yamlPath: readonly (string | number)[],
  visit: (value: unknown, yamlPath: readonly (string | number)[]) => void
): void {
  visit(value, yamlPath)
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitYamlValue(item, [...yamlPath, index], visit))
    return
  }
  if (typeof value !== "object" || value === null) return
  for (const [key, item] of Object.entries(value)) visitYamlValue(item, [...yamlPath, key], visit)
}

function typeValueObjectCanonicals(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value]
  return values.flatMap((item) => (typeof item === "string" ? objectCanonicalFromTypeValue(item) : []))
}

function objectCanonicalFromTypeValue(value: string): string[] {
  const type = value.trim().split("(")[0]?.trim()
  if (type === undefined || type.length === 0) return []

  const dotIndex = type.indexOf(".")
  if (dotIndex === -1) return []

  const root = rootFromYAML[type.substring(0, dotIndex)]
  const objectName = type.substring(dotIndex + 1)
  if (root === undefined || objectName.length === 0) return []

  return [`${root}.${objectName}`]
}
