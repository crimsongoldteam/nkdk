import { TypeCompiler } from "@sinclair/typebox/compiler"
import fs from "fs"
import { join, resolve } from "path"
import { rootFromYAML } from "../commonObjects/metadataTargets/roots"
import type { MetadataFieldKind, ParsedMetadataTarget } from "../commonObjects/metadataTargets/types"
import type { ConfigurationContext } from "../context/types"
import type { MetadataItem } from "../orchestration/property/types"
import { parseMetadataYaml, type ParsedYaml } from "../../yaml/parseMetadataYaml"
import { type OwnerMetadata, type OwnerMetadataCache } from "./dataPath/ownerCache"
import { buildObjectFieldIndex, type ObjectField, type ObjectFieldKind } from "./dataPath/objectFields"
import { validateExcludedEqualNameYAML } from "./excludeIfEqualNameYAML"
import { getRegisteredFormValidationPasses } from "./formValidationRegistry"
import { collectMetadataTargetReferencesInModel, validateMetadataTargetsInModel } from "./metadataTargetTraversal"
import type { ProjectMetadataResolver } from "./projectMetadataResolver"
import { getProjectFileValidators, getProjectMemberIndexContributors } from "./projectMetadataResolverRegistry"
import {
  projectMemberIndexKey,
  projectObjectIndexKey,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
  type ProjectObjectIndexEntry,
  type ProjectValueIndexEntry,
} from "./projectReferenceIndex"
import { exportJSONSchemaForSchemaName } from "./projectFileSchema"
import type { ValidationProjectFile } from "./projectFiles"
import type { ProjectYamlCache, ProjectYamlEntry } from "./projectYamlCache"
import type { ValidationProjectSpec } from "./projectSpecs"
import type { ValidationDependencyRequest, ValidationObjectRecord } from "./projectValidationTypes"
import type { Diagnostic } from "./types"
import { validateParsedFile } from "./validateFile"
import { validateUniqueNameScopes } from "./uniqueNameScopes"

type CompiledSchema = ReturnType<(typeof TypeCompiler)["Compile"]>

export interface ValidationSchemaCache {
  form: () => CompiledSchema
  properties: (spec: ValidationProjectSpec) => CompiledSchema
}

export type ProjectValidationFileState =
  | {
      kind: "properties"
      file: ValidationProjectFile
      parsed: ParsedYaml
      model: MetadataItem
      firstPassDiagnostics: Diagnostic[]
    }
  | {
      kind: "form"
      file: ValidationProjectFile
      formState: unknown
      firstPassDiagnostics: Diagnostic[]
    }
  | { kind: "failed"; file: ValidationProjectFile; diagnostics: Diagnostic[] }

export interface ProjectValidationFirstPassResult {
  state: ProjectValidationFileState
  objectRecords: ValidationObjectRecord[]
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  valueIndexEntries: ProjectValueIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
  diagnostics: Diagnostic[]
}

export interface ProjectValidationSecondPassParams {
  state: ProjectValidationFileState
  projectDir: string
  context: ConfigurationContext
  cache: ProjectYamlCache
  ownerCache: OwnerMetadataCache
  metadataResolver: ProjectMetadataResolver
  skipMetadataTargetValidation?: boolean
}

export type ProjectValidationSecondPassResult =
  | { status: "ok"; diagnostics: Diagnostic[] }
  | { status: "needsDependency"; diagnostics: Diagnostic[]; dependency: ValidationDependencyRequest }

type ProjectValidationYamlReadResult = ProjectYamlEntry | { filePath: string; error: Error }

const readCountsForTests = new Map<string, number>()

export function resetProjectValidationReadCountForTests(): void {
  readCountsForTests.clear()
}

export function getProjectValidationReadCountForTests(filePath: string): number {
  return readCountsForTests.get(resolve(filePath)) ?? 0
}

export function readProjectYamlEntryForValidation(filePath: string): ProjectValidationYamlReadResult {
  const absolutePath = resolve(filePath)
  readCountsForTests.set(absolutePath, (readCountsForTests.get(absolutePath) ?? 0) + 1)
  try {
    const text = fs.readFileSync(absolutePath, "utf8")
    return { filePath: absolutePath, text, parsed: parseMetadataYaml(text) }
  } catch (caught) {
    return { filePath: absolutePath, error: caught instanceof Error ? caught : new Error(String(caught)) }
  }
}

