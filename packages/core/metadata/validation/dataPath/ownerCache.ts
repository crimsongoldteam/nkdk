import { join, resolve } from "path"
import { Type } from "@sinclair/typebox"
import { MetadataConstantRules } from "~/metadata/appliedObjects/metadataConstant/rules"
import { MetadataDefinedTypeRules } from "~/metadata/appliedObjects/metadataDefinedType/rules"
import { MetadataCommonAttributeRules } from "~/metadata/appliedObjects/metadataCommonAttribute/rules"
import { MetadataDocumentNumeratorRules } from "~/metadata/appliedObjects/metadataDocumentNumerator/rules"
import { MetadataFilterCriterionRules } from "~/metadata/appliedObjects/metadataFilterCriterion/rules"
import { MetadataSettingsStorageRules } from "~/metadata/appliedObjects/metadataSettingsStorage/rules"
import type { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
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
  Перечисление: "Перечисление",
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
  Обработка: "Обработка",
  ОбработкаОбъект: "Обработка",
  ВнешнийИсточникДанных: "ВнешнийИсточникДанных",
  ЖурналДокументов: "ЖурналДокументов",
  Отчет: "Отчет",
  ОтчетОбъект: "Отчет",
  БизнесПроцесс: "БизнесПроцесс",
  БизнесПроцессОбъект: "БизнесПроцесс",
  Задача: "Задача",
  ЗадачаОбъект: "Задача",
  ОбщийРеквизит: "ОбщийРеквизит",
  КритерийОтбора: "КритерийОтбора",
  ХранилищеНастроек: "ХранилищеНастроек",
  НумераторДокументов: "Нумератор",
  Константа: "Константа",
  ОпределяемыйТип: "ОпределяемыйТип",
} satisfies Readonly<Record<KnownOwnerTypeKind, string>>

const constantOwnerSpec = createLocalOwnerSpec({
  kind: "constant",
  dir: "Константа",
  rule: MetadataConstantRules,
})

const definedTypeOwnerSpec = createLocalOwnerSpec({
  kind: "definedType",
  dir: "ОпределяемыйТип",
  rule: MetadataDefinedTypeRules,
})

const commonAttributeOwnerSpec = createLocalOwnerSpec({
  kind: "commonAttribute",
  dir: "ОбщийРеквизит",
  rule: MetadataCommonAttributeRules,
})

const filterCriterionOwnerSpec = createLocalOwnerSpec({
  kind: "filterCriterion",
  dir: "КритерийОтбора",
  rule: MetadataFilterCriterionRules,
})

const settingsStorageOwnerSpec = createLocalOwnerSpec({
  kind: "settingsStorage",
  dir: "ХранилищеНастроек",
  rule: MetadataSettingsStorageRules,
})

const documentNumeratorOwnerSpec = createLocalOwnerSpec({
  kind: "documentNumerator",
  dir: "Нумератор",
  rule: MetadataDocumentNumeratorRules,
})

function createLocalOwnerSpec(params: {
  kind: string
  dir: string
  rule: MetadataItemRule
}): ValidationProjectSpec {
  return {
    kind: params.kind,
    dir: params.dir,
    rule: params.rule,
    exportSchema: () => Type.Object({}),
    importModel: ({ context, parsed, name }) => {
      const model: unknown = importMetadataItemFromYAML({ context, yaml: parsed.data, rule: params.rule, name })

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

  const spec = getOwnerProjectSpecByDir(dir)
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

function getOwnerProjectSpecByDir(dir: string): ValidationProjectSpec | undefined {
  if (dir === constantOwnerSpec.dir) return constantOwnerSpec
  if (dir === definedTypeOwnerSpec.dir) return definedTypeOwnerSpec
  if (dir === commonAttributeOwnerSpec.dir) return commonAttributeOwnerSpec
  if (dir === filterCriterionOwnerSpec.dir) return filterCriterionOwnerSpec
  if (dir === settingsStorageOwnerSpec.dir) return settingsStorageOwnerSpec
  if (dir === documentNumeratorOwnerSpec.dir) return documentNumeratorOwnerSpec
  return getValidationProjectSpecByDir(dir)
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

function isMetadataItem(value: unknown): value is MetadataItem {
  return typeof value === "object" && value !== null && "itemType" in value
}
