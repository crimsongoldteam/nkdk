import { describeAppliedObjectYAMLToXMLFixtures } from "../../../tests/appliedObject/unifiedFixtureConversion"
import { describe, it } from "vitest"
import { expectProcessingChildDefaults } from "../__tests__/processingChildDefaults"
import { MetadataReportRules } from "./rules"
import { minimalYAML } from "./__fixtures__/minimal"

const cases = [{ fixture: "minimal.xml", yaml: minimalYAML }] as const

describeAppliedObjectYAMLToXMLFixtures({
  itemType: "MetadataReport",
  rule: MetadataReportRules,
  importMetaUrl: import.meta.url,
  cases,
  testTitle: "exports $fixture exactly",
  knownXMLDefaults: { includeAttributeFillValue: false },
})

describe("MetadataReport child defaults", () => {
  it("exports defaults only for supported nested attribute fields", () => {
    expectProcessingChildDefaults(MetadataReportRules)
  })
})