export function readProjectYamlDiagnostic(entry: { filePath: string; error: Error }): Diagnostic {
  return {
    filePath: entry.filePath,
    line: 1,
    col: 1,
    severity: "error",
    source: "external-file",
    message: `Не удалось прочитать YAML-файл: ${entry.error.message}`,
  }
}

export function createValidationSchemaCache(context: ConfigurationContext): ValidationSchemaCache {
  const propertiesSchemas = new Map<string, CompiledSchema>()
  let formSchema: CompiledSchema | undefined

  return {
    form() {
      formSchema ??= TypeCompiler.Compile(exportFormSchema(context))

      return formSchema
    },
    properties(spec) {
      const key = spec.dir
      const existing = propertiesSchemas.get(key)
      if (existing) return existing

      const compiled = TypeCompiler.Compile(spec.exportSchema({ context, mode: "inline" }))
      propertiesSchemas.set(key, compiled)

      return compiled
    },
  }
}

export function validateProjectFileFirstPass(params: {
  projectDir: string
  file: ValidationProjectFile
  cache: ProjectYamlCache
  context: ConfigurationContext
  schemaCache: ValidationSchemaCache
}): ProjectValidationFirstPassResult {
  if (params.file.kind === "form") return validateProjectFormFirstPass(params)
  return validateProjectPropertiesFirstPass(params)
}

export function validateProjectFileSecondPass(
  params: ProjectValidationSecondPassParams
): ProjectValidationSecondPassResult {
  if (params.state.kind === "failed") return { status: "ok", diagnostics: [] }

  if (params.state.kind === "form") {
    const passes = getRegisteredFormValidationPasses()
    if (passes === undefined) return { status: "ok", diagnostics: [] }
    return {
      status: "ok",
      diagnostics: passes.secondPass({ state: params.state.formState, ownerCache: params.ownerCache }),
    }
  }

  const ownerRoot = rootFromYAML[params.state.file.owner.dir]
  const owner = ownerRoot ? { root: ownerRoot, objectName: params.state.file.owner.name } : undefined
  const recorder = createDependencyRecordingResolver(params.metadataResolver)

  const diagnostics = params.skipMetadataTargetValidation
    ? []
    : validateMetadataTargetsInModel({
        filePath: params.state.file.absolutePath,
        parsed: params.state.parsed,
        model: params.state.model,
        rule: params.state.file.owner.spec.rule,
        resolver: recorder.resolver,
        owner,
      })
  const dependency = recorder.firstDependency()
  if (dependency !== undefined) return { status: "needsDependency", diagnostics, dependency }
  return { status: "ok", diagnostics }
}

function validateProjectFormFirstPass(params: {
  projectDir: string
  file: ValidationProjectFile
  cache: ProjectYamlCache
  context: ConfigurationContext
  schemaCache: ValidationSchemaCache
}): ProjectValidationFirstPassResult {
  const schemaDiagnostics = validateProjectFileSchema({
    file: params.file,
    cache: params.cache,
    schema: params.schemaCache.form(),
  })
  if (schemaDiagnostics.some((diagnostic) => diagnostic.source === "syntax")) {
    return failedFirstPass(params.file, schemaDiagnostics)
  }

  const passes = getRegisteredFormValidationPasses()
  if (passes === undefined) {
    return {
      state: { kind: "failed", file: params.file, diagnostics: schemaDiagnostics },
      diagnostics: schemaDiagnostics,
      objectRecords: [],
      objectIndexEntries: [],
      memberIndexEntries: [],
      valueIndexEntries: [],
      pendingReferences: [],
    }
  }

  const first = passes.firstPass({
    projectDir: params.projectDir,
    formDir: join(
      params.projectDir,
      params.file.owner.dir,
      params.file.owner.name,
      "Формы",
      params.file.formName ?? ""
    ),
    formName: params.file.formName ?? "",
    owner: { dir: params.file.owner.dir, name: params.file.owner.name },
    cache: params.cache,
    context: params.context,
    suppressFormImportDiagnostics: schemaDiagnostics.length > 0,
  })
  const diagnostics = [...schemaDiagnostics, ...first.diagnostics]
  if (first.status === "failed") return failedFirstPass(params.file, diagnostics)

  return {
    state: {
      kind: "form",
      file: params.file,
      formState: first.state,
      firstPassDiagnostics: diagnostics,
    },
    diagnostics,
    objectRecords: [],
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
  }
}

