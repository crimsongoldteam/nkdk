import { readdirSync } from "fs"
import { join, resolve } from "path"
import { Type } from "typebox"
import type { ConfigurationContext } from "../../context/types"
import { importMetadataItemFromYAML } from "../../orchestration/metadataItem/fromYAML"
import type { MetadataItem, MetadataItemRule } from "../../orchestration/property/types"
import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import type { ValidationObjectTable } from "../projectValidationObjectTable"
import type { ValidationProjectSpec } from "../projectSpecs"
import type { ProjectYamlCache } from "../projectYamlCache"
import type { Diagnostic } from "../types"
import { validateUniqueNameScopes } from "../uniqueNameScopes"
import { buildObjectFieldIndex, type ObjectFieldIndex } from "./objectFields"
import { createValidationOwnerFacts, type ValidationOwnerFacts } from "./ownerFacts"
import { getDataPathOwnerKind, type DataPathOwnerKindRegistration } from "./registry"
import type { OwnerTypeRef } from "./types"

export interface OwnerMetadataCache {
  get(ref: OwnerTypeRef): OwnerMetadataResult
  listRefs(kind: OwnerTypeRef["kind"]): readonly OwnerTypeRef[]
}

export type OwnerMetadataResult =
  | { status: "ok"; owner: OwnerMetadata }
  | { status: "not-found"; diagnostics: Diagnostic[] }
  | { status: "import-error"; diagnostics: Diagnostic[] }
  | { status: "ambiguous"; diagnostics: Diagnostic[] }

export interface OwnerMetadata {
  ref: OwnerTypeRef
  filePath: string
  facts: ValidationOwnerFacts
  rule: MetadataItemRule
  spec: ValidationProjectSpec
  fieldIndex: ObjectFieldIndex
}

export interface CreateOwnerMetadataCacheParams {
  projectDir: string
  yamlCache: ProjectYamlCache
  context: ConfigurationContext
}

function createValidationSpecFromOwnerKind(ownerKind: DataPathOwnerKindRegistration): ValidationProjectSpec {
  return {
    kind: ownerKind.kind,
    dir: ownerKind.projectDir,
    rule: ownerKind.rule,
    exportSchema: () => Type.Object({}),
    importModel: ({ context, parsed, name }) => {
      const model: unknown = importMetadataItemFromYAML({ context, yaml: parsed.data, rule: ownerKind.rule, name })

      return isMetadataItem(model) ? model : undefined
    },
  }
}

export function createOwnerMetadataCache({
  projectDir,
  yamlCache,
  context,
}: CreateOwnerMetadataCacheParams): OwnerMetadataCache {
  const results = new Map<string, OwnerMetadataResult>()
  const rootDir = resolve(projectDir)

  return {
    get(ref) {
      const key = canonicalOwnerKey(ref)
      const cached = results.get(key)
      if (cached) return cached

      const result = loadOwner({ projectDir: rootDir, yamlCache, context, ref })
      results.set(key, result)
      return result
    },
    listRefs(kind) {
      const ownerKind = getDataPathOwnerKind(kind)
      if (ownerKind === undefined) return []
      const dir = join(rootDir, ownerKind.projectDir)
      try {
        return readdirSync(dir, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => ({ kind, name: entry.name }))
      } catch {
        return []
      }
    },
  }
}

export function createOwnerMetadataCacheFromValidationTable(params: {
  projectDir: string
  table: ValidationObjectTable
}): OwnerMetadataCache {
  const results = new Map<string, OwnerMetadataResult>()
  const projectDir = resolve(params.projectDir)

  return {
    get(ref) {
      const key = canonicalOwnerKey(ref)
      const cached = results.get(key)
      if (cached) return cached

      const result = loadOwnerFromValidationTable({ projectDir, table: params.table, ref })
      results.set(key, result)
      return result
    },
    listRefs(kind) {
      const ownerKind = getDataPathOwnerKind(kind)
      const tableKind = ownerKind?.projectDir ?? kind
      return params.table.listOwners(tableKind).map((ref) => ({
        kind,
        ...(ref.name !== undefined ? { name: ref.name } : {}),
      }))
    },
  }
}

function loadOwnerFromValidationTable(params: {
  projectDir: string
  table: ValidationObjectTable
  ref: OwnerTypeRef
}): OwnerMetadataResult {
  const ownerKind = getDataPathOwnerKind(params.ref.kind)
  const tableRef = ownerKind ? { kind: ownerKind.projectDir, name: params.ref.name } : params.ref
  const record = params.table.getOwner(tableRef)
  if (record === undefined) {
    const dir = ownerKind?.projectDir ?? params.ref.kind
    return {
      status: "not-found",
      diagnostics: [
        crossFileDiagnostic(
          ownerFilePath(params.projectDir, dir, params.ref.name ?? ""),
          ownerNotFoundMessage(params.ref)
        ),
      ],
    }
  }

  if (record.importDiagnostics.length > 0) {
    return { status: "import-error", diagnostics: record.importDiagnostics }
  }

  const fieldIndex = record.ownerFacts?.fieldIndex ?? record.fieldIndex
  const facts =
    record.ownerFacts ??
    (fieldIndex === undefined
      ? undefined
      : { ref: params.ref, filePath: record.filePath, fieldIndex } satisfies ValidationOwnerFacts)

  if (ownerKind === undefined || facts === undefined || fieldIndex === undefined) {
    return {
      status: "import-error",
      diagnostics: [
        crossFileDiagnostic(record.filePath, `Не удалось импортировать владельца ${formatOwnerRef(params.ref)}`),
      ],
    }
  }

  const spec = createValidationSpecFromOwnerKind(ownerKind)
  return {
    status: "ok",
    owner: {
      ref: params.ref,
      filePath: record.filePath,
      facts,
      rule: spec.rule,
      spec,
      fieldIndex,
    },
  }
}

