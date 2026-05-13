import { describe, expect, it } from "vitest"
import {
  testExportAppliedObjectToYAML,
  testImportAppliedObjectFromXML,
  testImportAppliedObjectFromYAML,
} from "~/tests/appliedObject"
import { MetadataInformationRegisterRules } from "./rules"
import { MetadataInformationRegister } from "./types"

describe("import MetadataInformationRegister from YAML", () => {
  it.each([
    { fixture: "full.xml", name: "РегистрСведенийВсеСвойстваНезависимый" },
    { fixture: "minimal.xml", name: "РегистрСведенийПоУмолчанию" },
    { fixture: "reg.xml", name: "РегистрСведенийПодчиненРегистратору" },
  ])("should import YAML exported from $fixture", ({ fixture, name }) => {
    const data = testImportAppliedObjectFromXML<MetadataInformationRegister>({
      rule: MetadataInformationRegisterRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const yaml = testExportAppliedObjectToYAML<MetadataInformationRegister>({
      rule: MetadataInformationRegisterRules,
      data,
    })
    const result = testImportAppliedObjectFromYAML<MetadataInformationRegister>({
      rule: MetadataInformationRegisterRules,
      yaml,
      name,
    })
    expect(
      testExportAppliedObjectToYAML<MetadataInformationRegister>({
        rule: MetadataInformationRegisterRules,
        data: result,
      })
    ).toEqual(yaml)
  })
})