function validateProjectPropertiesFirstPass(params: {
  projectDir: string
  file: ValidationProjectFile
  cache: ProjectYamlCache
  context: ConfigurationContext
  schemaCache: ValidationSchemaCache
}): ProjectValidationFirstPassResult {
  const entry = params.cache.get(params.file.absolutePath)
  if ("error" in entry) {
    return failedFirstPass(
      params.file,
      validateProjectFileSchema({
        file: params.file,
        cache: params.cache,
        schema: params.schemaCache.properties(params.file.owner.spec),
      })
    )
  }

  const parsed = parsedForProjectFile(params.file, entry.parsed)
  const schemaDiagnostics = validateProjectFileSchema({
    file: params.file,
    cache: params.cache,
    schema: params.schemaCache.properties(params.file.owner.spec),
    parsed,
  })
  if (entry.parsed.syntaxErrors.length > 0) return failedFirstPass(params.file, schemaDiagnostics)

  const requiredDiagnostics = validateRegisteredProjectFileValidators({
    file: params.file,
    parsed,
  })
  if (requiredDiagnostics.length > 0) {
    return failedFirstPass(params.file, [...schemaDiagnostics, ...requiredDiagnostics])
  }

  const imported = importPropertiesModel({
    spec: params.file.owner.spec,
    context: params.context,
    parsed,
    name: params.file.owner.name,
    filePath: params.file.absolutePath,
  })
  if ("diagnostic" in imported) return failedFirstPass(params.file, [...schemaDiagnostics, imported.diagnostic])

  const equalNameValidationName =
    params.file.kind === "configuration"
      ? metadataModelName(imported.model)
      : params.file.kind === "properties"
        ? params.file.owner.name
        : undefined
  const equalNameDiagnostics = validateExcludedEqualNameYAML({
    filePath: params.file.absolutePath,
    parsed,
    rule: params.file.owner.spec.rule,
    context: params.context,
    name: equalNameValidationName,
  })
  const ownerRoot = rootFromYAML[params.file.owner.dir]
  const metadataTargetOwner = ownerRoot ? { root: ownerRoot, objectName: params.file.owner.name } : undefined
  const pendingReferences = collectMetadataTargetReferencesInModel({
    filePath: params.file.absolutePath,
    parsed,
    model: imported.model,
    rule: params.file.owner.spec.rule,
    owner: metadataTargetOwner,
  })

  const diagnostics = [
    ...suppressEqualNameSchemaDiagnostics(schemaDiagnostics, equalNameDiagnostics),
    ...equalNameDiagnostics,
    ...validateUniqueNameScopes({
      filePath: params.file.absolutePath,
      parsed,
      model: imported.model,
      rule: params.file.owner.spec.rule,
    }),
    ...pendingReferences.diagnostics,
  ]
  const ownerRef = { kind: params.file.owner.dir, name: params.file.owner.name }
  const ownerWithoutIndex = {
    ref: ownerRef,
    filePath: params.file.absolutePath,
    model: imported.model,
    rule: params.file.owner.spec.rule,
    spec: params.file.owner.spec,
  }
  const fieldIndex = buildObjectFieldIndex(ownerWithoutIndex)
  const owner: OwnerMetadata = {
    ...ownerWithoutIndex,
    fieldIndex,
  }
  const memberIndexEntries = buildMemberIndexEntries({
    projectDir: params.projectDir,
    owner,
    hasFile: fs.existsSync,
  })
  const objectIndexEntry = buildObjectIndexEntry({ owner, file: params.file })
  const objectIndexEntries = objectIndexEntry ? [objectIndexEntry] : []
  const valueIndexEntries = buildValueIndexEntries({ owner })

  return {
    state: {
      kind: "properties",
      file: params.file,
      parsed,
      model: imported.model,
      firstPassDiagnostics: diagnostics,
    },
    diagnostics,
    objectIndexEntries,
    memberIndexEntries,
    valueIndexEntries,
    pendingReferences: pendingReferences.references,
    objectRecords: [
      {
        filePath: params.file.absolutePath,
        projectPath: params.file.projectPath,
        kind: params.file.kind,
        owner: { dir: params.file.owner.dir, name: params.file.owner.name },
        ownerRef,
        model: imported.model,
        fieldIndex,
        objectIndexEntries,
        memberIndexEntries,
        valueIndexEntries,
        pendingReferences: pendingReferences.references,
        importDiagnostics: [],
      },
    ],
  }
}

