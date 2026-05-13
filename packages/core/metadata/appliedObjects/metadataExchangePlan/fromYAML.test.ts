import { describe, expect, it } from "vitest"
import {
  testExportAppliedObjectToYAML,
  testImportAppliedObjectFromXML,
  testImportAppliedObjectFromYAML,
} from "~/tests/appliedObject"
import { MetadataExchangePlanRules } from "./rules"
import { MetadataExchangePlan } from "./types"

describe("import MetadataExchangePlan from YAML", () => {
  it.each([
    { fixture: "full.xml", name: "ПланОбменаВсеСвойства" },
    { fixture: "minimal.xml", name: "ПланОбменаПоУмолчанию" },
  ])("should import YAML exported from $fixture", ({ fixture, name }) => {
    const data = testImportAppliedObjectFromXML<MetadataExchangePlan>({
      rule: MetadataExchangePlanRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const yaml = testExportAppliedObjectToYAML<MetadataExchangePlan>({
      rule: MetadataExchangePlanRules,
      data,
    })
    const result = testImportAppliedObjectFromYAML<MetadataExchangePlan>({
      rule: MetadataExchangePlanRules,
      yaml,
      name,
    })
    expect(
      testExportAppliedObjectToYAML<MetadataExchangePlan>({
        rule: MetadataExchangePlanRules,
        data: result,
      })
    ).toEqual(yaml)
  })
})
