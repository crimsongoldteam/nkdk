import { describe, expect, it } from "vitest"
import { testAppliedObjectFromXMLToYAML, testAppliedObjectFromYAMLToXML } from "../../../tests/directConversion"
import { canonicalSnapshot13XML } from "../../../tests/canonicalXML"
import { appliedObjectModelCases } from "./yamlFixtures"

describe("applied object direct XML → YAML → XML", () => {
  it.each(appliedObjectModelCases)("$label direct XML → YAML → XML", ({ scenario, fixture }) => {
    const imported = testAppliedObjectFromXMLToYAML({
      rule: scenario.rule,
      importMetaUrl: scenario.importMetaUrl,
      fixture: fixture.fixture,
      name: fixture.name,
    })
    const exported = testAppliedObjectFromYAMLToXML({
      rule: scenario.rule,
      importMetaUrl: scenario.importMetaUrl,
      fixture: fixture.fixture,
      name: fixture.name,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toBeDefined()
    expect(canonicalSnapshot13XML(exported.result)).toEqual(canonicalSnapshot13XML(exported.expected))
  })
})
