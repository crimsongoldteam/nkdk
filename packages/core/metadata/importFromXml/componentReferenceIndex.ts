import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import pLimit from "p-limit"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import type { ConfigurationContext } from "../context/types"
import { discoverPreparedYamlProjectFiles } from "../project/preparedYamlProject"
import type { OwnerMetadataCache } from "../validation/dataPath/ownerCache"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "../validation/dataPath/sharedOwnerCache"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { createValidationObjectTable } from "../validation/projectValidationObjectTable"
import { extractProjectValidationFileFacts } from "../validation/projectValidationPasses"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import {
  createSharedValidationSnapshot,
  type SharedValidationSnapshot,
} from "../validation/sharedValidationSnapshot"

export interface LayeredImportReferenceSnapshot {
  readonly local: SharedValidationSnapshot
  readonly base?: SharedValidationSnapshot
}

export async function buildComponentReferenceSnapshot(params: {
  componentDir: string
  context: ConfigurationContext
  concurrency: number
}): Promise<SharedValidationSnapshot> {
  const componentDir = resolve(params.componentDir)
  const descriptors = await discoverPreparedYamlProjectFiles(componentDir)
  const rulesSnapshot = createValidationRulesSnapshot(params.context)
  const limit = pLimit(normalizeConcurrency(params.concurrency))
  const contributions = await Promise.all(
    descriptors.map((descriptor) =>
      limit(async () => {
        const file = resolveValidationProjectFile(componentDir, descriptor.filePath)
        if (file === undefined) {
          throw new Error(`Не удалось классифицировать YAML-файл базового компонента: ${descriptor.filePath}`)
        }

        const text = await readFile(file.absolutePath, "utf8")
        const parsed = parseMetadataYaml(text)
        if (parsed.syntaxErrors.length > 0) {
          const first = parsed.syntaxErrors[0]
          const location = first === undefined ? "" : `:${first.line}:${first.col}`
          const message = first?.message ?? "неизвестная синтаксическая ошибка"
          throw new Error(`Не удалось разобрать YAML-файл ${file.absolutePath}${location}: ${message}`)
        }

        return extractProjectValidationFileFacts({
          projectDir: componentDir,
          file,
          entry: { filePath: file.absolutePath, text, parsed },
          rulesSnapshot,
          validationDiagnostics: false,
        })
      })
    )
  )
  const table = createValidationObjectTable({
    records: [],
    filePaths: descriptors.map(({ filePath }) => filePath),
  })
  for (const contribution of contributions) {
    table.mergeRecords(contribution.objectRecords)
    table.mergeReferenceIndexEntries(contribution)
  }

  return createSharedValidationSnapshot(table.snapshot())
}

export function createLayeredImportReferenceSnapshot(params: {
  local: SharedValidationSnapshot
  base?: SharedValidationSnapshot
}): LayeredImportReferenceSnapshot {
  return Object.freeze({
    local: params.local,
    ...(params.base === undefined ? {} : { base: params.base }),
  })
}

export function createLayeredOwnerMetadataCache(params: {
  projectDir: string
  snapshots: LayeredImportReferenceSnapshot
}): OwnerMetadataCache {
  const local = createOwnerMetadataCacheFromSharedValidationSnapshot({
    projectDir: params.projectDir,
    snapshot: params.snapshots.local,
  })
  const base =
    params.snapshots.base === undefined
      ? undefined
      : createOwnerMetadataCacheFromSharedValidationSnapshot({
          projectDir: params.projectDir,
          snapshot: params.snapshots.base,
        })

  return {
    get(ref) {
      const localResult = local.get(ref)
      if (localResult.status !== "not-found" || base === undefined) return localResult
      return base.get(ref)
    },
    listRefs(kind) {
      if (base === undefined) return local.listRefs(kind)

      const result = [...local.listRefs(kind)]
      const seen = new Set(result.map(ownerRefKey))
      for (const ref of base.listRefs(kind)) {
        const key = ownerRefKey(ref)
        if (seen.has(key)) continue
        seen.add(key)
        result.push(ref)
      }
      return result
    },
  }
}

function normalizeConcurrency(concurrency: number): number {
  return Number.isInteger(concurrency) && concurrency > 0 ? concurrency : 1
}

function ownerRefKey(ref: { kind: string; name?: string }): string {
  return `${ref.kind}:${ref.name ?? ""}`
}
