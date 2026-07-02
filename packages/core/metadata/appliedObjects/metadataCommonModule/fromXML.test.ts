import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { MetadataCommonModuleRules } from "./rules"

import type { MetadataCommonModule } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("import MetadataCommonModule from XML", () => {
  it.each(["full.xml", "minimal.xml", "client.xml", "reusable.xml"])("round-trips %s", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataCommonModule>({
      rule: MetadataCommonModuleRules,
      importMetaUrl: import.meta.url,
      fixture,
    })

    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataCommonModuleRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })

    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
