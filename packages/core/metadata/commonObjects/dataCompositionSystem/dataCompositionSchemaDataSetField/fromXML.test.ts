import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { fullDataCompositionSchemaDataSetField } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = { type: "DataCompositionSchemaDataSetField" }

describe("import DataCompositionSchemaDataSetField from XML", () => {
  it("round-trips full.xml", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Field",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "Field",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullDataCompositionSchemaDataSetField)
  })
})
