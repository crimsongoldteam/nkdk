import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { dcsMetadataValueFixtures } from "./__fixtures__/data"

describe("export MetadataDcsMetadataValue to YAML", () => {
  it.each(dcsMetadataValueFixtures)("exports $title", (fixture) => {
    expect(
      testExportPropertyToYAML({
        rule: fixture.rule,
        value: fixture.value,
      })
    ).toEqual({ value: fixture.yaml })
  })
})
