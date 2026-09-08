import { describe, expect, it } from "vitest"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import { testPropertyYamlRoundTrip } from "../../../tests/directConversion"

describe("StringOrNumber export without reference", () => {
  it("does not take the XML type from a previous value", () => {
    const { result } = testAtomicToXML({
      rule: { type: "StringOrNumber" },
      value: 42,
      referenceMetadata: { value: 3, xsiType: "xs:integer" },
      xmlRootTag: "Value",
    })
    expect(result).toBe("<Value>42</Value>")
  })

  it.each(["xs:integer", "xs:decimal", "xs:double", "xs:float", "xs:string"])(
    "preserves %s through serialized YAML annotations",
    (type) => {
      const sourceXML = `<Root><Value xsi:type="${type}">42</Value></Root>`
      const result = testPropertyYamlRoundTrip({ sourceXML, rule: {
        type: "StringOrNumber", xml: "Value", yaml: "Значение",
      } })
      expect(result.yamlText).toContain("!xml/raw")
      expect(result.result.replace(/>\s+</g, "><").replace(/^\ufeff?<\?xml[^>]+>\s*/, "")).toBe(sourceXML)
    },
  )
})
