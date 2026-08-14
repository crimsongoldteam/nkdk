import { describe, expect, it } from "vitest"
import type {
  ScenarioMatrix,
  ScenarioOperation,
} from "./matrix/types"
import { buildScenarioPlan, scenarioPlanHash } from "./plan"

describe("declarative partial sync plan", () => {
  it("creates dependencies before consumers and removes everything in reverse order", () => {
    const plan = buildScenarioPlan(matrix())

    expect(plan.map(({ key }) => key)).toEqual([
      "object:catalog",
      "object:document",
      "child:catalog:attribute",
      "form:catalog",
      "remove:form:catalog",
      "remove:child:catalog:attribute",
      "remove:object:document",
      "remove:object:catalog",
    ])
    expect(plan.at(-1)?.changes).toEqual([
      { path: "Справочник/Тест.yaml", before: "catalog", after: null },
    ])
  })

  it("keeps matrix order between independent roots", () => {
    const source = matrix()
    const plan = buildScenarioPlan({
      ...source,
      roots: [
        { ...source.roots[1], dependsOn: [] },
        { ...source.roots[0], dependsOn: [] },
      ],
    })

    expect(plan.slice(0, 2).map(({ key }) => key)).toEqual([
      "object:document",
      "object:catalog",
    ])
  })

  it.each([
    ["missing dependency", () => {
      const source = matrix()
      return { ...source, roots: [{ ...source.roots[0], dependsOn: ["object:missing"] }] }
    }, /object:missing/],
    ["dependency cycle", () => {
      const source = matrix()
      return {
        ...source,
        roots: [
          { ...source.roots[0], dependsOn: ["object:document"] },
          { ...source.roots[1], dependsOn: ["object:catalog"] },
        ],
      }
    }, /cycle|цикл/i],
    ["duplicate declaration key", () => {
      const source = matrix()
      return {
        ...source,
        children: [{ ...source.children[0], key: "object:catalog" }],
      }
    }, /object:catalog/],
  ] as const)("rejects %s", (_name, createMatrix, message) => {
    expect(() => buildScenarioPlan(createMatrix())).toThrow(message)
  })

  it("calculates the same SHA-256 for equivalent objects with different key order", () => {
    const first: ScenarioOperation[] = [{
      key: "object:catalog",
      kind: "create-object",
      changes: [{ path: "a", before: null, after: new Uint8Array([2, 1]) }],
    }]
    const second = [{
      changes: [{ after: new Uint8Array([2, 1]), before: null, path: "a" }],
      kind: "create-object",
      key: "object:catalog",
    }] satisfies ScenarioOperation[]

    expect(scenarioPlanHash(first)).toMatch(/^[a-f0-9]{64}$/)
    expect(scenarioPlanHash(second)).toBe(scenarioPlanHash(first))
  })
})

function matrix(): ScenarioMatrix {
  return {
    roots: [
      {
        key: "object:catalog",
        itemType: "MetadataCatalog",
        name: "Тест",
        changes: [{ path: "Справочник/Тест.yaml", before: null, after: "catalog" }],
        dependsOn: [],
      },
      {
        key: "object:document",
        itemType: "MetadataDocument",
        name: "Тест",
        changes: [{ path: "Документ/Тест.yaml", before: null, after: "document" }],
        dependsOn: ["object:catalog"],
      },
    ],
    children: [{
      key: "child:catalog:attribute",
      ownerKey: "object:catalog",
      propertyKey: "attributes",
      childItemType: "MetadataAttribute",
      changes: [{ path: "Справочник/Тест.yaml", before: "catalog", after: "catalog+attribute" }],
      dependsOn: [],
    }],
    forms: [{
      key: "form:catalog",
      ownerKey: "object:catalog",
      changes: [{ path: "Справочник/Тест/Формы/Форма.yaml", before: null, after: "form" }],
    }],
  }
}
