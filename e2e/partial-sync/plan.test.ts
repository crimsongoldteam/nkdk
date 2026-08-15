import { describe, expect, it } from "vitest"
import type {
  ScenarioLayer,
  ScenarioMatrix,
  ScenarioOperation,
} from "./matrix/types"
import { buildScenarioPlan, scenarioPlanHash } from "./plan"

describe("declarative partial sync plan", () => {
  it("splits every layer into an explicit probe and the remaining bulk", () => {
    const source = matrix()
    const operations = creationOperations(source)
    const layered = withLayers(source, [{
      key: "roots:create",
      componentPath: "cf",
      probeOperationKey: "object:catalog",
      operations: operations.slice(0, 2),
    }])

    expect(buildScenarioPlan(layered)).toMatchObject([
      {
        key: "roots:create:probe",
        componentPath: "cf",
        operations: [{ key: "object:catalog" }],
      },
      {
        key: "roots:create:bulk",
        componentPath: "cf",
        operations: [{ key: "object:document" }],
      },
    ])
  })

  it("does not create an empty bulk block", () => {
    const source = matrix()
    const [catalog] = creationOperations(source)
    const layered = withLayers(source, [{
      key: "roots:create",
      componentPath: "cf",
      probeOperationKey: catalog.key,
      operations: [catalog],
    }])

    expect(buildScenarioPlan(layered).map(({ key }) => key)).toEqual([
      "roots:create:probe",
    ])
  })

  it("rejects a probe whose dependency is only available in the bulk block", () => {
    const source = matrix()
    const operations = creationOperations(source)
    const layered = withLayers(source, [{
      key: "roots:create",
      componentPath: "cf",
      probeOperationKey: "object:document",
      operations: operations.slice(0, 2),
    }])

    expect(() => buildScenarioPlan(layered)).toThrow(/Пробная операция.*object:catalog/u)
  })

  it("creates dependencies before consumers and removes everything in reverse order", () => {
    const plan = flatten(buildScenarioPlan(matrix()))

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

  it("places the explicit probe before independent bulk operations", () => {
    const source = matrix()
    const plan = flatten(buildScenarioPlan({
      ...source,
      roots: [
        { ...source.roots[1], dependsOn: [] },
        { ...source.roots[0], dependsOn: [] },
      ],
    }))

    expect(plan.slice(0, 2).map(({ key }) => key)).toEqual([
      "object:catalog",
      "object:document",
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
      dependsOn: [],
    }]
    const second = [{
      changes: [{ after: new Uint8Array([2, 1]), before: null, path: "a" }],
      kind: "create-object",
      key: "object:catalog",
      dependsOn: [],
    }] satisfies ScenarioOperation[]

    const firstPlan = singleBlock(first)
    const secondPlan = singleBlock(second)
    expect(scenarioPlanHash(firstPlan)).toMatch(/^[a-f0-9]{64}$/)
    expect(scenarioPlanHash(secondPlan)).toBe(scenarioPlanHash(firstPlan))
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
        propertyChanges: [],
        dependsOn: [],
      },
      {
        key: "object:document",
        itemType: "MetadataDocument",
        name: "Тест",
        changes: [{ path: "Документ/Тест.yaml", before: null, after: "document" }],
        propertyChanges: [],
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

function creationOperations(source: ScenarioMatrix): ScenarioOperation[] {
  return source.roots.map(({ key, changes, dependsOn }) => ({
    key,
    kind: "create-object",
    changes,
    dependsOn,
  }))
}

function withLayers(source: ScenarioMatrix, layers: readonly ScenarioLayer[]): ScenarioMatrix {
  return { ...source, layers }
}

function flatten(plan: ReturnType<typeof buildScenarioPlan>): ScenarioOperation[] {
  return plan.flatMap(({ operations }) => operations)
}

function singleBlock(operations: readonly ScenarioOperation[]) {
  return [{
    key: "test:probe" as const,
    layerKey: "test",
    componentPath: "cf" as const,
    operations,
  }]
}
