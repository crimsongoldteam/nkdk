import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects"
import "~/metadata/systemEnumerations"
import { testExportAppliedObjectToYAML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataExternalDataSourceRules } from "./rules"
import type { MetadataExternalDataSource } from "./types"

const cases = [
  {
    fixture: "minimal.xml",
    yaml: { Синоним: "Внешний источник данных по умолчанию" },
  },
  {
    fixture: "full.xml",
    yaml: {
      Синоним: "Синоним",
      Комментарий: "Комментарий",
      РежимУправленияБлокировкойДанных: "АвтоматическийИУправляемый",
    },
  },
] as const

describe("export MetadataExternalDataSource to YAML", () => {
  it.each(cases)("exports $fixture", ({ fixture, yaml }) => {
    const data = testImportAppliedObjectFromXML<MetadataExternalDataSource>({
      rule: MetadataExternalDataSourceRules,
      importMetaUrl: import.meta.url,
      fixture,
    })

    expect(testExportAppliedObjectToYAML({ rule: MetadataExternalDataSourceRules, data })).toEqual(yaml)
  })
})
