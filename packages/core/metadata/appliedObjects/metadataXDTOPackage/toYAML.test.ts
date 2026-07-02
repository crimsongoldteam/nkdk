import { describe, expect, it } from "vitest"
import "../../commonObjects"
import "../../systemEnumerations"
import { testExportAppliedObjectToYAML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { MetadataXDTOPackageRules } from "./rules"
import type { MetadataXDTOPackage } from "./types"

const cases = [
  {
    fixture: "minimal.xml",
    yaml: {
      Синоним: "Пакет XDTOПо умолчанию",
      ПространствоИмен: "http://www.sample-package.org",
    },
  },
  {
    fixture: "full.xml",
    yaml: {
      Синоним: "Синоним",
      Комментарий: "Комментарий",
      ПространствоИмен: "urn://test",
    },
  },
] as const

describe("export MetadataXDTOPackage to YAML", () => {
  it.each(cases)("exports $fixture", ({ fixture, yaml }) => {
    const data = testImportAppliedObjectFromXML<MetadataXDTOPackage>({
      rule: MetadataXDTOPackageRules,
      importMetaUrl: import.meta.url,
      fixture,
    })

    expect(testExportAppliedObjectToYAML({ rule: MetadataXDTOPackageRules, data })).toEqual(yaml)
  })
})
