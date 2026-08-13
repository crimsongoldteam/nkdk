import { describe, expect, it } from "vitest"
import { normalizeDirectRoundTripXML, testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
import "./register"

describe("MetadataExternalDataSourceFunction XML → YAML → XML", () => {
  it.each(["full.xml", "minimal.xml"])("round-trips %s", (fixture) => {
    const result = testPropertyFixtureThroughYAML({ propertyType: "MetadataExternalDataSourceFunction", xmlRootTag: "Function", importMetaUrl: import.meta.url, fixture })
    expect(normalizeDirectRoundTripXML(result.result)).toBe(normalizeDirectRoundTripXML(result.expected))
  })
})
