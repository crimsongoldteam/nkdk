import { describe, expect, it } from "vitest"
import { testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
import "./register"

describe("MetadataExternalDataSourceCubeResource XML → YAML → XML", () => {
  it.each(["full.xml", "minimal.xml"])("round-trips %s", (fixture) => {
    const result = convert(fixture)
    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("does not export non-cube resource defaults without reference", () => {
    const xml = convert("minimal.xml", false).result
    for (const tag of ["Balance", "ChoiceFoldersAndItems", "ChoiceHistoryOnInput", "CreateOnInput", "DataHistory", "FillChecking", "FillFromFillingValue", "FullTextSearch", "Indexing"]) {
      expect(xml).not.toContain(`<${tag}>`)
    }
  })
})

const convert = (fixture: string, withReference = true) => testPropertyFixtureThroughYAML({ propertyType: "MetadataExternalDataSourceCubeResource", xmlRootTag: "Resource", importMetaUrl: import.meta.url, fixture, withReference })
const normalize = (value: string) => value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
