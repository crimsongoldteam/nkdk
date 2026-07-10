import { describe, expect, it } from "vitest"
import { fullFormCommands, minimalFormCommands } from "./__fixtures__/data"
import { exportPropertyToXML, PropertyRule } from "../../../orchestration"
import { mockContextToXML } from "../../../../tests/mockContext"
import { testExportPropertyToXML } from "../../../../tests/property/exportPropertyToXML"

import "./types"

const rule: PropertyRule = {
  type: "FormCommands",
  yaml: "Команды",
  defaultValue: [],
}

describe("export FormCommands to XML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should export full to XML", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullFormCommands,
      xmlRootTag: "Commands",
      path: "full.xml",
      importMetaUrl: import.meta.url,
      referenceMetadata: undefined,
    })

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: minimalFormCommands,
      xmlRootTag: "Commands",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
      referenceMetadata: undefined,
    })

    expect(result).toEqual(expectedResult)
  })
})
