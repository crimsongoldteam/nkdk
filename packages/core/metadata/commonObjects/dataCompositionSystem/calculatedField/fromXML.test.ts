import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyToXML } from "../../../../tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { appearanceCalculatedField, availableValuesCalculatedField, fullCalculatedField } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = { type: "CalculatedField" }

describe("import CalculatedField from XML", () => {
  it("imports full.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "CalculatedField",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(fullCalculatedField)
  })

  it("imports appearance.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "appearance.xml",
      xmlRootTag: "CalculatedField",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(appearanceCalculatedField)
  })

  it("imports available values", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "availableValues.xml",
      xmlRootTag: "CalculatedField",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(availableValuesCalculatedField)
  })

  it("round-trips availableValues.xml", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "availableValues.xml",
      xmlRootTag: "CalculatedField",
      importMetaUrl: import.meta.url,
    })

    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "CalculatedField",
      path: "availableValues.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
