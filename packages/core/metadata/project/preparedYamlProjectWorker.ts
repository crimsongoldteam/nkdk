import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import type { ConfigurationContext } from "../context/types"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "../validation/dataPath/sharedOwnerCache"
import { getProjectReferenceObjectPathContributor } from "../validation/projectReferenceIndexRegistry"
import type {
  ProjectMemberIndexEntry,
  ProjectObjectIndexEntry,
  ProjectValueIndexEntry,
  PendingMetadataTargetReference,
} from "../validation/projectMetadataReferences"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { createProjectYamlCacheFromPreparedFiles } from "../validation/projectYamlCache"
import { validatePendingReferencesWithIndex } from "../validation/projectReferenceIndex"
import {
  validateProjectFileFirstPass,
  validateProjectFileSecondPass,
  type ProjectValidationFileState,
  type ValidationSchemaCache,
  type ValidationSchemaCacheCompileProfile,
} from "../validation/projectValidationPasses"
import { createProjectValidationWorkerSchemaCache } from "../validation/projectValidationWorkerSchemaCache"
import { registerValidationMetadata } from "../validation/registerValidationMetadata"
import type { ValidationRulesSnapshot } from "../validation/rulesSnapshot"
import { createSharedProjectReferenceIndex } from "../validation/sharedProjectReferenceIndex"
import type { SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import type { Diagnostic } from "../validation/types"
import type { ValidationMode, ValidationObjectRecord } from "../validation/projectValidationTypes"
import type {
  PreparedMetadataDeclaration,
  PreparedMetadataDependency,
  PreparedYamlFile,
  PreparedYamlProjectFileDescriptor,
} from "./preparedYamlProject"

registerValidationMetadata()

export type PreparedYamlProjectWorkerTask =
  | {
      kind: "prepare"
      projectDir: string
      itemTypeByYamlDir: Record<string, string>
      files: PreparedYamlProjectFileDescriptor[]
    }
  | {
      kind: "initValidation"
      context: ConfigurationContext
      rulesSnapshot: ValidationRulesSnapshot
    }
  | {
      kind: "validateFirstPass"
      projectDir: string
      context: ConfigurationContext
    }
  | {
      kind: "validateSecondPass"
      projectDir: string
      context: ConfigurationContext
      mode: ValidationMode
      sharedValidationSnapshot: SharedValidationSnapshot
      pendingReferences: PendingMetadataTargetReference[]
    }

export type PreparedYamlProjectWorkerTaskResult =
  | {
      kind: "prepareResult"
      yamlFiles: PreparedYamlFile[]
      declarations: PreparedMetadataDeclaration[]
      dependencies: PreparedMetadataDependency[]
      diagnostics: Diagnostic[]
    }
  | ({ kind: "initValidationResult" } & ValidationSchemaCacheCompileProfile)
  | {
      kind: "validateFirstPassResult"
      diagnostics: Diagnostic[]
      objectRecords: ValidationObjectRecord[]
      objectIndexEntries: ProjectObjectIndexEntry[]
      memberIndexEntries: ProjectMemberIndexEntry[]
      valueIndexEntries: ProjectValueIndexEntry[]
      pendingReferences: PendingMetadataTargetReference[]
    }
  | {
      kind: "validateSecondPassResult"
      diagnostics: Diagnostic[]
    }

interface WorkerValidationState {
  states: Map<string, ProjectValidationFileState>
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
}

export default async function runPreparedYamlProjectWorkerTask(
  message: PreparedYamlProjectWorkerTask
): Promise<PreparedYamlProjectWorkerTaskResult> {
  if (message.kind === "initValidation") {
    validationSchemaCache = await createProjectValidationWorkerSchemaCache({ context: message.context })
    validationRulesSnapshot = message.rulesSnapshot
    return { kind: "initValidationResult", ...validationSchemaCache.compileAll() }
  }
  if (message.kind === "validateFirstPass") return { kind: "validateFirstPassResult", ...runValidationFirstPass(message) }
  if (message.kind === "validateSecondPass") {
    return { kind: "validateSecondPassResult", ...runValidationSecondPass(message) }
  }

  const yamlFiles: PreparedYamlFile[] = []
  const declarations: PreparedMetadataDeclaration[] = []
  const dependencies: PreparedMetadataDependency[] = []
  const diagnostics: Diagnostic[] = []

  for (const file of message.files) {
    try {
      const text = readFileSync(file.filePath, "utf8")
      const parsed = parseMetadataYaml(text)
      declarations.push(...extractDeclarations(file))
      dependencies.push(
        ...extractDependencies({ file, data: parsed.data, itemTypeByYamlDir: message.itemTypeByYamlDir })
      )
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

  preparedYamlFiles = new Map(yamlFiles.map((file) => [file.filePath, file]))
  return { kind: "prepareResult", yamlFiles, declarations, dependencies, diagnostics }
}

let preparedYamlFiles = new Map<string, PreparedYamlFile>()
let validationSchemaCache: ValidationSchemaCache | undefined
let validationRulesSnapshot: ValidationRulesSnapshot | undefined
let validationState = createEmptyWorkerValidationState()

function createEmptyWorkerValidationState(): WorkerValidationState {
  return {
    states: new Map(),
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
  }
}

function runValidationFirstPass(message: Extract<PreparedYamlProjectWorkerTask, { kind: "validateFirstPass" }>): {
  diagnostics: Diagnostic[]
  objectRecords: ValidationObjectRecord[]
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
} {
  validationState = createEmptyWorkerValidationState()
  const diagnostics: Diagnostic[] = []
  const objectRecords: ValidationObjectRecord[] = []
  const schemaCache = requireValidationSchemaCache()
  const cache = createProjectYamlCacheFromPreparedFiles([...preparedYamlFiles.values()])

  for (const yamlFile of preparedYamlFiles.values()) {
    const file = resolveValidationProjectFile(message.projectDir, yamlFile.filePath)
    if (file === undefined) continue

    const first = validateProjectFileFirstPass({
      projectDir: message.projectDir,
      file,
      cache,
      context: message.context,
      schemaCache,
      ...(file.kind === "form" ? { rulesSnapshot: requireValidationRulesSnapshot() } : {}),
    })

    validationState.states.set(resolve(file.absolutePath), first.state)
    validationState.objectIndexEntries.push(...first.objectIndexEntries)
    validationState.memberIndexEntries.push(...first.memberIndexEntries)
    validationState.valueIndexEntries.push(...first.valueIndexEntries)
    validationState.pendingReferences.push(...first.pendingReferences)
    diagnostics.push(...first.diagnostics)
    objectRecords.push(...first.objectRecords)
  }

  return {
    diagnostics,
    objectRecords,
    objectIndexEntries: validationState.objectIndexEntries,
    memberIndexEntries: validationState.memberIndexEntries,
    valueIndexEntries: validationState.valueIndexEntries,
    pendingReferences: validationState.pendingReferences,
  }
}

function requireValidationSchemaCache(): ValidationSchemaCache {
  if (validationSchemaCache === undefined) throw new Error("Prepared YAML worker не инициализирован для validation")
  return validationSchemaCache
}

function requireValidationRulesSnapshot(): ValidationRulesSnapshot {
  if (validationRulesSnapshot === undefined) throw new Error("Prepared YAML worker rulesSnapshot не инициализирован")
  return validationRulesSnapshot
}

function runValidationSecondPass(message: Extract<PreparedYamlProjectWorkerTask, { kind: "validateSecondPass" }>): {
  diagnostics: Diagnostic[]
} {
  const diagnostics: Diagnostic[] = []
  const cache = createProjectYamlCacheFromPreparedFiles([...preparedYamlFiles.values()])
  const ownerCache = createOwnerMetadataCacheFromSharedValidationSnapshot({
    projectDir: message.projectDir,
    snapshot: message.sharedValidationSnapshot,
  })
  const referenceIndex = createSharedProjectReferenceIndex({
    projectDir: message.projectDir,
    mode: message.mode,
    snapshot: message.sharedValidationSnapshot.reference,
    resolveObjectFilePath: (target) => resolveObjectFilePath({ projectDir: message.projectDir, target }),
  })
  const referenceResult = validatePendingReferencesWithIndex({
    index: referenceIndex,
    references: message.pendingReferences,
  })
  diagnostics.push(...referenceResult.diagnostics)

  for (const state of validationState.states.values()) {
    const second = validateProjectFileSecondPass({
      projectDir: message.projectDir,
      state,
      cache,
      context: message.context,
      ownerCache,
      referenceIndex,
      skipMetadataTargetValidation: true,
    })
    diagnostics.push(...second.diagnostics)
  }

  validationState = createEmptyWorkerValidationState()

  return { diagnostics }
}

function resolveObjectFilePath(params: {
  projectDir: string
  target: Parameters<NonNullable<ReturnType<typeof getProjectReferenceObjectPathContributor>>>[0]["target"]
}): string | undefined {
  const contributor = getProjectReferenceObjectPathContributor(params.target.root)
  return contributor?.({ projectDir: params.projectDir, target: params.target })?.filePath
}

function extractDeclarations(file: PreparedYamlProjectFileDescriptor): PreparedMetadataDeclaration[] {
  if (file.role !== "properties") return []
  const canonical = objectCanonicalFromProjectFile(file)
  if (canonical === undefined) return []
  return [{ canonical, projectPath: file.projectPath, filePath: file.filePath }]
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
  itemTypeByYamlDir: Record<string, string>
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

function typeValueObjectCanonicals(params: { value: unknown; itemTypeByYamlDir: Record<string, string> }): string[] {
  const values = Array.isArray(params.value) ? params.value : [params.value]
  return values.flatMap((item) =>
    typeof item === "string"
      ? objectCanonicalFromTypeValue({ value: item, itemTypeByYamlDir: params.itemTypeByYamlDir })
      : []
  )
}

function objectCanonicalFromTypeValue(params: { value: string; itemTypeByYamlDir: Record<string, string> }): string[] {
  const type = params.value.trim().split("(")[0]?.trim()
  if (type === undefined || type.length === 0) return []

  const dotIndex = type.indexOf(".")
  if (dotIndex === -1) return []

  const root = params.itemTypeByYamlDir[type.substring(0, dotIndex)]
  const objectName = type.substring(dotIndex + 1)
  if (root === undefined || objectName.length === 0) return []

  return [`${root}.${objectName}`]
}
