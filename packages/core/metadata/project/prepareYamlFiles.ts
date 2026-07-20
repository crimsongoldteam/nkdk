import fs from "node:fs"
import { performance } from "node:perf_hooks"
import { parseMetadataYamlData } from "../../yaml/parseMetadataYaml"
import type { ConfigurationProjectFile } from "../configurationIndex/types"
import type { Diagnostic } from "../validation/types"
import type {
  PreparedMetadataDeclaration,
  PreparedMetadataDependency,
  PreparedYamlFile,
  PreparedYamlProjectFileDescriptor,
} from "./preparedYamlProject"

export interface PrepareYamlFilesOptions {
  files: readonly PreparedYamlProjectFileDescriptor[]
  itemTypeByYamlDir: Readonly<Record<string, string>>
  includeProjectFiles?: boolean
  hashFileBytes?: (bytes: Uint8Array) => bigint
  readFileSync?: (filePath: string) => Buffer
}

export interface PrepareYamlFilesProfile {
  readMs: number
  parseMs: number
  indexMs: number
  saveMs: number
}

export interface PreparedYamlFilesResult {
  yamlFiles: PreparedYamlFile[]
  projectFiles: ConfigurationProjectFile[]
  declarations: PreparedMetadataDeclaration[]
  dependencies: PreparedMetadataDependency[]
  diagnostics: Diagnostic[]
  profile: PrepareYamlFilesProfile
}

export function prepareYamlFiles(options: PrepareYamlFilesOptions): PreparedYamlFilesResult {
  const yamlFiles: PreparedYamlFile[] = []
  const projectFiles: ConfigurationProjectFile[] = []
  const declarations: PreparedMetadataDeclaration[] = []
  const dependencies: PreparedMetadataDependency[] = []
  const diagnostics: Diagnostic[] = []
  const profile: PrepareYamlFilesProfile = { readMs: 0, parseMs: 0, indexMs: 0, saveMs: 0 }

  for (const file of options.files) {
    try {
      const readFileSync = options.readFileSync ?? fs.readFileSync
      const [bytes, measuredReadMs] = measureDuration(() => readFileSync(file.filePath))
      profile.readMs += measuredReadMs
      if (options.includeProjectFiles === true) {
        if (options.hashFileBytes === undefined) throw new Error("hashFileBytes is required when includeProjectFiles is true")
        projectFiles.push({ projectPath: file.projectPath, contentHash: options.hashFileBytes(bytes) })
      }

      const [parsed, measuredParseMs] = measureDuration(() => parseMetadataYamlData(bytes.toString("utf8")))
      profile.parseMs += measuredParseMs

      const [, measuredIndexMs] = measureDuration(() => {
        declarations.push(...extractDeclarations(file))
        dependencies.push(...extractDependencies({ file, data: parsed.data, itemTypeByYamlDir: options.itemTypeByYamlDir }))
      })
      profile.indexMs += measuredIndexMs

      const [, measuredSaveMs] = measureDuration(() => {
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
      })
      profile.saveMs += measuredSaveMs
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

  projectFiles.sort((left, right) => Buffer.compare(Buffer.from(left.projectPath), Buffer.from(right.projectPath)))

  return { yamlFiles, projectFiles, declarations, dependencies, diagnostics, profile }
}

function extractDeclarations(file: PreparedYamlProjectFileDescriptor): PreparedMetadataDeclaration[] {
  if (file.role !== "properties") return []
  const canonical = objectCanonicalFromProjectFile(file)
  if (canonical === undefined) return []
  return [{ canonical, projectPath: file.projectPath, filePath: file.filePath }]
}

function measureDuration<T>(fn: () => T): [T, number] {
  const startedAt = performance.now()
  const result = fn()
  return [result, performance.now() - startedAt]
}

function objectCanonicalFromProjectFile(file: PreparedYamlProjectFileDescriptor): string | undefined {
  const root = file.itemType
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
  itemTypeByYamlDir: Readonly<Record<string, string>>
}): PreparedMetadataDependency[] {
  const dependencies: PreparedMetadataDependency[] = []
  visitYamlValue(params.data, [], (value, yamlPath) => {
    if (yamlPath[yamlPath.length - 1] !== "Тип") return
    for (const canonical of typeValueObjectCanonicals({ value, itemTypeByYamlDir: params.itemTypeByYamlDir })) {
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

function typeValueObjectCanonicals(params: {
  value: unknown
  itemTypeByYamlDir: Readonly<Record<string, string>>
}): string[] {
  const values = Array.isArray(params.value) ? params.value : [params.value]
  return values.flatMap((item) =>
    typeof item === "string"
      ? objectCanonicalFromTypeValue({ value: item, itemTypeByYamlDir: params.itemTypeByYamlDir })
      : []
  )
}

function objectCanonicalFromTypeValue(params: {
  value: string
  itemTypeByYamlDir: Readonly<Record<string, string>>
}): string[] {
  const type = params.value.trim().split("(")[0]?.trim()
  if (type === undefined || type.length === 0) return []

  const dotIndex = type.indexOf(".")
  if (dotIndex === -1) return []

  const root = params.itemTypeByYamlDir[type.substring(0, dotIndex)]
  const objectName = type.substring(dotIndex + 1)
  if (root === undefined || objectName.length === 0) return []

  return [`${root}.${objectName}`]
}
