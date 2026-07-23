import { describeAppliedObjectYAMLToXMLFixtures } from "../../../tests/appliedObject/unifiedFixtureConversion"
import { MetadataReportRules } from "./rules"
import { minimalYAML } from "./__fixtures__/minimal"

const cases = [{ fixture: "minimal.xml", yaml: minimalYAML }] as const

describeAppliedObjectYAMLToXMLFixtures({
  itemType: "MetadataReport",
  rule: MetadataReportRules,
  importMetaUrl: import.meta.url,
  cases,
  testTitle: "exports $fixture exactly",
})
