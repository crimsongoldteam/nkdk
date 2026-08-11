import { describe, expect, it, vi } from "vitest"
import type { ProjectStateReadSession } from "../projectState/readSession"
import { openIndexedReferencesResult, runProjectQuery } from "./projectQueries"

describe("project worker queries", () => {
  it("разрешает цель и находит ссылки одним запросом к установленному состоянию", () => {
    const findReferences = vi.fn(() => [{ requestId: "references", references: [{
      kind: "metadataTarget" as const,
      projectPath: "cf/Документ/Заказ/Свойства.yaml",
      componentPath: "cf",
      yamlPath: ["Реквизиты", 0, "Тип"],
      canonical: "Catalog.Товары",
    }] }])
    const session = {
      resolveTargets: () => [{
        requestId: "target",
        status: "found" as const,
        target: { kind: "member" as const, canonical: "Catalog.Товары.Form.ФормаКарточки" },
        source: {
          projectPath: "cf/Справочник/Товары/Формы/ФормаКарточки/Форма.yaml",
          componentPath: "cf",
          itemProjectPath: "cf/Справочник/Товары/Формы/ФормаКарточки",
          ownerProjectPath: "cf/Справочник/Товары/Свойства.yaml",
        },
      }],
      findReferences,
      readComponentTargetPage: ({ cursor }: { cursor?: string }) => cursor === undefined
        ? {
            entries: [
              { logicalAddress: "Catalog.Товары.Form.ФормаКарточки", sourceProjectPath: "ignored" },
              { logicalAddress: "Catalog.Товары.Form.ФормаСписка", sourceProjectPath: "ignored" },
              { logicalAddress: "Catalog.Товары.Form.ФормаСписка.Поле", sourceProjectPath: "ignored" },
            ],
            nextCursor: "next",
          }
        : {
            entries: [{ logicalAddress: "Catalog.Товары.Attribute.Код", sourceProjectPath: "ignored" }],
          },
    } as unknown as ProjectStateReadSession

    const result = runProjectQuery({
      kind: "indexedReferences",
      path: "Справочник.Товары.Форма.ФормаКарточки",
      componentPath: "cf",
      canonical: "Catalog.Товары.Form.ФормаКарточки",
      dataPathTarget: { owner: { kind: "Справочник", name: "Товары" } },
    }, session)

    const opened = openIndexedReferencesResult(result)
    expect(opened).toMatchObject({
      source: {
        projectPath: "cf/Справочник/Товары/Формы/ФормаКарточки/Форма.yaml",
        componentPath: "cf",
        itemProjectPath: "cf/Справочник/Товары/Формы/ФормаКарточки",
        ownerProjectPath: "cf/Справочник/Товары/Свойства.yaml",
      },
      collectionNames: ["ФормаКарточки", "ФормаСписка"],
      references: { count: 1 },
    })
    expect(opened.references.reference(0)).toEqual({
      kind: "metadataTarget",
      projectPath: "cf/Документ/Заказ/Свойства.yaml",
      componentPath: "cf",
      yamlPath: ["Реквизиты", 0, "Тип"],
      canonical: "Catalog.Товары",
    })
    expect(findReferences).toHaveBeenCalledOnce()
  })

  it("сохраняет компактный source обычной YAML-цели", () => {
    const session = {
      resolveTargets: () => [{
        requestId: "target",
        status: "found" as const,
        target: { kind: "object" as const, canonical: "Catalog.Товары" },
        source: { projectPath: "cf/Справочник/Товары/Свойства.yaml", componentPath: "cf" },
      }],
      findReferences: () => [{ requestId: "references", references: [] }],
      readComponentTargetPage: () => ({ entries: [] }),
    } as unknown as ProjectStateReadSession

    const opened = openIndexedReferencesResult(runProjectQuery({
      kind: "indexedReferences",
      path: "Справочник.Товары",
      componentPath: "cf",
      canonical: "Catalog.Товары",
      dataPathTarget: { owner: { kind: "Справочник", name: "Товары" } },
    }, session))

    expect(opened.source).toEqual({
      projectPath: "cf/Справочник/Товары/Свойства.yaml",
      componentPath: "cf",
    })
    expect(opened.collectionNames).toEqual([])
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
