import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects"
import "~/metadata/systemEnumerations"
import { testExportAppliedObjectToYAML, testImportAppliedObjectFromXML, testImportAppliedObjectFromYAML } from "~/tests/appliedObject"
import { MetadataCommonModuleRules } from "./rules"
import type { MetadataCommonModule } from "./types"

const fullYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  Глобальный: "Истина",
  ВызовСервера: "Истина",
  Привилегированный: "Истина",
}

describe("import MetadataCommonModule from YAML", () => {
  it("imports full fixture", () => {
    const expected = testImportAppliedObjectFromXML<MetadataCommonModule>({
      rule: MetadataCommonModuleRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(testImportAppliedObjectFromYAML({ rule: MetadataCommonModuleRules, yaml: fullYAML })).toEqual({
      ...expected,
      name: undefined,
    })
  })

  it("round-trips full YAML", () => {
    const imported = testImportAppliedObjectFromYAML({ rule: MetadataCommonModuleRules, yaml: fullYAML })
    expect(testExportAppliedObjectToYAML({ rule: MetadataCommonModuleRules, data: imported })).toEqual(fullYAML)
  })
})
