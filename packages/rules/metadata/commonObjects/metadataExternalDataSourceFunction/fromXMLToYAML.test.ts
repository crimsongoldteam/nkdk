import { describe, expect, it } from "vitest"
import {
  createDirectAdoptedExportContext,
  normalizeDirectRoundTripXML,
  testMetadataItemFromYAMLToXML,
  testPropertyFixtureThroughYAML,
} from "../../../tests/directConversion"
import { MetadataExternalDataSourceFunctionRules } from "./rules"
import "./register"

describe("MetadataExternalDataSourceFunction XML → YAML → XML", () => {
  it.each(["full.xml", "minimal.xml"])("round-trips %s", (fixture) => {
    const result = testPropertyFixtureThroughYAML({ propertyType: "MetadataExternalDataSourceFunction", xmlRootTag: "Function", importMetaUrl: import.meta.url, fixture })
    expect(normalizeDirectRoundTripXML(result.result)).toBe(normalizeDirectRoundTripXML(result.expected))
  })

  it("restores an empty own type for an adopted function", () => {
    const logicalAddress = "ExternalDataSource.ИБ.Function.Пустая"
    const result = testMetadataItemFromYAMLToXML({
      rule: MetadataExternalDataSourceFunctionRules,
      name: "Пустая",
      yaml: {},
      context: createDirectAdoptedExportContext(logicalAddress),
    })

    expect(result.xml).toHaveProperty("Properties.Type", {})
  })
})
