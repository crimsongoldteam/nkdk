import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "@nkdk/runtime"
import { readDcsText } from "./dcsText"

describe("readDcsText", () => {
  it.each([
    ["<Value/>", ""],
    ["<Value>Текст</Value>", "Текст"],
    ['<Value xsi:type="xs:string">Текст</Value>', "Текст"],
    ["<Value>До<![CDATA[ и после]]></Value>", "До и после"],
  ])("reads text without a compatibility tree: %s", (xml, expected) => {
    const value = parseXmlDocumentWithSaxes(xml).roots[0]!
    Object.defineProperty(value, "compatibilityValue", { get() { throw new Error("Compatibility XML must not be read") } })
    expect(readDcsText(value, "missing", "invalid")).toBe(expected)
  })

  it.each(['<Value xsi:type="xs:string"/>', "<Value><Child/></Value>"])("rejects content without text: %s", (xml) => {
    expect(() => readDcsText(parseXmlDocumentWithSaxes(xml).roots[0], "missing", "invalid")).toThrow("invalid")
  })

  it("preserves missing and invalid diagnostics", () => {
    expect(() => readDcsText(undefined, "missing", "invalid")).toThrow("missing")
    expect(() => readDcsText(1, "missing", "invalid")).toThrow("invalid")
    expect(readDcsText({ "#text": "Текст" }, "missing", "invalid")).toBe("Текст")
    expect(readDcsText("", "missing", "invalid")).toBe("")
  })
})