function loadOwner(params: {
  projectDir: string
  yamlCache: ProjectYamlCache
  context: ConfigurationContext
  ref: OwnerTypeRef
}): OwnerMetadataResult {
  const { projectDir, yamlCache, context, ref } = params
  const ownerKind = getDataPathOwnerKind(ref.kind)
  const dir = ownerKind?.projectDir
  if (!dir || !ref.name) {
    return {
      status: "not-found",
      diagnostics: [
        crossFileDiagnostic(ownerFilePath(projectDir, dir ?? ref.kind, ref.name ?? ""), ownerNotFoundMessage(ref)),
      ],
    }
  }

  const spec = createValidationSpecFromOwnerKind(ownerKind)
  const filePath = ownerFilePath(projectDir, dir, ref.name)

  const entry = yamlCache.get(filePath)
  if ("error" in entry) {
    return {
      status: "not-found",
      diagnostics: [
        crossFileDiagnostic(filePath, `Не найден файл владельца ${formatOwnerRef(ref)}: ${entry.error.message}`),
      ],
    }
  }

  try {
    const imported = importOwnerModel({ spec, context, parsed: entry.parsed, name: ref.name, filePath, ref })
    if (imported.status === "import-error") return imported

    const uniqueNameDiagnostics = validateUniqueNameScopes({
      filePath,
      parsed: entry.parsed,
      model: imported.model,
      rule: spec.rule,
    })
    if (uniqueNameDiagnostics.length > 0) {
      return { status: "ambiguous", diagnostics: uniqueNameDiagnostics }
    }

    const ownerFactsWithoutIndex = createValidationOwnerFacts({
      ref,
      filePath,
      fieldIndex: emptyObjectFieldIndex(),
      model: imported.model,
    })
    const ownerWithoutIndex = {
      ref,
      filePath,
      facts: ownerFactsWithoutIndex,
      rule: spec.rule,
      spec,
    }
    const fieldIndex = buildObjectFieldIndex(ownerWithoutIndex)
    const owner: OwnerMetadata = {
      ...ownerWithoutIndex,
      facts: { ...ownerFactsWithoutIndex, fieldIndex },
      fieldIndex,
    }

    return { status: "ok", owner }
  } finally {
    yamlCache.release(filePath)
  }
}

function emptyObjectFieldIndex(): ObjectFieldIndex {
  return { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] }
}

function importOwnerModel(params: {
  spec: ValidationProjectSpec
  context: ConfigurationContext
  parsed: ParsedYaml
  name: string
  filePath: string
  ref: OwnerTypeRef
}): { status: "ok"; model: MetadataItem } | { status: "import-error"; diagnostics: Diagnostic[] } {
  try {
    const model = params.spec.importModel({
      context: params.context,
      parsed: params.parsed,
      name: params.name,
    })
    if (model !== undefined) return { status: "ok", model }

    return {
      status: "import-error",
      diagnostics: [
        crossFileDiagnostic(params.filePath, `Не удалось импортировать владельца ${formatOwnerRef(params.ref)}`),
      ],
    }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught)
    return {
      status: "import-error",
      diagnostics: [
        crossFileDiagnostic(
          params.filePath,
          `Не удалось импортировать владельца ${formatOwnerRef(params.ref)}: ${message}`
        ),
      ],
    }
  }
}

function canonicalOwnerKey(ref: OwnerTypeRef): string {
  return `${ref.kind}:${ref.name ?? ""}`
}

function ownerFilePath(projectDir: string, dir: string, name: string): string {
  return join(projectDir, dir, name, "Свойства.yaml")
}

function ownerNotFoundMessage(ref: OwnerTypeRef): string {
  return `Не найден владелец ${formatOwnerRef(ref)}`
}

function formatOwnerRef(ref: OwnerTypeRef): string {
  return ref.name ? `${ref.kind}.${ref.name}` : ref.kind
}

function crossFileDiagnostic(filePath: string, message: string): Diagnostic {
  return {
    filePath,
    line: 1,
    col: 1,
    message,
    severity: "error",
    source: "cross-file",
  }
}

function isMetadataItem(value: unknown): value is MetadataItem {
  return typeof value === "object" && value !== null && "itemType" in value
}
