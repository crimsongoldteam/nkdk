import { describe, expect, it, vi } from "vitest"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import type { ProjectStateService } from "../projectState/service"
import { completeOperationProjectState, completeOperationReadSession } from "./operationTestSupport"
import { readIndexedOperationReferences } from "./indexReferences"

describe("readIndexedOperationReferences", () => {
  it("разрешает цель в выбранном компоненте общего состояния проекта", () => {
    const resolveTargets = vi.fn(() => [{ requestId: "target", status: "missing" as const }])
    const projectState = completeOperationProjectState({
      async refreshAndValidate() { throw new Error("unexpected refresh") },
      openReadSession: () => completeOperationReadSession({
        resolveTargets,
        findReferences: () => [],
      }),
    }) as ProjectStateService

    readIndexedOperationReferences({
      projectState,
      readToken: createTestProjectStateReadToken(),
      componentPath: "cfe/Продажи",
      path: "Справочник.Товары",
      target: {
        ok: true,
        canonical: "Catalog.Товары",
        targetKind: "object",
        dataPathTarget: { owner: { kind: "Справочник", name: "Товары" } },
      },
    })

    expect(resolveTargets).toHaveBeenCalledWith([{
      requestId: "target",
      componentPath: "cfe/Продажи",
      canonicalTarget: "Catalog.Товары",
    }])
  })
})
