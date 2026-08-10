import { describe, expect, it } from "vitest"
import { testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
import "./register"

describe("MetadataExternalDataSourceFunction XML → YAML → XML", () => {
  it.each(["full.xml", "minimal.xml"])("round-trips %s", (fixture) => {
    const result = testPropertyFixtureThroughYAML({ propertyType: "MetadataExternalDataSourceFunction", xmlRootTag: "Function", importMetaUrl: import.meta.url, fixture })
    expect(normalize(result.result)).toBe(normalize(result.expected))
  })
})

const normalize = (value: string) => value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
