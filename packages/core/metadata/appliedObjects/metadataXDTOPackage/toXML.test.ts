import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataXDTOPackageRules } from "./rules"

import type { MetadataXDTOPackage } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("export MetadataXDTOPackage to XML", () => {
  it.each(["full.xml", "minimal.xml"])("should export %s", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataXDTOPackage>({
      rule: MetadataXDTOPackageRules,
      importMetaUrl: import.meta.url,
      fixture,
    })

    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataXDTOPackageRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })

    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
