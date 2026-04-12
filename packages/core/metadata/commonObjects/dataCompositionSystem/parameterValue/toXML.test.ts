import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { parameterValueFixtures } from "./__fixtures__/data"

describe("exportParameterValueToDcsXML", () => {
  it.each(parameterValueFixtures)("exports $title", (fixture) => {
    const { result } = testExportPropertyToXML({
      rule: fixture.rule,
      value: fixture.value,
      xmlRootTag: "dcscor:item",
    })

    expect(result).toEqual(fixture.xml)
  })
})
