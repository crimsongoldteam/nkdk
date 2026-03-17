import { describe, expect, it } from "vitest"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule, exportPropertyToXML } from "~/metadata/orchestration"
import "./toXML"

describe("exportScrollBarUseToXML (ScrollBarUseBoolean)", () => {
  const context = {} as unknown as ConfigurationContextWithExportToXML
  const rule = {
    type: "ScrollBarUseBoolean",
  } as PropertyRule

  it("returns undefined for undefined and AutoUse", () => {
    expect(exportPropertyToXML({ context, rule, value: undefined })).toBeUndefined()
    expect(exportPropertyToXML({ context, rule, value: "AutoUse" })).toBeUndefined()
  })

  it("converts DontUse to false", () => {
    expect(exportPropertyToXML({ context, rule, value: "DontUse" })).toBe(false)
  })

  it("converts UseAlways to true", () => {
    expect(exportPropertyToXML({ context, rule, value: "UseAlways" })).toBe(true)
  })
})
