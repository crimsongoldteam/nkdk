import { describe, expect, it } from "vitest"
import { metadataValueFixtures } from "~/metadata/commonObjects/metadataValue/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { importMetadataValueFromYAML } from "./fromYAML"
import { MetadataFormChoiceListValueYAML, MetadataValueYAML } from "./types"

describe("importMetadataValueFromYAML", () => {
  it.each(metadataValueFixtures)("should import $name value with type from YAML", (fixture) => {
    const result = importMetadataValueFromYAML(
      mockContext,
      fixture.ruleWithType as any,
      fixture.YAMLWithType as MetadataValueYAML | MetadataFormChoiceListValueYAML
    )

    expect(result).toEqual(fixture.YAMLWithType === undefined ? undefined : (fixture.internalWithType as any))
  })

  it.each(metadataValueFixtures)("should import $name value from YAML", (fixture) => {
    const result = importMetadataValueFromYAML(
      mockContext,
      fixture.rule as any,
      fixture.YAML as MetadataValueYAML | MetadataFormChoiceListValueYAML
    )

    expect(result).toEqual(fixture.YAML === undefined ? undefined : (fixture.internal as any))
  })
})
