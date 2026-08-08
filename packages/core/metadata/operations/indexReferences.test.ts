import { describe, expect, it, vi } from "vitest"
import type { ProjectStateService } from "../projectState/service"
import { completeOperationProjectState, completeOperationReadSession } from "./tests/operationTestSupport"
import { readIndexedOperationReferences } from "./indexReferences"

describe("readIndexedOperationReferences", () => {
  it("разрешает цель в выбранном компоненте общего состояния проекта", async () => {
    const resolveTargets = vi.fn(() => [{ requestId: "target", status: "missing" as const }])
    const projectState = completeOperationProjectState({
      async refreshAndValidate() { throw new Error("unexpected refresh") },
      openReadSession: () => completeOperationReadSession({
        resolveTargets,
        findReferences: () => [],
      }),
    }) as ProjectStateService

    await readIndexedOperationReferences({
      projectState,
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
