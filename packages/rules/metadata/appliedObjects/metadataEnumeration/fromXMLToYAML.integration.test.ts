import { describeAppliedObjectXMLToYAMLFixtures } from "../../../tests/appliedObject/unifiedFixtureConversion"
import { MetadataEnumerationRules } from "./rules"
import { fullYAML } from "./__fixtures__/full"
import { minimalYAML } from "./__fixtures__/minimal"

const cases = [
  { fixture: "full.xml", yaml: fullYAML },
  { fixture: "minimal.xml", yaml: minimalYAML },
] as const

describeAppliedObjectXMLToYAMLFixtures({
  itemType: "MetadataEnumeration",
  rule: MetadataEnumerationRules,
  importMetaUrl: import.meta.url,
  cases,
  testTitle: "exports $fixture directly to YAML",
})
