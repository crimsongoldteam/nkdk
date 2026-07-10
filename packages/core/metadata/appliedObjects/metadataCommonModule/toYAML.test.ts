import { describe, expect, it } from "vitest"
import "../../commonObjects"
import "../../systemEnumerations"
import { testExportAppliedObjectToYAML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { MetadataCommonModuleRules } from "./rules"
import type { MetadataCommonModule } from "./types"

const cases = [
  {
    fixture: "minimal.xml",
    yaml: {},
  },
  {
    fixture: "full.xml",
    yaml: {
      Синоним: "Синоним",
      Комментарий: "Комментарий",
      Глобальный: "Истина",
      ВызовСервера: "Истина",
      Привилегированный: "Истина",
    },
  },
] as const

describe("export MetadataCommonModule to YAML", () => {
  it.each(cases)("exports $fixture", ({ fixture, yaml }) => {
    const data = testImportAppliedObjectFromXML<MetadataCommonModule>({
      rule: MetadataCommonModuleRules,
      importMetaUrl: import.meta.url,
      fixture,
    })

    expect(testExportAppliedObjectToYAML({ rule: MetadataCommonModuleRules, data })).toEqual(yaml)
  })
})
