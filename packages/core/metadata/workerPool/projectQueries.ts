import type {
  ProjectReferenceLocation,
  ProjectReferenceLookup,
  ProjectStateReadSession,
} from "../projectState/readSession"

export interface IndexedReferencesQuery {
  readonly kind: "indexedReferences"
  readonly path: string
  readonly componentPath: string
  readonly canonical: string
  readonly dataPathTarget: ProjectReferenceLookup["dataPathTarget"]
}

export type ProjectQueryCommand = IndexedReferencesQuery

export type ProjectQueryResult =
  | {
      readonly kind: "indexedReferencesResult"
      readonly found: true
      readonly source: { readonly projectPath: string; readonly componentPath: string }
      readonly references: readonly ProjectReferenceLocation[]
    }
  | {
      readonly kind: "indexedReferencesResult"
      readonly found: false
      readonly message: string
    }

export function runProjectQuery(
  command: ProjectQueryCommand,
  session: ProjectStateReadSession | undefined,
): ProjectQueryResult {
  if (session === undefined) throw new Error("Состояние проекта не установлено в универсальный worker")
  const [resolved] = session.resolveTargets([{
    requestId: "target",
    componentPath: command.componentPath,
    canonicalTarget: command.canonical,
  }])
  if (resolved?.status !== "found") {
    return { kind: "indexedReferencesResult", found: false, message: `Цель не найдена: ${command.path}` }
  }
  const [found] = session.findReferences([{
    requestId: "references",
    componentPath: resolved.source.componentPath,
    canonical: command.canonical,
    match: "prefix",
    dataPathTarget: command.dataPathTarget,
  }])
  if (found === undefined || found.requestId !== "references") {
    throw new Error("Ответ поиска ссылок не соответствует запросу")
  }
  return {
    kind: "indexedReferencesResult",
    found: true,
    source: resolved.source,
    references: found.references,
  }
}
