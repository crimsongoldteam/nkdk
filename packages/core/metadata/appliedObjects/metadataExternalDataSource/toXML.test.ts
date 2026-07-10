import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { MetadataExternalDataSourceRules } from "./rules"

import type { MetadataExternalDataSource } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("export MetadataExternalDataSource to XML", () => {
  it.each(["full.xml", "minimal.xml"])("should export %s", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataExternalDataSource>({
      rule: MetadataExternalDataSourceRules,
      importMetaUrl: import.meta.url,
      fixture,
    })

    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataExternalDataSourceRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })

    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
