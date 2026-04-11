import fs from "fs"
import path from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { parseDocument } from "yaml"
import { edgeMatch, nodeMatch } from "~/metadata/relations/dependencyQuery"
import { clearDependenciesGraph, getDependencies } from "~/metadata/relations/getDependencies"
import { full, fullYAML, minimal, minimalYAML } from "~/tests/fixtures/metadataCatalog/data"
import { mockContext } from "~/tests/mockContext"
import { importMetadataCatalogFromYAML } from "./fromYAML"
import { importMetadataCatalogDependenciesFromYAML } from "./fromYAMLDependencies"
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
    importMetadataCatalogDependenciesFromYAML({
      context: mockContext,
      yamlDocument,
      path: "test.yaml",
      name: "TestCatalog",
    })

    const dependencies = getDependencies(
      nodeMatch(({ attrs }) => attrs.name === "Справочник")
        .nodeMatch(() => true)
        .edgeOr(
          edgeMatch(({ attrs }) => attrs.name === "Реквизит"),
          edgeMatch(({ attrs }) => attrs.name === "ТабличнаяЧасть"),
          edgeMatch(({ attrs }) => attrs.name === "СтандартныеРеквизиты")
        )
    )

    expect(Object.keys(dependencies)).toEqual([
      "Справочник.TestCatalog.Реквизит.КакойТоРеквизит",
      "Справочник.TestCatalog.ТабличнаяЧасть.КакаяТоТабличнаяЧасть",
      "Справочник.TestCatalog.СтандартныеРеквизиты.ИмяПредопределенныхДанных",
      "Справочник.TestCatalog.СтандартныеРеквизиты.Предопределенный",
      "Справочник.TestCatalog.СтандартныеРеквизиты.Ссылка",
      "Справочник.TestCatalog.СтандартныеРеквизиты.ПометкаУдаления",
      "Справочник.TestCatalog.СтандартныеРеквизиты.ЭтоГруппа",
      "Справочник.TestCatalog.СтандартныеРеквизиты.Наименование",
      "Справочник.TestCatalog.СтандартныеРеквизиты.Код",
    ])
  })
})
