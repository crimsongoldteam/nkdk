import { describe, expect, it } from "vitest"
import "../../commonObjects"
import "../../systemEnumerations"
import {
  testExportAppliedObjectToYAML,
  testImportAppliedObjectFromXML,
  testImportAppliedObjectFromYAML,
} from "../../../tests/appliedObject"
import { MetadataXDTOPackageRules } from "./rules"
import type { MetadataXDTOPackage } from "./types"

const fullYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  ПространствоИмен: "urn://test",
}

describe("import MetadataXDTOPackage from YAML", () => {
  it("imports full fixture", () => {
    const expected = testImportAppliedObjectFromXML<MetadataXDTOPackage>({
      rule: MetadataXDTOPackageRules,
      importMetaUrl: import.meta.url,
      fixture: "full.xml",
    })

    expect(testImportAppliedObjectFromYAML({ rule: MetadataXDTOPackageRules, yaml: fullYAML })).toEqual({
      ...expected,
      name: undefined,
    })
  })

  it("round-trips full YAML without Package.bin", () => {
    const imported = testImportAppliedObjectFromYAML({ rule: MetadataXDTOPackageRules, yaml: fullYAML })
    expect(testExportAppliedObjectToYAML({ rule: MetadataXDTOPackageRules, data: imported })).toEqual(fullYAML)
  })
})
