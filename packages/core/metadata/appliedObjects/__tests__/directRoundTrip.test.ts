import { describe, expect, it } from "vitest"
import { testAppliedObjectFromXMLToYAML, testAppliedObjectFromYAMLToXML } from "../../../tests/directConversion"
import { canonicalXML } from "../../../tests/canonicalXML"
import { appliedObjectModelCases } from "./yamlFixtures"
import { canonicalAccountingRegisterXML } from "./accountingRegisterXML"

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
    const canonical =
      scenario.group === "metadataAccountingRegister" && fixture.fixture === "full.xml"
        ? canonicalAccountingRegisterXML
        : canonicalXML
    expect(canonical(exported.result)).toEqual(canonical(exported.expected))
  })
})
