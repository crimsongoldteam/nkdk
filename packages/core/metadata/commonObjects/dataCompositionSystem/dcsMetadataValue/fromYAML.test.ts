import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { dcsMetadataValueFixtures } from "./__fixtures__/data"

describe("import MetadataDcsMetadataValue from YAML", () => {
  it.each(dcsMetadataValueFixtures)("imports $title", (fixture) => {
    expect(
      testImportPropertyFromYAML({
        rule: fixture.rule,
        value: fixture.yaml,
      })
    ).toEqual(fixture.value)
  })
})
