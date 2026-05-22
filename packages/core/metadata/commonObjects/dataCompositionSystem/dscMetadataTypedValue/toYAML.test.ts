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

  it("exports xsi:nil array item as empty object", () => {
    expect(
      testExportPropertyToYAML({
        rule,
        value: [{ type: "string", value: "x" }, undefined],
      })
    ).toEqual({ value: ["'x'", {}] })
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
