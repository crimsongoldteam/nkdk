import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { dcsMetadataTypedValueFixtures } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "DcsMetadataTypedValue" as any,
  yaml: "value",
}

describe("export DcsMetadataTypedValue to YAML", () => {
  it.each(dcsMetadataTypedValueFixtures)("exports $name", (fixture) => {
    expect(
      testExportPropertyToYAML({
        rule,
        value: fixture.model,
      })
    ).toEqual({ value: fixture.YAML })
  })

  it("rejects xsi:nil array item as XML-only", () => {
    expect(() =>
      testExportPropertyToYAML({
        rule,
        value: [{ type: "string", value: "x" }, undefined],
      })
    ).toThrow("DcsMetadataTypedValue YAML: xsi:nil is XML-only")
  })

  it("exports ref as YAML metadata reference", () => {
    expect(
      testExportPropertyToYAML({
        rule,
        value: { type: "ref", value: "Catalog.Организации.EmptyRef" },
      })
    ).toEqual({ value: "Справочник.Организации.ПустаяСсылка" })
  })
})
