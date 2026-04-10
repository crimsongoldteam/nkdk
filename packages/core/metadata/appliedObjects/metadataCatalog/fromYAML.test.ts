import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { parseDocument } from "yaml"
import { getDependencies } from "~/metadata/relations/getDependencies"
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

  it("should import dependencies", () => {
    const text = fs.readFileSync(path.join(__dirname, "__fixtures__/dependencies.yaml"), "utf8")
    const yamlDocument = parseDocument(text)
    importMetadataCatalogDependenciesFromYAML({
      context: mockContext,
      yamlDocument,
      path: "test.yaml",
      name: "TestCatalog",
    })

    const dependencies = getDependencies(["Справочник", "TestCatalog"])
    expect(Object.keys(dependencies)).toEqual(["Справочник.TestCatalog.КакойТоРеквизит"])
  })
})
