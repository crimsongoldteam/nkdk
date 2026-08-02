import type { ProjectStateReadToken } from "../projectState/contracts"
import type { ProjectReferenceLocation } from "../projectState/readSession"
import type { ProjectStateService } from "../projectState/service"
import type { MetadataOperationCanonicalTargetResult } from "./targetResolver"

export type IndexedOperationReferencesResult =
  | {
      readonly ok: true
      readonly source: { readonly projectPath: string; readonly componentPath: string }
      readonly references: readonly ProjectReferenceLocation[]
    }
  | { readonly ok: false; readonly message: string }

export function readIndexedOperationReferences(params: {
  readonly projectState: ProjectStateService
  readonly readToken: ProjectStateReadToken
  readonly path: string
  readonly componentPath?: string
  readonly target: Extract<MetadataOperationCanonicalTargetResult, { ok: true }>
}): IndexedOperationReferencesResult {
  const session = params.projectState.openReadSession(params.readToken)
  try {
    const [resolved] = session.resolveTargets([{
      requestId: "target",
      componentPath: params.componentPath ?? "cf",
      canonicalTarget: params.target.canonical,
    }])
    if (resolved?.status !== "found") return { ok: false, message: `Цель не найдена: ${params.path}` }

    const [found] = session.findReferences([{
      requestId: "references",
      componentPath: resolved.source.componentPath,
      canonical: params.target.canonical,
      match: "prefix",
      dataPathTarget: params.target.dataPathTarget,
    }])
    if (found === undefined || found.requestId !== "references") {
      throw new Error("Ответ поиска ссылок не соответствует запросу")
    }
    return { ok: true, source: resolved.source, references: found.references }
  } finally {
    session.close()
  }
}
