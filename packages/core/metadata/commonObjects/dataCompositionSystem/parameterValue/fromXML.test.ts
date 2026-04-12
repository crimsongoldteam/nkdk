import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { parameterValueFixtures } from "./__fixtures__/data"

describe("importParameterValueFromXML", () => {
  it.each(parameterValueFixtures)("imports $title", (fixture) => {
    expect(
      testImportPropertyFromXML({
        rule: fixture.rule,
        xmlRootTag: "dcscor:item",
        xmlString: fixture.xml!,
      })
    ).toEqual(fixture.value)
  })
})
