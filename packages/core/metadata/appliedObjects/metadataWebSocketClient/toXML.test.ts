import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "../../../tests/appliedObject"
import { MetadataWebSocketClientRules } from "./rules"

import type { MetadataWebSocketClient } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("export MetadataWebSocketClient to XML", () => {
  it.each(["full.xml", "minimal.xml"])("should export %s", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataWebSocketClient>({
      rule: MetadataWebSocketClientRules,
      importMetaUrl: import.meta.url,
      fixture,
    })

    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataWebSocketClientRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })

    expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
  })
})
