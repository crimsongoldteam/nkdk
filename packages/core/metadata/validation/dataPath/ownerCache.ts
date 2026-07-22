import { readdirSync } from "fs"
import { join, resolve } from "path"
import { Type } from "typebox"
import type { ConfigurationContext } from "../../context/types"
import type { MetadataItemRule } from "../../orchestration/property/types"
import type { ValidationObjectTable } from "../projectValidationObjectTable"
import type { ValidationProjectSpec } from "../projectSpecs"
import type { ProjectYamlCache } from "../projectYamlCache"
import type { Diagnostic } from "../types"
import { buildObjectFieldIndex, type ObjectFieldIndex } from "./objectFields"
import type { ValidationOwnerFacts } from "./ownerFacts"
import { getDataPathOwnerKind, type DataPathOwnerKindRegistration } from "./registry"
import type { OwnerTypeRef } from "./types"
import { ownerFactFromYAML } from "./ownerFacts"

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
      : ({ ref: params.ref, filePath: record.filePath, fieldIndex } satisfies ValidationOwnerFacts))

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
  const { projectDir, yamlCache, ref } = params
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
    const uniqueNameDiagnostics = validateYamlUniqueNameScopes({ filePath, data: entry.parsed.data, rule: spec.rule })
    if (uniqueNameDiagnostics.length > 0) return { status: "ambiguous", diagnostics: uniqueNameDiagnostics }

    const ownerFactsWithoutIndex = {
      ref,
      filePath,
      fieldIndex: emptyObjectFieldIndex(),
      ...ownerFactsFromYAML(entry.parsed.data, spec.rule),
    } as ValidationOwnerFacts
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

function ownerFactsFromYAML(data: unknown, rule: MetadataItemRule): Record<string, unknown> {
  const record = isRecord(data) ? data : {}
  const facts: Record<string, unknown> = {}
  for (const propertyRule of Object.values(rule.properties)) {
    if (propertyRule.ownerFactRole === undefined || typeof propertyRule.yaml !== "string") continue
    const value = ownerFactFromYAML(propertyRule.ownerFactRole, record[propertyRule.yaml])
    if (value !== undefined) facts[propertyRule.ownerFactRole] = value
  }
  return facts
}

function validateYamlUniqueNameScopes(params: {
  filePath: string
  data: unknown
  rule: MetadataItemRule
}): Diagnostic[] {
  const record = isRecord(params.data) ? params.data : {}
  const diagnostics: Diagnostic[] = []
  for (const scope of params.rule.uniqueNameScopes ?? []) {
    const seen = new Set<string>()
    for (const propertyKey of scope.collections) {
      const yamlKey = params.rule.properties[propertyKey]?.yaml
      if (typeof yamlKey !== "string") continue
      const collection = isRecord(record[yamlKey]) ? record[yamlKey] : {}
      for (const name of Object.keys(collection)) {
        const normalized = name.toLocaleLowerCase("ru")
        if (seen.has(normalized)) {
          diagnostics.push({
            filePath: params.filePath,
            line: 1,
            col: 1,
            severity: "error",
            source: "structure",
            path: `/${yamlKey}/${name}`,
            message: `Имя "${name}" уже используется в этой области`,
          })
        }
        seen.add(normalized)
      }
    }
  }
  return diagnostics
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function emptyObjectFieldIndex(): ObjectFieldIndex {
  return { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] }
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
