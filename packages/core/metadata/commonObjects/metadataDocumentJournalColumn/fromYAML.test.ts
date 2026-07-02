import { describe, expect, it } from "vitest"
import { columnsFromYAML, columnsYAML } from "./__fixtures__/data"
import "./register"
import { testImportPropertyFromYAML } from "../../../tests/property/importPropertyFromYAML"

const rule = { type: "MetadataDocumentJournalColumns" } as const

describe("import MetadataDocumentJournalColumns from YAML", () => {
  it("imports collection from YAML map keyed by name", () => {
    const result = testImportPropertyFromYAML({ rule, value: columnsYAML })

    expect(result).toEqual(columnsFromYAML)
  })
})
