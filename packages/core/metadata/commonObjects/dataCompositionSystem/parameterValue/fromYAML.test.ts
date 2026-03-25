import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { parameterValueFixtures } from "./__fixtures__/data"
import "./fromYAML"

describe("importParameterValueFromYAML (через importPropertyFromYAML)", () => {
  it.each(parameterValueFixtures)("imports $title", (fixture) => {
    const result = testImportPropertyFromYAML({
      rule: fixture.rule as PropertyRule,
      value: fixture.yaml,
    })
    expect(result).toEqual(fixture.value)
  })
})
