// TODO: упростить после унификации YAML-API Catalog'а
import fs from "fs"
import path from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { edgeMatch, nodeMatch } from "~/metadata/relations/dependencyQuery"
import { getDependencies } from "~/metadata/relations/getDependencies"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { importMetadataFileWithGraph } from "~/metadata/orchestration/importMetadataFileWithGraph"
import { mockContext } from "~/tests/mockContext"

describe("importMetadataCatalogDependenciesFromYAML", () => {
  let graph: MetadataGraph

  beforeEach(() => {
    graph = new MetadataGraph()
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

  it("should import dependencies", () => {
    const dependencies = getDependencies(
      nodeMatch(({ attrs }) => attrs.name === "Справочник")
        .nodeMatch(() => true)
        .edgeOr(
          edgeMatch(({ attrs }) => attrs.kind === "ATTRIBUTE"),
          edgeMatch(({ attrs }) => attrs.kind === "TABULAR_SECTION"),
          edgeMatch(({ attrs }) => attrs.kind === "STANDARD_ATTRIBUTE")
        ),
      graph,
    )

    expect(Object.keys(dependencies)).toHaveLength(11)
    expect(Object.keys(dependencies)).toEqual(
      expect.arrayContaining([
        "Справочник.TestCatalog.Реквизит.КакойТоРеквизит",
        "Справочник.TestCatalog.ТабличнаяЧасть.КакаяТоТабличнаяЧасть",
        "Справочник.TestCatalog.СтандартныйРеквизит.ИмяПредопределенныхДанных",
        "Справочник.TestCatalog.СтандартныйРеквизит.Предопределенный",
        "Справочник.TestCatalog.СтандартныйРеквизит.Ссылка",
        "Справочник.TestCatalog.СтандартныйРеквизит.ПометкаУдаления",
        "Справочник.TestCatalog.СтандартныйРеквизит.ЭтоГруппа",
        "Справочник.TestCatalog.СтандартныйРеквизит.Владелец",
        "Справочник.TestCatalog.СтандартныйРеквизит.Родитель",
        "Справочник.TestCatalog.СтандартныйРеквизит.Наименование",
        "Справочник.TestCatalog.СтандартныйРеквизит.Код",
      ]),
    )

    expect(dependencies["Справочник.TestCatalog.Реквизит.КакойТоРеквизит"]).toMatchObject({
      item: {
        itemType: "MetadataAttribute",
        name: "КакойТоРеквизит",
        synonym: {
          items: {
            ru: "Наименование реквизита",
            en: "Property name",
          },
        },
      },
      positionFrom: {
        offset: 13,
      },
    })
  })

  it("should import dependencies with other catalog", () => {
    const dependencies = getDependencies(
      nodeMatch(({ attrs }) => attrs.name === "Справочник")
        .nodeMatch(() => true)
        .edgeMatch(({ attrs }) => attrs.kind === "ATTRIBUTE")
        .nodeMatch(() => true)
        .edgeMatch(({ attrs }) => attrs.kind === "TYPE"),
      graph,
    )

    expect(Object.keys(dependencies)).toEqual(["Справочник.ДругойСправочник"])
  })

  it("stub node has no item before target is imported", () => {
    const stubAttrs = graph.getNodeAttributes("Справочник.ДругойСправочник")
    expect(stubAttrs.item).toBeUndefined()
  })

  it("stub node has no filePaths (belongs to no file)", () => {
    const stubAttrs = graph.getNodeAttributes("Справочник.ДругойСправочник")
    expect(stubAttrs.filePaths).toBeUndefined()
  })

  it("getBrokenReferences reports stub as broken", () => {
    const broken = graph.getBrokenReferences()
    expect(broken.has("Справочник.ДругойСправочник")).toBe(true)
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

    const attrs = graph.getNodeAttributes("Справочник.ДругойСправочник")
    expect(attrs.item).toBeDefined()
    expect((attrs.item as { name: string }).name).toBe("ДругойСправочник")
    expect(attrs.filePaths?.[0]).toBe("other.yaml")
  })

  it("стандартный реквизит из YAML имеет item", () => {
    const attrs = graph.getNodeAttributes("Справочник.TestCatalog.СтандартныйРеквизит.Владелец")
    expect(attrs.item).toBeDefined()
    expect((attrs.item as { name: string }).name).toBe("Owner")
  })

  it("стандартный реквизит без описания в YAML имеет default item", () => {
    const attrs = graph.getNodeAttributes("Справочник.TestCatalog.СтандартныйРеквизит.Ссылка")
    expect(attrs.item).toBeDefined()
    expect((attrs.item as { itemType: string; name: string }).itemType).toBe("StandardAttributeDescription")
    expect((attrs.item as { name: string }).name).toBe("Ref")
  })

  it("getBrokenReferences is empty after all stubs are enriched", () => {
    importMetadataFileWithGraph({
      filePath: "other.yaml",
      sources: { yaml: "{}" },
      kind: "catalog",
      name: "ДругойСправочник",
      graph,
      context: mockContext,
    })

    expect(graph.getBrokenReferences().size).toBe(0)
  })
})
