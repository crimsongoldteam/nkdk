import { beforeAll, describe, expect, it } from "vitest"
import { canonicalXML } from "../../../tests/canonicalXML"
import {
  createDirectRoundTripContexts,
  testAppliedObjectFromXMLToYAML,
  testAppliedObjectFromYAMLToXML,
} from "../../../tests/directConversion"
import { canonicalAccountingRegisterXML } from "./accountingRegisterXML"
import { appliedObjectModelCases } from "./yamlFixtures"
import { MetadataExchangePlanRules } from "../metadataExchangePlan/rules"

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

  it("сохраняет полный XML собственного плана обмена расширения", () => {
    const logicalAddress = "ExchangePlan.дкз_ОбменТипы"
    const fixture = "ownExtensionExchangePlan/ExchangePlans/дкз_ОбменТипы.xml"
    const importMetaUrl = import.meta.resolve("../../importFromXml/importConfigurationExtension.integration.test.ts")
    const contexts = createDirectRoundTripContexts({ logicalAddress })
    const importContext = {
      ...contexts.importContext,
      fromXML: {
        ...contexts.importContext.fromXML,
        metadataItemAugmenter: "configurationExtension",
      },
    }
    const exportContext = contexts.exportContext()
    const ownExtensionExportContext = {
      ...exportContext,
      exportToXML: {
        ...exportContext.exportToXML,
        componentKind: "configurationExtension",
        xmlDefaultVariantByLogicalAddress: { [logicalAddress]: "full" as const },
      },
    }
    const imported = testAppliedObjectFromXMLToYAML({
      rule: MetadataExchangePlanRules,
      importMetaUrl,
      fixture,
      context: importContext,
    })
    const exported = testAppliedObjectFromYAMLToXML({
      rule: MetadataExchangePlanRules,
      importMetaUrl,
      fixture,
      yaml: imported.yaml,
      context: ownExtensionExportContext,
    })

    expect(canonicalXML(exported.result)).toEqual(canonicalXML(exported.expected))
  })
})
