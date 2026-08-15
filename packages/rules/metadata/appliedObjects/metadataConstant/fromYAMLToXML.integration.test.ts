import { describeAppliedObjectYAMLToXMLFixtures } from "../../../tests/appliedObject/unifiedFixtureConversion"
import { MetadataConstantRules } from "./rules"
import { fullYAML } from "./__fixtures__/full"
import { minimalYAML } from "./__fixtures__/minimal"

const cases = [
  { fixture: "full.xml", yaml: fullYAML },
  { fixture: "minimal.xml", yaml: minimalYAML },
] as const

describeAppliedObjectYAMLToXMLFixtures({
  itemType: "MetadataConstant",
  rule: MetadataConstantRules,
  importMetaUrl: import.meta.url,
  cases,
  testTitle: "exports $fixture exactly",
})
