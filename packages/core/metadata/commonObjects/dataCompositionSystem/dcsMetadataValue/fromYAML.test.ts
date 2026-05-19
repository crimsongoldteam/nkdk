import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { dcsMetadataValueYAMLFixtures } from "./__fixtures__/data"

describe("import MetadataDcsMetadataValue from YAML", () => {
  it.each(dcsMetadataValueYAMLFixtures)("imports $title", (fixture) => {
    expect(
      testImportPropertyFromYAML({
        rule: fixture.rule,
        value: fixture.yaml,
      })
    ).toEqual(fixture.value)
  })

  it("rejects invalid explicit text value", () => {
    expect(() =>
      testImportPropertyFromYAML({
        rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
        value: {
          Тип: "Поле",
          Значение: 123,
        },
      })
    ).toThrow("MetadataDcsMetadataValue YAML: invalid explicit text value")
  })
})