function failedFirstPass(file: ValidationProjectFile, diagnostics: Diagnostic[]): ProjectValidationFirstPassResult {
  return {
    state: { kind: "failed", file, diagnostics },
    diagnostics,
    objectRecords: [],
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
  }
}

function buildObjectIndexEntry(params: {
  owner: OwnerMetadata
  file: ValidationProjectFile
}): ProjectObjectIndexEntry | undefined {
  const target = objectTargetForProjectFile(params.file)
  if (target === undefined) return undefined
  return {
    canonical: projectObjectIndexKey(target),
    target,
    result: { ok: true, filePath: params.owner.filePath, details: params.owner },
  }
}

function objectTargetForProjectFile(
  file: ValidationProjectFile
): Extract<ParsedMetadataTarget, { kind: "object" }> | undefined {
  const root = rootFromYAML[file.owner.dir]
  if (!root || file.owner.name.length === 0) return undefined
  const nesting = file.owner.spec.nesting
  if (nesting?.kind !== "recursiveChildDir") {
    return {
      kind: "object",
      root: root as never,
      objectName: file.owner.name,
    }
  }

  const parts = file.projectPath.split("/")
  if (parts[0] !== file.owner.dir || parts[parts.length - 1] !== "Свойства.yaml") return undefined
  const rootObjectName = parts[1]
  if (rootObjectName === undefined || rootObjectName.length === 0) return undefined
  const nestedNames: string[] = []
  for (let index = 2; index < parts.length - 2; index += 2) {
    if (parts[index] !== nesting.childDir) return undefined
    const objectName = parts[index + 1]
    if (objectName === undefined || objectName.length === 0) return undefined
    nestedNames.push(objectName)
  }

  return {
    kind: "object",
    root: root as never,
    objectName: rootObjectName,
    segments: nestedNames.map((objectName) => ({ kind: root as never, objectName })),
  }
}

function buildValueIndexEntries(_params: { owner: OwnerMetadata }): ProjectValueIndexEntry[] {
  return []
}

function buildMemberIndexEntries(params: {
  projectDir: string
  owner: OwnerMetadata
  hasFile: (filePath: string) => boolean
}): ProjectMemberIndexEntry[] {
  const entries: ProjectMemberIndexEntry[] = []

  for (const field of params.owner.fieldIndex.fields.values()) {
    const target = fieldTarget(params.owner, field)
    entries.push({
      canonical: projectMemberIndexKey(target),
      target,
      result: { ok: true, filePath: params.owner.filePath, details: field },
    })

    if (field.kind === "tabularSection" && field.tableSource) {
      for (const column of field.tableSource.columns.values()) {
        const nestedTarget = nestedFieldTarget(params.owner, field.name, column)
        entries.push({
          canonical: projectMemberIndexKey(nestedTarget),
          target: nestedTarget,
          result: { ok: true, filePath: params.owner.filePath, details: column },
        })
      }
    }
  }

  for (const contributor of getProjectMemberIndexContributors()) {
    entries.push(...contributor(params))
  }

  return entries
}

