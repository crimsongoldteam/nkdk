import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { dcsMetadataTypedValueFixtures } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "DcsMetadataTypedValue" as any,
  yaml: "value",
}

describe("import DcsMetadataTypedValue from YAML", () => {
  it.each(dcsMetadataTypedValueFixtures)("imports $name", (fixture) => {
    expect(
      testImportPropertyFromYAML({
        rule,
        value: fixture.YAML,
      })
    ).toEqual(fixture.model)
  })

  it("imports quoted СписокЗначений as string", () => {
    expect(
      testImportPropertyFromYAML({
        rule,
        value: "'СписокЗначений'",
      })
    ).toEqual({ type: "string", value: "СписокЗначений" })
  })

  it("imports quoted .PDF as string before design-time detection", () => {
    expect(
      testImportPropertyFromYAML({
        rule,
        value: "'.PDF'",
      })
    ).toEqual({ type: "string", value: ".PDF" })
  })

  it("imports quoted .PDF as string when source value was ref", () => {
    expect(
      testImportPropertyFromYAML({
        rule,
        value: "'.PDF'",
        sourceValue: { type: "ref", value: "Catalog.Организации.EmptyRef" },
      })
    ).toEqual({ type: "string", value: ".PDF" })
  })

  it("imports YAML metadata reference as ref when source value was ref", () => {
    expect(
      testImportPropertyFromYAML({
        rule,
        value: "Справочник.Организации.ПустаяСсылка",
        sourceValue: { type: "ref", value: "Catalog.Организации.EmptyRef" },
      })
    ).toEqual({ type: "ref", value: "Catalog.Организации.EmptyRef" })
  })

  it("keeps YAML metadata reference as DesignTimeValue without ref source", () => {
    expect(
      testImportPropertyFromYAML({
        rule,
        value: "Справочник.Организации.ПустаяСсылка",
      })
    ).toEqual({ type: "DesignTimeValue", value: "Справочник.Организации.ПустаяСсылка" })
  })

  it("imports empty object array item as xsi:nil position", () => {
    expect(
      testImportPropertyFromYAML({
        rule,
        value: ["'x'", {}],
      })
    ).toEqual([{ type: "string", value: "x" }, undefined])
  })

  it("imports beginning date string as dateTime, not Field", () => {
    expect(
      testImportPropertyFromYAML({
        rule,
        value: "01.01.0001 00:00:00",
      })
    ).toEqual({ type: "dateTime", value: "0001-01-01T00:00:00" })
  })
})
