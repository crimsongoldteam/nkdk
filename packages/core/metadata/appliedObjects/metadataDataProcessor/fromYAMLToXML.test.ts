import { describeAppliedObjectYAMLToXMLFixtures } from "../../../tests/appliedObject/unifiedFixtureConversion"
import { describe, it } from "vitest"
import { expectProcessingChildDefaults } from "../__tests__/processingChildDefaults"
import { MetadataDataProcessorRules } from "./rules"
import { fullYAML } from "./__fixtures__/full"
import { minimalYAML } from "./__fixtures__/minimal"

const cases = [
  { fixture: "full.xml", yaml: fullYAML },
  { fixture: "minimal.xml", yaml: minimalYAML },
] as const

describeAppliedObjectYAMLToXMLFixtures({
  itemType: "MetadataDataProcessor",
  rule: MetadataDataProcessorRules,
  importMetaUrl: import.meta.url,
  cases,
  testTitle: "exports $fixture exactly",
  knownXMLDefaults: { includeAttributeFillValue: false },
})

describe("MetadataDataProcessor child defaults", () => {
  it("exports defaults only for supported nested attribute fields", () => {
    expectProcessingChildDefaults(MetadataDataProcessorRules)
  })
})
