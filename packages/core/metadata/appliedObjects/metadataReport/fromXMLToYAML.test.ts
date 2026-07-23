import { describeAppliedObjectXMLToYAMLFixtures } from "../../../tests/appliedObject/unifiedFixtureConversion"
import { MetadataReportRules } from "./rules"
import { fullYAML } from "./__fixtures__/full"
import { minimalYAML } from "./__fixtures__/minimal"

const cases = [
  { fixture: "full.xml", yaml: fullYAML, yamlAssertion: "matchObject" },
  { fixture: "minimal.xml", yaml: minimalYAML },
  {
    fixture: "dcs.xml",
    yaml: { ОсновнаяСхемаКомпоновкиДанных: "ОсновнаяСхемаКомпоновкиДанных" },
    yamlAssertion: "matchObject",
  },
] as const

describeAppliedObjectXMLToYAMLFixtures({
  itemType: "MetadataReport",
  rule: MetadataReportRules,
  importMetaUrl: import.meta.url,
  cases,
  testTitle: "exports $fixture directly to YAML",
})
