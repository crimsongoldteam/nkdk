import { describe, expect, it } from "vitest"
import { testExportPropertyModelThroughYAMLToXML } from "../../../../tests/property/exportPropertyModelThroughYAMLToXML"
import {
  appearanceDataCompositionSchemaDataSetField,
  availableValuesDataCompositionSchemaDataSetField,
  folderDataCompositionSchemaDataSetField,
  fullDataCompositionSchemaDataSetField,
  nestedDataCompositionSchemaDataSetField,
  fullDataCompositionSchemaDataSetFieldYAML,
  availableValuesDataCompositionSchemaDataSetFieldYAML,
  nestedDataCompositionSchemaDataSetFieldYAML,
  folderDataCompositionSchemaDataSetFieldYAML,
} from "./__fixtures__/data"
import "./types"

describe("export DataCompositionSchemaDataSetField to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: fullDataCompositionSchemaDataSetField,
      yaml: fullDataCompositionSchemaDataSetFieldYAML,
      xmlRootTag: "Field",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports availableValues.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: availableValuesDataCompositionSchemaDataSetField,
      yaml: availableValuesDataCompositionSchemaDataSetFieldYAML,
      xmlRootTag: "Field",
      path: "availableValues.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports appearance.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: appearanceDataCompositionSchemaDataSetField,
      xmlRootTag: "Field",
      path: "appearance.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports nested-data-set.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: nestedDataCompositionSchemaDataSetField,
      yaml: nestedDataCompositionSchemaDataSetFieldYAML,
      xmlRootTag: "Field",
      path: "nested-data-set.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports folder.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "DataCompositionSchemaDataSetField" },
      value: folderDataCompositionSchemaDataSetField,
      yaml: folderDataCompositionSchemaDataSetFieldYAML,
      xmlRootTag: "Field",
      path: "folder.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
