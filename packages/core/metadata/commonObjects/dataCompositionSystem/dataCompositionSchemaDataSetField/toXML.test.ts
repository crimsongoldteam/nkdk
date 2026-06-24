import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import {
  appearanceDataCompositionSchemaDataSetField,
  availableValuesDataCompositionSchemaDataSetField,
  folderDataCompositionSchemaDataSetField,
  fullDataCompositionSchemaDataSetField,
  nestedDataCompositionSchemaDataSetField,
} from "./__fixtures__/data"
import "./types"

describe("export DataCompositionSchemaDataSetField to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: fullDataCompositionSchemaDataSetField,
      xmlRootTag: "Field",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports availableValues.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: availableValuesDataCompositionSchemaDataSetField,
      xmlRootTag: "Field",
      path: "availableValues.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports appearance.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: appearanceDataCompositionSchemaDataSetField,
      xmlRootTag: "Field",
      path: "appearance.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports nested-data-set.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: nestedDataCompositionSchemaDataSetField,
      xmlRootTag: "Field",
      path: "nested-data-set.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports folder.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: folderDataCompositionSchemaDataSetField,
      xmlRootTag: "Field",
      path: "folder.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
