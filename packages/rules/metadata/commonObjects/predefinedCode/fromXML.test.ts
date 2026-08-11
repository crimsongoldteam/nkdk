import { describe, expect, it } from "vitest"
import { importPredefinedCodeFromXML } from "./fromXML"

const context = {} as never
const rule = { type: "PredefinedCode" } as never

describe("importPredefinedCodeFromXML", () => {
  it("imports typed decimal code as number", () => {
    const result = importPredefinedCodeFromXML(context, rule, {
      "_xsi:type": "xs:decimal",
      "#text": "0",
    })

    expect(result).toBe(0)
  })

  it("imports typed integer code as number", () => {
    const result = importPredefinedCodeFromXML(context, rule, {
      "_xsi:type": "xs:integer",
      "#text": "42",
    })

    expect(result).toBe(42)
  })

  it("imports untyped code as string", () => {
    const result = importPredefinedCodeFromXML(context, rule, "0")

    expect(result).toBe("0")
  })

  it("keeps untyped code text unchanged", () => {
    const result = importPredefinedCodeFromXML(context, rule, "103    ")

    expect(result).toBe("103    ")
  })
})
