import { describe, expect, it } from "vitest"
import { normalizeDirectRoundTripXML, testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
import "./register"

describe("MetadataExternalDataSourceField XML → YAML → XML", () => {
  it.each(["full.xml", "minimal.xml"])("round-trips %s", (fixture) => {
    const result = testPropertyFixtureThroughYAML({ propertyType: "MetadataExternalDataSourceField", xmlRootTag: "Field", importMetaUrl: import.meta.url, fixture })
    expect(normalizeDirectRoundTripXML(result.result)).toBe(normalizeDirectRoundTripXML(result.expected))
  })
})
