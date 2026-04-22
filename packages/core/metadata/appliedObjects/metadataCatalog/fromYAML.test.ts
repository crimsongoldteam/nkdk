import fs from "fs"
import path from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { edgeMatch, nodeMatch } from "~/metadata/relations/dependencyQuery"
import { getDependencies } from "~/metadata/relations/getDependencies"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { importMetadataFileWithGraph } from "~/metadata/orchestration/importMetadataFileWithGraph"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { mockContext } from "~/tests/mockContext"
import { importMetadataCatalogFromYAML } from "./fromYAML"
import { exportMetadataCatalogToYAML } from "./toYAML"

describe("importMetadataCatalogFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataCatalogFromYAML(mockContext, undefined, "Контрагенты")
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importMetadataCatalogFromYAML(mockContext, fullYAML, "СправочникПолный")

    expect(result).toEqual(full)
  })

  it("should import minimal", () => {
    const result = importMetadataCatalogFromYAML(mockContext, minimalYAML, "ПоУмолчанию")

    expect(result).toEqual(minimal)
  })

  it("should import with short format", () => {
    const result = exportMetadataCatalogToYAML(mockContext, minimal)

    expect(result).toEqual(minimalYAML)
  })
})

describe("importMetadataCatalogDependenciesFromYAML", () => {
  let graph: MetadataGraph

  beforeEach(() => {
    graph = new MetadataGraph()
    const text = fs.readFileSync(path.join(__dirname, "__fixtures__/dependencies.yaml"), "utf8")
    importMetadataFileWithGraph({
      filePath: "test.yaml",
      text,
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
          edgeMatch(({ attrs }) => attrs.kind === "Реквизит"),
          edgeMatch(({ attrs }) => attrs.kind === "ТабличнаяЧасть"),
          edgeMatch(({ attrs }) => attrs.kind === "СтандартныйРеквизит")
        ),
      graph,
    )

    expect(Object.keys(dependencies)).toHaveLength(11)
    expect(Object.keys(dependencies)).toEqual(
      expect.arrayContaining([
        "Справочник.TestCatalog.КакойТоРеквизит",
        "Справочник.TestCatalog.КакаяТоТабличнаяЧасть",
        "Справочник.TestCatalog.ИмяПредопределенныхДанных",
        "Справочник.TestCatalog.Предопределенный",
        "Справочник.TestCatalog.Ссылка",
        "Справочник.TestCatalog.ПометкаУдаления",
        "Справочник.TestCatalog.ЭтоГруппа",
        "Справочник.TestCatalog.Владелец",
        "Справочник.TestCatalog.Родитель",
        "Справочник.TestCatalog.Наименование",
        "Справочник.TestCatalog.Код",
      ]),
    )

    expect(dependencies["Справочник.TestCatalog.КакойТоРеквизит"]).toMatchObject({
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
        .edgeMatch(({ attrs }) => attrs.kind === "Реквизит")
        .nodeMatch(() => true)
        .edgeMatch(({ attrs }) => attrs.kind === "Тип"),
      graph,
    )

    expect(Object.keys(dependencies)).toEqual(["Справочник.ДругойСправочник"])
  })

  it("stub node has no item before target is imported", () => {
    const stubAttrs = graph.getNodeAttributes("Справочник.ДругойСправочник")
    expect(stubAttrs.item).toBeUndefined()
  })

  it("stub node has no filePath (belongs to no file)", () => {
    const stubAttrs = graph.getNodeAttributes("Справочник.ДругойСправочник")
    expect(stubAttrs.filePath).toBeUndefined()
  })

  it("getBrokenReferences reports stub as broken", () => {
    const broken = graph.getBrokenReferences()
    expect(broken.has("Справочник.ДругойСправочник")).toBe(true)
  })

  it("stub is enriched after importing target catalog", () => {
    importMetadataFileWithGraph({
      filePath: "other.yaml",
      text: "{}",
      kind: "catalog",
      name: "ДругойСправочник",
      graph,
      context: mockContext,
    })

    const attrs = graph.getNodeAttributes("Справочник.ДругойСправочник")
    expect(attrs.item).toBeDefined()
    expect((attrs.item as { name: string }).name).toBe("ДругойСправочник")
    expect(attrs.filePath).toBe("other.yaml")
  })

  it("стандартный реквизит из YAML имеет item", () => {
    const attrs = graph.getNodeAttributes("Справочник.TestCatalog.Владелец")
    expect(attrs.item).toBeDefined()
    expect((attrs.item as { name: string }).name).toBe("Owner")
  })

  it("стандартный реквизит без описания в YAML имеет default item", () => {
    const attrs = graph.getNodeAttributes("Справочник.TestCatalog.Ссылка")
    expect(attrs.item).toBeDefined()
    expect((attrs.item as { itemType: string; name: string }).itemType).toBe("StandardAttributeDescription")
    expect((attrs.item as { name: string }).name).toBe("Ref")
  })

  it("getBrokenReferences is empty after all stubs are enriched", () => {
    importMetadataFileWithGraph({
      filePath: "other.yaml",
      text: "{}",
      kind: "catalog",
      name: "ДругойСправочник",
      graph,
      context: mockContext,
    })

    expect(graph.getBrokenReferences().size).toBe(0)
  })
})
