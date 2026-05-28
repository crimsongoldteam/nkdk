import { describe, expect, it } from "vitest"
import {
  testExportAppliedObjectToYAML,
  testImportAppliedObjectFromXML,
  testImportAppliedObjectFromYAML,
} from "~/tests/appliedObject"
import { appliedObjectModelCases } from "./yamlFixtures"

describe("applied object YAML model round-trip", () => {
  it.each(appliedObjectModelCases)("$label", ({ scenario, fixture }) => {
    const model = testImportAppliedObjectFromXML({
      rule: scenario.rule,
      importMetaUrl: scenario.importMetaUrl,
      fixture: fixture.fixture,
    })
    expect(model).toBeDefined()
    const yaml = testExportAppliedObjectToYAML({
      rule: scenario.rule,
      data: model,
    })
    expect(yaml).toBeDefined()
    const imported = testImportAppliedObjectFromYAML({
      rule: scenario.rule,
      yaml,
      name: fixture.name,
    })
    expect(imported).toBeDefined()

    expect(
      testExportAppliedObjectToYAML({
        rule: scenario.rule,
        data: imported,
      })
    ).toEqual(yaml)
  })
})
