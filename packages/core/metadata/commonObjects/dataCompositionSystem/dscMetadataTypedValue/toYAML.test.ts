import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyToYAML } from "../../../../tests/property/exportPropertyToYAML"
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

  it("exports beginning date as YAML dateTime", () => {
    expect(
      testExportPropertyToYAML({
        rule,
        value: { type: "dateTime", value: "0001-01-01T00:00:00" },
      })
    ).toEqual({ value: "01.01.0001 00:00:00" })
  })
})
