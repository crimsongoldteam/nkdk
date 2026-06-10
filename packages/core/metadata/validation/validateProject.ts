import { TypeCompiler } from "@sinclair/typebox/compiler"
import { join, resolve } from "path"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { MetadataItem } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import { createOwnerMetadataCache } from "./dataPath/ownerCache"
import { exportJSONSchemaForSchemaName, ProjectFileSchemaError } from "./projectFileSchema"
import {
  discoverValidationProjectFiles,
  resolveValidationProjectFile,
  type ValidationProjectFile,
} from "./projectFiles"
import { createProjectYamlCache, type ProjectYamlCache } from "./projectYamlCache"
import type { ValidationProjectSpec } from "./projectSpecs"
import type { Diagnostic } from "./types"
import { validateParsedFile } from "./validateFile"
import { validateForm } from "./validateForm"
import { validateUniqueNameScopes } from "./uniqueNameScopes"

export interface ValidateProjectParams {
  projectDir: string
  filePath?: string
  context?: ConfigurationContext
}

export interface ValidateProjectResult {
  diagnostics: Diagnostic[]
}

const expectedPatterns =
  "Ожидались пути вида <Вид>/<Имя>/Свойства.yaml или <Вид>/<Имя>/Формы/<Форма>/Форма.yaml"

export function validateProject(params: ValidateProjectParams): ValidateProjectResult {
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultValidationContext()
  const cache = createProjectYamlCache()
  const ownerCache = createOwnerMetadataCache({ projectDir, yamlCache: cache, context })
  const files =
    params.filePath === undefined
      ? discoverValidationProjectFiles(projectDir)
      : [resolveSingleProjectFile(projectDir, params.filePath)]

  const diagnostics: Diagnostic[] = []
  for (const file of files) {
    diagnostics.push(...validateProjectFile({ projectDir, file, cache, context, ownerCache }))
  }

  return { diagnostics: sortDiagnostics(dedupeDiagnostics(diagnostics)) }
}

function resolveSingleProjectFile(projectDir: string, filePath: string): ValidationProjectFile {
  const file = resolveValidationProjectFile(projectDir, filePath)
  if (file) return file

  throw new ProjectFileSchemaError(expectedPatterns)
}

function validateProjectFile(params: {
  projectDir: string
  file: ValidationProjectFile
  cache: ProjectYamlCache
  context: ConfigurationContext
  ownerCache: ReturnType<typeof createOwnerMetadataCache>
}): Diagnostic[] {
  if (params.file.kind === "form") {
    return validateProjectForm(params)
  }

  return validateProjectProperties(params)
}

function validateProjectForm(params: {
  projectDir: string
  file: ValidationProjectFile
  cache: ProjectYamlCache
  context: ConfigurationContext
  ownerCache: ReturnType<typeof createOwnerMetadataCache>
}): Diagnostic[] {
  const schemaDiagnostics = validateProjectFileSchema({
    filePath: params.file.absolutePath,
    cache: params.cache,
    schema: TypeCompiler.Compile(exportFormSchema(params.context)),
  })
  if (schemaDiagnostics.some((diagnostic) => diagnostic.source === "syntax")) return schemaDiagnostics

  return [
    ...schemaDiagnostics,
    ...validateForm({
      projectDir: params.projectDir,
      formDir: join(
        params.projectDir,
        params.file.owner.dir,
        params.file.owner.name,
        "Формы",
        params.file.formName ?? "",
      ),
      formName: params.file.formName ?? "",
      owner: { dir: params.file.owner.dir, name: params.file.owner.name },
      cache: params.cache,
      context: params.context,
      ownerCache: params.ownerCache,
      suppressFormImportDiagnostics: schemaDiagnostics.length > 0,
    }),
  ]
}

function validateProjectProperties(params: {
  file: ValidationProjectFile
  cache: ProjectYamlCache
  context: ConfigurationContext
}): Diagnostic[] {
  const diagnostics = validateProjectFileSchema({
    filePath: params.file.absolutePath,
    cache: params.cache,
    schema: TypeCompiler.Compile(params.file.owner.spec.exportSchema({ context: params.context, mode: "inline" })),
  })
  const entry = params.cache.get(params.file.absolutePath)
  if ("error" in entry || entry.parsed.doc.errors.length > 0) return diagnostics

  const imported = importPropertiesModel({
    spec: params.file.owner.spec,
    context: params.context,
    parsed: entry.parsed,
    name: params.file.owner.name,
    filePath: params.file.absolutePath,
  })
  if ("diagnostic" in imported) return [...diagnostics, imported.diagnostic]

  return [
    ...diagnostics,
    ...validateUniqueNameScopes({
      filePath: params.file.absolutePath,
      parsed: entry.parsed,
      model: imported.model,
      rule: params.file.owner.spec.rule,
    }),
  ]
}

function validateProjectFileSchema(params: {
  filePath: string
  cache: ProjectYamlCache
  schema: ReturnType<(typeof TypeCompiler)["Compile"]>
}): Diagnostic[] {
  const entry = params.cache.get(params.filePath)
  if ("error" in entry) {
    return [
      {
        filePath: entry.filePath,
        line: 1,
        col: 1,
        severity: "error",
        source: "external-file",
        message: `Не удалось прочитать YAML-файл: ${entry.error.message}`,
      },
    ]
  }

  return validateParsedFile({
    filePath: entry.filePath,
    parsed: entry.parsed,
    schema: params.schema,
  })
}

function importPropertiesModel(params: {
  spec: ValidationProjectSpec
  context: ConfigurationContext
  parsed: ParsedYaml
  name: string
  filePath: string
}): { model: MetadataItem } | { diagnostic: Diagnostic } {
  try {
    const model = params.spec.importModel({
      context: params.context,
      parsed: params.parsed,
      name: params.name,
    })
    if (model !== undefined) return { model }

    return {
      diagnostic: importDiagnostic(params.filePath, "Не удалось импортировать свойства"),
    }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught)
    return {
      diagnostic: importDiagnostic(params.filePath, `Не удалось импортировать свойства: ${message}`),
    }
  }
}

function importDiagnostic(filePath: string, message: string): Diagnostic {
  return {
    filePath,
    line: 1,
    col: 1,
    severity: "error",
    source: "structure",
    message,
  }
}

function exportFormSchema(context: ConfigurationContext) {
  return exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
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
