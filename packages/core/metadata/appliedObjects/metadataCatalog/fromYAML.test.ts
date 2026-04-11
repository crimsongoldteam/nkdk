import fs from "fs"
import path from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { parse, parseDocument } from "yaml"
import { importMetadataItemDependenciesFromYAML } from "~/metadata/orchestration"
import { edgeMatch, nodeMatch } from "~/metadata/relations/dependencyQuery"
import { clearDependenciesGraph, getDependencies } from "~/metadata/relations/getDependencies"
import { full, fullYAML, minimal, minimalYAML } from "~/tests/fixtures/metadataCatalog/data"
import { mockContext } from "~/tests/mockContext"
import { importMetadataCatalogFromYAML } from "./fromYAML"
import { MetadataCatalogRules } from "./rules"
import { exportMetadataCatalogToYAML } from "./toYAML"

describe("importMetadataCatalogFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataCatalogFromYAML(mockContext, undefined, "Контрагенты")
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = importMetadataCatalogFromYAML(mockContext, fullYAML, "Контрагенты")

    expect(result).toEqual(full)
  })

  it("should import minimal", () => {
    const result = importMetadataCatalogFromYAML(mockContext, minimalYAML, "Контрагенты")

    expect(result).toEqual(minimal)
  })

  it("should import with short format", () => {
    const result = exportMetadataCatalogToYAML(mockContext, minimal)

    expect(result).toBeUndefined()
  })
})

describe("importMetadataCatalogDependenciesFromYAML", () => {
  beforeEach(() => {
    clearDependenciesGraph()
  })

  it("should import dependencies", () => {
    const text = fs.readFileSync(path.join(__dirname, "__fixtures__/dependencies.yaml"), "utf8")
    const yamlDocument = parseDocument(text)
    const catalog = importMetadataCatalogFromYAML(mockContext, parse(text), "TestCatalog")
    importMetadataItemDependenciesFromYAML({
      context: mockContext,
      rule: MetadataCatalogRules,
      yamlDocument,
      name: "TestCatalog",
      filePath: "test.yaml",
      parsedItem: catalog,
    })

    const dependencies = getDependencies(
      nodeMatch(({ attrs }) => attrs.name === "Справочник")
        .nodeMatch(() => true)
        .edgeOr(
          edgeMatch(({ attrs }) => attrs.name === "Реквизит"),
          edgeMatch(({ attrs }) => attrs.name === "ТабличнаяЧасть"),
          edgeMatch(({ attrs }) => attrs.name === "СтандартныйРеквизит")
        )
    )

    expect(Object.keys(dependencies)).toEqual([
      "Справочник.TestCatalog.Реквизит.КакойТоРеквизит",
      "Справочник.TestCatalog.ТабличнаяЧасть.КакаяТоТабличнаяЧасть",
      "Справочник.TestCatalog.СтандартныйРеквизит.ИмяПредопределенныхДанных",
      "Справочник.TestCatalog.СтандартныйРеквизит.Предопределенный",
      "Справочник.TestCatalog.СтандартныйРеквизит.Ссылка",
      "Справочник.TestCatalog.СтандартныйРеквизит.ПометкаУдаления",
      "Справочник.TestCatalog.СтандартныйРеквизит.Родитель",
      "Справочник.TestCatalog.СтандартныйРеквизит.Владелец",
      "Справочник.TestCatalog.СтандартныйРеквизит.ЭтоГруппа",
      "Справочник.TestCatalog.СтандартныйРеквизит.Наименование",
      "Справочник.TestCatalog.СтандартныйРеквизит.Код",
    ])

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
})
