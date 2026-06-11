import { join, resolve } from "path"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { MetadataItem, MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import { getValidationProjectSpecByDir, type ValidationProjectSpec } from "../projectSpecs"
import type { ProjectYamlCache } from "../projectYamlCache"
import type { Diagnostic } from "../types"
import { validateUniqueNameScopes } from "../uniqueNameScopes"
import { buildObjectFieldIndex, type ObjectFieldIndex } from "./objectFields"
import type { KnownOwnerTypeKind, OwnerTypeRef } from "./types"

export interface OwnerMetadataCache {
  get(ref: OwnerTypeRef): OwnerMetadataResult
}

export type OwnerMetadataResult =
  | { status: "ok"; owner: OwnerMetadata }
  | { status: "not-found"; diagnostics: Diagnostic[] }
  | { status: "import-error"; diagnostics: Diagnostic[] }
  | { status: "ambiguous"; diagnostics: Diagnostic[] }

export interface OwnerMetadata {
  ref: OwnerTypeRef
  filePath: string
  model: MetadataItem
  rule: MetadataItemRule
  spec: ValidationProjectSpec
  fieldIndex: ObjectFieldIndex
}

export interface CreateOwnerMetadataCacheParams {
  projectDir: string
  yamlCache: ProjectYamlCache
  context: ConfigurationContext
}

const ownerDirByRefKind = {
  Справочник: "Справочник",
  СправочникОбъект: "Справочник",
  Документ: "Документ",
  ДокументОбъект: "Документ",
  РегистрСведений: "РегистрСведений",
  РегистрНакопления: "РегистрНакопления",
  РегистрБухгалтерии: "РегистрБухгалтерии",
  РегистрРасчета: "РегистрРасчета",
  ПланОбмена: "ПланОбмена",
  ПланОбменаОбъект: "ПланОбмена",
  ПланВидовРасчета: "ПланВидовРасчета",
  ПланВидовРасчетаОбъект: "ПланВидовРасчета",
  ПланВидовХарактеристик: "ПланВидовХарактеристик",
  ПланВидовХарактеристикОбъект: "ПланВидовХарактеристик",
  ПланСчетов: "ПланСчетов",
  ПланСчетовОбъект: "ПланСчетов",
  ОбработкаОбъект: "Обработка",
  ОтчетОбъект: "Отчет",
  БизнесПроцесс: "БизнесПроцесс",
  БизнесПроцессОбъект: "БизнесПроцесс",
  Задача: "Задача",
  ЗадачаОбъект: "Задача",
} satisfies Readonly<Record<KnownOwnerTypeKind, string>>

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
  }
}

function loadOwner(params: {
  projectDir: string
  yamlCache: ProjectYamlCache
  context: ConfigurationContext
  ref: OwnerTypeRef
}): OwnerMetadataResult {
  const { projectDir, yamlCache, context, ref } = params
  const dir = ownerDirForRefKind(ref.kind)
  if (!dir || !ref.name) {
    return {
      status: "not-found",
      diagnostics: [crossFileDiagnostic(ownerFilePath(projectDir, dir ?? ref.kind, ref.name ?? ""), ownerNotFoundMessage(ref))],
    }
  }

  const spec = getValidationProjectSpecByDir(dir)
  const filePath = ownerFilePath(projectDir, dir, ref.name)
  if (!spec) {
    return {
      status: "not-found",
      diagnostics: [crossFileDiagnostic(filePath, ownerNotFoundMessage(ref))],
    }
  }

  const entry = yamlCache.get(filePath)
  if ("error" in entry) {
    return {
      status: "not-found",
      diagnostics: [crossFileDiagnostic(filePath, `Не найден файл владельца ${formatOwnerRef(ref)}: ${entry.error.message}`)],
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

    const ownerWithoutIndex = {
      ref,
      filePath,
      model: imported.model,
      rule: spec.rule,
      spec,
    }
    const owner: OwnerMetadata = {
      ...ownerWithoutIndex,
      fieldIndex: buildObjectFieldIndex(ownerWithoutIndex),
    }

    return { status: "ok", owner }
  } finally {
    yamlCache.release(filePath)
  }
}

function ownerDirForRefKind(kind: OwnerTypeRef["kind"]): string | undefined {
  return Object.prototype.hasOwnProperty.call(ownerDirByRefKind, kind)
    ? ownerDirByRefKind[kind as KnownOwnerTypeKind]
    : undefined
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
      diagnostics: [crossFileDiagnostic(params.filePath, `Не удалось импортировать владельца ${formatOwnerRef(params.ref)}`)],
    }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught)
    return {
      status: "import-error",
      diagnostics: [
        crossFileDiagnostic(params.filePath, `Не удалось импортировать владельца ${formatOwnerRef(params.ref)}: ${message}`),
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
