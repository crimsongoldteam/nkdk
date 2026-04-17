import { describe, expect, it } from "vitest"
import { metadataValueFixtures } from "~/metadata/commonObjects/metadataValue/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { importMetadataValueFromYAML } from "./fromYAML"
import { MetadataFormChoiceListValueYAML, MetadataValueYAML } from "./types"

describe("importMetadataValueFromYAML", () => {
  it.each(metadataValueFixtures)("should import $name value from YAML", (fixture) => {
    const result = importMetadataValueFromYAML(
      mockContext,
      fixture.rule as any,
      fixture.YAML as MetadataValueYAML | MetadataFormChoiceListValueYAML
    )

    expect(result).toEqual(fixture.YAML === undefined ? undefined : fixture.internal)
  })

  describe("строгая валидация valueType", () => {
    it("должен бросить при valueType: [string] и фактическом boolean (Истина)", () => {
      expect(() =>
        importMetadataValueFromYAML(mockContext, { type: "MetadataValue", valueType: ["string"] } as any, "Истина")
      ).toThrowError("MetadataValue: ожидались [string], получен boolean в fromYAML")
    })

    it("должен бросить при valueType: [string] и фактическом decimal", () => {
      expect(() =>
        importMetadataValueFromYAML(mockContext, { type: "MetadataValue", valueType: ["string"] } as any, 10)
      ).toThrowError("MetadataValue: ожидались [string], получен decimal в fromYAML")
    })
  })
})
