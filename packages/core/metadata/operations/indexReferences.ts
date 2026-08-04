import type { ProjectReferenceLocation } from "../projectState/readSession"
import type { ProjectStateService } from "../projectState/service"
import type { MetadataOperationCanonicalTargetResult } from "./targetResolver"
import { openIndexedReferencesResult } from "../workerPool/projectQueries"

export type IndexedOperationReferencesResult =
  | {
      readonly ok: true
      readonly source: { readonly projectPath: string; readonly componentPath: string }
      readonly references: readonly ProjectReferenceLocation[]
    }
  | { readonly ok: false; readonly message: string }

export async function readIndexedOperationReferences(params: {
  readonly projectState: ProjectStateService
  readonly path: string
  readonly componentPath?: string
  readonly target: Extract<MetadataOperationCanonicalTargetResult, { ok: true }>
}): Promise<IndexedOperationReferencesResult> {
  const operation = await params.projectState.workers.beginOperation({
    id: `project-query-${Date.now()}-${Math.random()}`,
    concurrency: 1,
    context: { version: "2.20", defaultLanguage: "ru" },
  })
  let outcome: "success" | "failure" = "success"
  try {
    const result = await operation.run(0, {
      kind: "projectQuery",
      command: {
        kind: "indexedReferences",
        path: params.path,
      componentPath: params.componentPath ?? "cf",
      canonical: params.target.canonical,
      dataPathTarget: params.target.dataPathTarget,
      },
    })
    if (result.kind === "binaryResult") {
      const opened = openIndexedReferencesResult(result)
      return {
        ok: true,
        source: opened.source,
        references: Array.from(
          { length: opened.references.count },
          (_unused, index) => opened.references.reference(index),
        ),
      }
    }
    if (result.kind !== "indexedReferencesResult" || result.found) {
      throw new Error("Worker вернул неожиданный результат запроса")
    }
    return { ok: false, message: result.message }
  } catch (caught) {
    outcome = "failure"
    throw caught
  } finally {
    await operation.finish(outcome)
  }
}
