import { describe, expect, it, vi } from "vitest"
import type { ProjectStateReadSession } from "../projectState/readSession"
import { runProjectQuery } from "./projectQueries"

describe("project worker queries", () => {
  it("разрешает цель и находит ссылки одним запросом к установленному состоянию", () => {
    const findReferences = vi.fn(() => [{ requestId: "references", references: [] }])
    const session = {
      resolveTargets: () => [{
        requestId: "target",
        status: "found" as const,
        target: { kind: "object" as const, canonical: "Catalog.Товары" },
        source: { projectPath: "cf/Справочник/Товары/Свойства.yaml", componentPath: "cf" },
      }],
      findReferences,
    } as unknown as ProjectStateReadSession

    const result = runProjectQuery({
      kind: "indexedReferences",
      path: "Справочник.Товары",
      componentPath: "cf",
      canonical: "Catalog.Товары",
      dataPathTarget: { owner: { kind: "Справочник", name: "Товары" } },
    }, session)

    expect(result).toMatchObject({ found: true, source: { componentPath: "cf" } })
    expect(findReferences).toHaveBeenCalledOnce()
  })

  it("возвращает техническую ошибку без установленного состояния", () => {
    expect(() => runProjectQuery({
      kind: "indexedReferences",
      path: "Справочник.Товары",
      componentPath: "cf",
      canonical: "Catalog.Товары",
      dataPathTarget: { owner: { kind: "Справочник", name: "Товары" } },
    }, undefined)).toThrow("не установлено")
  })
})
