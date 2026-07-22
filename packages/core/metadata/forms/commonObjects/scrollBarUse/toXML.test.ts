import { describe, it, expect } from "vitest"
import { ConfigurationContextWithExportToXML } from "../../../context/types"
import { PropertyRule, callAtomicToXML } from "../../../orchestration"

describe("exportScrollBarUseToXML (ScrollBarUseBoolean)", () => {
  const context = {} as unknown as ConfigurationContextWithExportToXML
  const rule = {
    type: "ScrollBarUseBoolean",
  } as PropertyRule

  it("returns undefined for undefined and AutoUse", () => {
    expect(callAtomicToXML({ context, rule, value: undefined })).toBeUndefined()
    expect(callAtomicToXML({ context, rule, value: "AutoUse" })).toBeUndefined()
  })

  it("converts DontUse to false", () => {
    expect(callAtomicToXML({ context, rule, value: "DontUse" })).toBe(false)
  })

  it("converts UseAlways to true", () => {
    expect(callAtomicToXML({ context, rule, value: "UseAlways" })).toBe(true)
  })
})
