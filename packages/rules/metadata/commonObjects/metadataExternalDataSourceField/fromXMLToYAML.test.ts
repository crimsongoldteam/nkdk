import { describe, expect, it } from "vitest"
import { testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
import { serializeYAMLDocument } from "@nkdk/runtime"
import "./register"

describe("MetadataExternalDataSourceField XML → YAML → XML", () => {
  it.each(["full.xml", "minimal.xml"])("round-trips %s", (fixture) => {
    const result = testPropertyFixtureThroughYAML({ propertyType: "MetadataExternalDataSourceField", xmlRootTag: "Field", importMetaUrl: import.meta.url, fixture })
    expect(normalize(result.result)).toBe(normalize(result.expected))
    if (fixture === "full.xml") {
      expect(serializeYAMLDocument(result.yaml).text).toContain("ЗначениеЗаполнения: !xml Null")
    }
  })

  it("восстанавливает v8:Null без reference XML", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataExternalDataSourceField",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
      withReference: false,
    })

    expect(result.result).toContain('<FillValue xsi:type="v8:Null"/>')
  })
})

const normalize = (value: string) => value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
