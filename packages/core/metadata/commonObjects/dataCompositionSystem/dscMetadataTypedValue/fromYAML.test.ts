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
})