function fieldTarget(owner: OwnerMetadata, field: ObjectField): Extract<ParsedMetadataTarget, { kind: "member" }> {
  return {
    kind: "member",
    root: rootFromYAML[owner.ref.kind] as never,
    objectName: owner.ref.name ?? "",
    segments: [{ kind: metadataFieldKindFromObjectFieldKind(field.kind), name: field.name }],
  }
}

function nestedFieldTarget(
  owner: OwnerMetadata,
  tabularSectionName: string,
  field: ObjectField
): Extract<ParsedMetadataTarget, { kind: "member" }> {
  return {
    kind: "member",
    root: rootFromYAML[owner.ref.kind] as never,
    objectName: owner.ref.name ?? "",
    segments: [
      { kind: "TabularSection", name: tabularSectionName },
      { kind: metadataFieldKindFromObjectFieldKind(field.kind), name: field.name },
    ],
  }
}

function metadataFieldKindFromObjectFieldKind(kind: ObjectFieldKind): MetadataFieldKind {
  switch (kind) {
    case "attribute":
      return "Attribute"
    case "standardAttribute":
      return "StandardAttribute"
    case "tabularSection":
      return "TabularSection"
    case "dimension":
      return "Dimension"
    case "resource":
      return "Resource"
    case "addressingAttribute":
      return "AddressingAttribute"
  }
}

function createDependencyRecordingResolver(resolver: ProjectMetadataResolver): {
  resolver: ProjectMetadataResolver
  firstDependency(): ValidationDependencyRequest | undefined
} {
  let dependency: ValidationDependencyRequest | undefined

  function record<T extends ReturnType<ProjectMetadataResolver[keyof ProjectMetadataResolver]>>(result: T): T {
    if (!result.ok && result.dependency !== undefined && dependency === undefined) {
      dependency = result.dependency
    }
    return result
  }

  return {
    resolver: {
      resolveObject(params) {
        return record(resolver.resolveObject(params))
      },
      resolveMember(params) {
        return record(resolver.resolveMember(params))
      },
      resolveValue(params) {
        return record(resolver.resolveValue(params))
      },
      resolveStyleItem(params) {
        return record(resolver.resolveStyleItem(params))
      },
      resolveCommonPicture(params) {
        return record(resolver.resolveCommonPicture(params))
      },
    },
    firstDependency() {
      return dependency
    },
  }
}

function validateRegisteredProjectFileValidators(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
}): Diagnostic[] {
  return getProjectFileValidators(params.file.owner.spec.kind).flatMap((validator) =>
    validator({ filePath: params.file.absolutePath, parsed: params.parsed })
  )
}

function validateProjectFileSchema(params: {
  file: ValidationProjectFile
  cache: ProjectYamlCache
  schema: CompiledSchema
  parsed?: ParsedYaml
}): Diagnostic[] {
  const entry = params.cache.get(params.file.absolutePath)
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
    parsed: params.parsed ?? entry.parsed,
    schema: params.schema,
  })
}

function parsedForProjectFile(file: ValidationProjectFile, parsed: ParsedYaml): ParsedYaml {
  if (file.kind === "properties" && parsed.syntaxErrors.length === 0 && parsed.data === undefined) {
    return { ...parsed, data: {} }
  }

  return parsed
}

function suppressEqualNameSchemaDiagnostics(
  schemaDiagnostics: Diagnostic[],
  equalNameDiagnostics: Diagnostic[]
): Diagnostic[] {
  if (equalNameDiagnostics.length === 0) return schemaDiagnostics

  return schemaDiagnostics.filter((diagnostic) => !isCoveredByEqualNameDiagnostic(diagnostic, equalNameDiagnostics))
}

function isCoveredByEqualNameDiagnostic(diagnostic: Diagnostic, equalNameDiagnostics: Diagnostic[]): boolean {
  if (diagnostic.source !== "structure" || diagnostic.path === undefined) return false

  return equalNameDiagnostics.some((equalNameDiagnostic) => {
    const equalNamePath = equalNameDiagnostic.path
    return equalNamePath === diagnostic.path || equalNamePath?.startsWith(`${diagnostic.path}/`) === true
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

function metadataModelName(model: MetadataItem): string | undefined {
  const record = model as { name?: unknown }
  return typeof record.name === "string" ? record.name : undefined
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
