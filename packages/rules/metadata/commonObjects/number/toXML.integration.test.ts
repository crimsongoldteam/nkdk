import { describe, expect, it, vi } from "vitest"
import { isXmlElementNode } from "@nkdk/runtime"
import * as rulesRuntime from "../../ruleRuntime"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import { typedNumberRule, typedNumberValue } from "./__fixtures__/data"

describe("exportNumberToXML", () => {
  it("exports typed decimal to XML", () => {
    const importProperty = rulesRuntime.importPropertyFromXML
    const reader = vi.spyOn(rulesRuntime, "importPropertyFromXML").mockImplementation(params => {
      expect(isXmlElementNode(params.value)).toBe(true)
      return importProperty(params)
    })
    try {
      const { result, expectedResult } = testAtomicToXML({
        rule: typedNumberRule,
        value: typedNumberValue,
        xmlRootTag: "MinValue",
        path: "typed.xml",
        importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(expectedResult)
    } finally {
      reader.mockRestore()
    }
  })
})
