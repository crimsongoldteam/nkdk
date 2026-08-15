import { beforeAll, describe, expect, it } from "vitest"
import { canonicalXML } from "../../../tests/canonicalXML"
import { testAppliedObjectFromXMLToYAML, testAppliedObjectFromYAMLToXML } from "../../../tests/directConversion"
import { canonicalAccountingRegisterXML } from "./accountingRegisterXML"
import { appliedObjectModelCases } from "./yamlFixtures"

describe("applied object direct XML → YAML → XML", () => {
  const prepared = new Map<string, { yaml: unknown; result: unknown; expected: unknown }>()

  beforeAll(() => {
    for (const { label, scenario, fixture } of appliedObjectModelCases) {
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
      const canonical =
        scenario.group === "metadataAccountingRegister" && fixture.fixture === "full.xml"
          ? canonicalAccountingRegisterXML
          : canonicalXML
      prepared.set(label, {
        yaml: imported.yaml,
        result: canonical(exported.result),
        expected: canonical(exported.expected),
      })
    }
  })

  it.each(appliedObjectModelCases)("$label direct XML → YAML → XML", ({ label }) => {
    const result = prepared.get(label)
    if (result === undefined) throw new Error(`Не подготовлен direct round-trip: ${label}`)

    expect(result.yaml).toBeDefined()
    expect(result.result).toEqual(result.expected)
  })
})
