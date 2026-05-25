// TODO: упростить после унификации YAML-API Catalog'а
import fs from "fs"
import path from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { importMetadataFileWithGraph } from "~/metadata/orchestration/importMetadataFileWithGraph"
import { mockContext } from "~/tests/mockContext"

describe("importMetadataCatalogDependenciesFromYAML", () => {
  let graph: GraphBuilder

  beforeEach(() => {
    graph = new GraphBuilder()
    const text = fs.readFileSync(path.join(__dirname, "__fixtures__/dependencies.yaml"), "utf8")
    importMetadataFileWithGraph({
      filePath: "test.yaml",
      sources: { yaml: text },
      kind: "catalog",
      name: "TestCatalog",
      graph,
      context: mockContext,
    })
  })

  it("imports owning dependencies as direct edges", () => {
    const catalog = "Catalog.TestCatalog"
    const edges = [...graph.outEdgeEntries(catalog)]

    expect(edges).toContainEqual(
      expect.objectContaining({
        target: "Catalog.TestCatalog.Attribute.КакойТоРеквизит",
        attributes: expect.objectContaining({ kind: "ATTRIBUTE" }),
      }),
    )
    expect(edges).toContainEqual(
      expect.objectContaining({
        target: "Catalog.TestCatalog.TabularSection.КакаяТоТабличнаяЧасть",
        attributes: expect.objectContaining({ kind: "TABULAR_SECTION" }),
      }),
    )
    expect(edges).toContainEqual(
      expect.objectContaining({
        target: "Catalog.TestCatalog.StandardAttribute.Owner",
        attributes: expect.objectContaining({ kind: "STANDARD_ATTRIBUTE" }),
      }),
    )
  })

  it("imports reference dependencies with target stubs", () => {
    const attr = "Catalog.TestCatalog.Attribute.КакойТоРеквизит"
    expect([...graph.outEdgeEntries(attr)]).toContainEqual(
      expect.objectContaining({
        target: "Catalog.ДругойСправочник",
        attributes: expect.objectContaining({ kind: "TYPE" }),
      }),
    )
  })

  it("stub node has no item before target is imported", () => {
    const stubAttrs = graph.getNodeAttributes("Catalog.ДругойСправочник")
    expect(stubAttrs.item).toBeUndefined()
  })

  it("stub node has no filePaths (belongs to no file)", () => {
    const stubAttrs = graph.getNodeAttributes("Catalog.ДругойСправочник")
    // В GraphBuilder stub-узел имеет пустой массив filePaths (не undefined)
    expect(stubAttrs.filePaths).toEqual([])
  })

  it("stub is enriched after importing target catalog", () => {
    importMetadataFileWithGraph({
      filePath: "other.yaml",
      sources: { yaml: "{}" },
      kind: "catalog",
      name: "ДругойСправочник",
      graph,
      context: mockContext,
    })

    const attrs = graph.getNodeAttributes("Catalog.ДругойСправочник")
    expect(attrs.item).toBeDefined()
    expect((attrs.item as { name: string }).name).toBe("ДругойСправочник")
    expect(attrs.filePaths[0]).toBe("other.yaml")
  })

  it("стандартный реквизит из YAML имеет item", () => {
    const attrs = graph.getNodeAttributes("Catalog.TestCatalog.StandardAttribute.Owner")
    expect(attrs.item).toBeDefined()
    expect((attrs.item as { name: string }).name).toBe("Owner")
  })

  it("стандартный реквизит без описания в YAML имеет default item", () => {
    const attrs = graph.getNodeAttributes("Catalog.TestCatalog.StandardAttribute.Ref")
    expect(attrs.item).toBeDefined()
    expect((attrs.item as { itemType: string; name: string }).itemType).toBe("StandardAttributeDescription")
    expect((attrs.item as { name: string }).name).toBe("Ref")
  })

})
