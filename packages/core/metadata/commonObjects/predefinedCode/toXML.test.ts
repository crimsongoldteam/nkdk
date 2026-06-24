import { describe, expect, it } from "vitest"
import { exportPredefinedCodeToXML } from "./toXML"

const context = {} as never
const rule = { type: "PredefinedCode" } as never

describe("exportPredefinedCodeToXML", () => {
  it("exports number as typed decimal XML", () => {
    const result = exportPredefinedCodeToXML(context, rule, 0)

    expect(result).toEqual({
      "_xsi:type": "xs:decimal",
      "#text": "0",
    })
  })

  it("exports string as plain XML text", () => {
    const result = exportPredefinedCodeToXML(context, rule, "0")

    expect(result).toBe("0")
  })

  it("keeps string text unchanged", () => {
    const result = exportPredefinedCodeToXML(context, rule, "103    ")

    expect(result).toBe("103    ")
  })
})
