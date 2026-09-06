import { describe, expect, it } from "vitest"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { ImportSourceReader, importSourceScalar } from "./importSource"

describe("structural extension source reader", () => {
  it("indexes a visited container once for all properties", () => {
    const source = parseStructuralXMLWithoutCompatibility(`<Properties>${Array.from({ length: 100 }, (_, i) => `<Value${i}>${i}</Value${i}>`).join("")}</Properties>`)
    const content = source.content
    let reads = 0
    Object.defineProperty(source, "content", { get() { reads++; return content } })
    const reader = new ImportSourceReader()
    for (let i = 0; i < 100; i++) {
      expect(reader.hasProperty(source, `Value${i}`)).toBe(true)
      expect(importSourceScalar(reader.property(source, `Value${i}`))).toBe(String(i))
    }
    // isXmlElementNode также проверяет content; сами элементы перечисляются один раз.
    expect(reads).toBeLessThan(250)
  })

  it("keeps presence and repeated nodes without reading their compatibility values", () => {
    const source = parseStructuralXMLWithoutCompatibility("<Properties><Empty/><Repeated>A</Repeated><Repeated>B</Repeated></Properties>")
    const reader = new ImportSourceReader()
    expect(reader.hasProperty(source, "Empty")).toBe(true)
    expect(importSourceScalar(reader.property(source, "Empty"))).toBeUndefined()
    expect(reader.hasProperty(source, "Missing")).toBe(false)
    const repeated = reader.property(source, "Repeated")
    expect(Array.isArray(repeated) ? repeated.map(importSourceScalar) : repeated).toEqual(["A", "B"])
  })
})
