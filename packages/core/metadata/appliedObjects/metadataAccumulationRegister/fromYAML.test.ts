import { describe, expect, it } from "vitest"
import {
  testExportAppliedObjectToYAML,
  testImportAppliedObjectFromXML,
  testImportAppliedObjectFromYAML,
} from "~/tests/appliedObject"
import { MetadataAccumulationRegisterRules } from "./rules"
import { MetadataAccumulationRegister } from "./types"

describe("import MetadataAccumulationRegister from YAML", () => {
  it.each([
    { fixture: "full.xml", name: "РегистрНакопленияВсеСвойстваОбороты" },
    { fixture: "minimal.xml", name: "РегистрНакопленияПоУмолчанию" },
  ])("should import YAML exported from $fixture", ({ fixture, name }) => {
    const data = testImportAppliedObjectFromXML<MetadataAccumulationRegister>({
      rule: MetadataAccumulationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const yaml = testExportAppliedObjectToYAML<MetadataAccumulationRegister>({
      rule: MetadataAccumulationRegisterRules,
      data,
    })
    const result = testImportAppliedObjectFromYAML<MetadataAccumulationRegister>({
      rule: MetadataAccumulationRegisterRules,
      yaml,
      name,
    })
    expect(
      testExportAppliedObjectToYAML<MetadataAccumulationRegister>({
        rule: MetadataAccumulationRegisterRules,
        data: result,
      })
    ).toEqual(yaml)
  })
})
