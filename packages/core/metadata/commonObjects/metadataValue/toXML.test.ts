import { describe, expect, it } from "vitest"
import { metadataValueFixtures } from "~/metadata/commonObjects/metadataValue/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { exportMetadataValueToXML } from "./toXML"

describe("exportMetadataValueToXML", () => {
  it.each([
    ...metadataValueFixtures.map((fixture) => ({
      name: `${fixture.name} (withType)`,
      fixture,
      rule: fixture.ruleWithType,
      value: fixture.internalWithType,
    })),
    ...metadataValueFixtures.map((fixture) => ({
      name: `${fixture.name}`,
      fixture,
      rule: fixture.rule,
      value: fixture.internal,
    })),
  ])("should export $name to XML", ({ fixture, rule, value }) => {
    const xmlData = exportMetadataValueToXML({ context: mockContext, rule, value: value as any })
    const result = xmlExport({ Value: xmlData }, false)
    expect(result).toEqual(fixture.XML)
  })
})
