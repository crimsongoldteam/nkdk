import { resolve } from "path"
import type { ConfigurationContext } from "~/metadata/context/types"
import { createOwnerMetadataCache } from "./dataPath/ownerCache"
import { createProjectMetadataResolver } from "./projectMetadataResolver"
import { ProjectFileSchemaError } from "./projectFileSchema"
import {
  discoverValidationProjectFiles,
  resolveValidationProjectFile,
  type ValidationProjectFile,
} from "./projectFiles"
import { createProjectYamlCache } from "./projectYamlCache"
import {
  createValidationSchemaCache,
  validateProjectFileFirstPass,
  validateProjectFileSecondPass,
  type ProjectValidationFileState,
} from "./projectValidationPasses"
import type { Diagnostic } from "./types"

export interface ValidateProjectParams {
  projectDir: string
  filePath?: string
  context?: ConfigurationContext
  concurrency?: number
}

export interface ValidateProjectResult {
  diagnostics: Diagnostic[]
}

const expectedPatterns =
  "Ожидались Конфигурация.yaml или пути вида <Вид>/<Имя>/Свойства.yaml и <Вид>/<Имя>/Формы/<Форма>/Форма.yaml"

export async function validateProject(params: ValidateProjectParams): Promise<ValidateProjectResult> {
  return validateProjectSequential(params)
}

function validateProjectSequential(params: ValidateProjectParams): ValidateProjectResult {
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultValidationContext()
  const cache = createProjectYamlCache()
  const schemaCache = createValidationSchemaCache(context)
  const files =
    params.filePath === undefined
      ? discoverValidationProjectFiles(projectDir)
      : [resolveSingleProjectFile(projectDir, params.filePath)]

  const diagnostics: Diagnostic[] = []
  const states: ProjectValidationFileState[] = []
  for (const file of files) {
    const first = validateProjectFileFirstPass({ projectDir, file, cache, context, schemaCache })
    states.push(first.state)
    diagnostics.push(...first.diagnostics)
  }

  const ownerCache = createOwnerMetadataCache({ projectDir, yamlCache: cache, context })
  const metadataResolver = createProjectMetadataResolver({ projectDir, yamlCache: cache, context, ownerCache })
  for (const state of states) {
    diagnostics.push(...validateProjectFileSecondPass({ projectDir, state, cache, context, ownerCache, metadataResolver }))
  }

  for (const file of files) {
    cache.release(file.absolutePath)
  }

  return { diagnostics: sortDiagnostics(dedupeDiagnostics(diagnostics)) }
}

function resolveSingleProjectFile(projectDir: string, filePath: string): ValidationProjectFile {
  const file = resolveValidationProjectFile(projectDir, filePath)
  if (file) return file

  throw new ProjectFileSchemaError(expectedPatterns)
}

function sortDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort((left, right) => {
    return (
      left.filePath.localeCompare(right.filePath) ||
      left.line - right.line ||
      left.col - right.col ||
      left.severity.localeCompare(right.severity) ||
      left.message.localeCompare(right.message)
    )
  })
}

function dedupeDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const result: Diagnostic[] = []
  const seen = new Set<string>()
  for (const diagnostic of diagnostics) {
    const key = diagnosticKey(diagnostic)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(diagnostic)
  }
  return result
}

function diagnosticKey(diagnostic: Diagnostic): string {
  return [
    diagnostic.filePath,
    diagnostic.line,
    diagnostic.col,
    diagnostic.source,
    diagnostic.severity,
    diagnostic.path ?? "",
    diagnostic.message,
  ].join("\0")
}

function defaultValidationContext(): ConfigurationContext {
  return {
    version: "2.20",
    defaultLanguage: "ru",
    exportToYAML: { toTyped: false },
  }
}
